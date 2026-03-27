const fs = require('fs');
const path = require('path');

// Try to load js-yaml, install if not available
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  console.log('Installing js-yaml...');
  require('child_process').execSync('npm install js-yaml --no-save', { stdio: 'inherit' });
  yaml = require('js-yaml');
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ROUTES_DIR = path.join(__dirname, 'backend', 'src', 'routes');
const POSTMAN_DIR = path.join(__dirname, 'postman', 'collections', 'Football Field Booking API');

// Route prefix mapping from server.js
const ROUTE_PREFIXES = {
  authRoutes: '/api/auth',
  userRoutes: '/api/users',
  fieldRoutes: '/api/fields',
  bookingRoutes: '/api/bookings',
  teamRoutes: '/api/teams',
  publicTeamRoutes: '/api/public/teams',
  publicScheduleRoutes: '/api/public/schedule',
  teamMemberRoutes: '/api/team-members',
  matchResultRoutes: '/api/match-results',
  notificationRoutes: '/api/notifications',
  ratingRoutes: '/api/ratings',
  dashboardRoutes: '/api/dashboard',
  realtimeRoutes: '/api/realtime',
  ownerMvpRoutes: '/api/owner-mvp',
  analyticsRoutes: '/api/analytics',
  paymentRoutes: '/api/payments',
  improvedAuthRoutes: '/api/auth', // alias
};

// ─── 1. PARSE ROUTE FILES ────────────────────────────────────────────────────
function parseRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.js');
  const prefix = ROUTE_PREFIXES[fileName] || '/api/unknown';

  const routes = [];

  // Match router.METHOD(path, ...middlewares, handler)
  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/gi;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const fullPath = prefix + routePath;

    // Check if route uses auth middleware
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const lineEnd = content.indexOf('\n', match.index + match[0].length);
    const fullLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);

    const requiresAuth = /protect|authenticate|auth|isAdmin|isOwner|isFieldOwner/i.test(fullLine);
    const isAdmin = /isAdmin|adminOnly|authorize\s*\(\s*['"]admin/i.test(fullLine);
    const isFieldOwner = /isFieldOwner|fieldOwner|authorize\s*\(\s*['"]field_owner/i.test(fullLine);

    routes.push({
      method,
      path: fullPath,
      routePath,
      requiresAuth,
      isAdmin,
      isFieldOwner,
      sourceFile: fileName,
    });
  }

  return routes;
}

function getAllRoutes() {
  const routeFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js'));
  let allRoutes = [];
  for (const file of routeFiles) {
    const routes = parseRouteFile(path.join(ROUTES_DIR, file));
    allRoutes = allRoutes.concat(routes);
  }
  return allRoutes;
}

// ─── 2. PARSE POSTMAN YAML FILES ─────────────────────────────────────────────
function findYamlFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === '.resources') continue; // skip metadata dirs
      results = results.concat(findYamlFiles(fullPath));
    } else if (item.name.endsWith('.request.yaml')) {
      results.push(fullPath);
    }
  }
  return results;
}

function parsePostmanRequest(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let doc;
  try {
    doc = yaml.load(content);
  } catch (e) {
    return { file: filePath, error: `YAML parse error: ${e.message}` };
  }

  const folder = path.basename(path.dirname(filePath));
  const fileName = path.basename(filePath, '.request.yaml');

  // Extract headers
  const headers = (doc.headers || []).map(h => ({ key: h.key, value: h.value, disabled: h.disabled || false }));
  const hasAuthHeader = headers.some(h => h.key && h.key.toLowerCase() === 'authorization' && !h.disabled);

  // Extract body fields
  let bodyFields = [];
  let bodyType = null;
  if (doc.body) {
    bodyType = doc.body.type;
    if (doc.body.type === 'json' && doc.body.content) {
      try {
        const parsed = JSON.parse(doc.body.content);
        bodyFields = Object.keys(parsed);
      } catch (e) {
        bodyFields = ['[JSON_PARSE_ERROR]'];
      }
    } else if (doc.body.type === 'formdata' && Array.isArray(doc.body.content)) {
      bodyFields = doc.body.content.map(f => f.key);
    } else if (doc.body.type === 'urlencoded' && Array.isArray(doc.body.content)) {
      bodyFields = doc.body.content.map(f => f.key);
    }
  }

  // Extract query params
  const queryParams = (doc.queryParams || []).map(q => ({ key: q.key, value: q.value }));

  // Extract path variables
  const pathVariables = (doc.pathVariables || []).map(p => ({ key: p.key, value: p.value }));

  // Check for scripts
  const scripts = (doc.scripts || []).map(s => ({ type: s.type, hasCode: !!(s.code && s.code.trim()) }));

  // Check auth
  let authType = null;
  if (doc.auth) {
    authType = doc.auth.type;
  }

  return {
    name: doc.name || fileName,
    folder,
    file: path.relative(POSTMAN_DIR, filePath),
    kind: doc.$kind,
    method: doc.method,
    url: doc.url,
    hasAuthHeader,
    authType,
    headers,
    bodyType,
    bodyFields,
    queryParams,
    pathVariables,
    scripts,
  };
}

// ─── 3. MATCH REQUESTS TO ROUTES ─────────────────────────────────────────────
function normalizeUrl(url) {
  if (!url) return '';
  // Replace {{base_url}} with empty, replace {{var}} with :var
  let normalized = url
    .replace(/\{\{base_url\}\}/g, '')
    .replace(/\{\{([^}]+)\}\}/g, ':$1');
  // Remove trailing slash
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized;
}

function normalizeRoutePath(routePath) {
  // Express :param to normalized form
  return routePath.replace(/\/$/, '');
}

function matchRoute(requestUrl, routes) {
  const normalizedReq = normalizeUrl(requestUrl);
  if (!normalizedReq) return null;

  // Try exact match first
  for (const route of routes) {
    if (normalizeRoutePath(route.path) === normalizedReq) {
      return { ...route, matchType: 'exact' };
    }
  }

  // Try pattern match (replace :param with regex)
  for (const route of routes) {
    const pattern = normalizeRoutePath(route.path)
      .replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(normalizedReq)) {
      return { ...route, matchType: 'pattern' };
    }
  }

  return null;
}

// ─── 4. RUN AUDIT ─────────────────────────────────────────────────────────────
function runAudit() {
  console.log('=== FOOTBALL FIELD BOOKING API - COMPREHENSIVE AUDIT ===\n');

  // Parse all routes
  const allRoutes = getAllRoutes();
  console.log(`[1] Parsed ${allRoutes.length} backend routes from ${fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js')).length} route files\n`);

  // Parse all Postman requests
  const yamlFiles = findYamlFiles(POSTMAN_DIR);
  const requests = yamlFiles.map(parsePostmanRequest);
  console.log(`[2] Parsed ${requests.length} Postman request YAML files\n`);

  // Match and audit
  const auditResults = [];
  const issues = [];

  for (const req of requests) {
    if (req.error) {
      issues.push({ request: req.file, issue: req.error });
      continue;
    }

    const matchedRoute = matchRoute(req.url, allRoutes.filter(r => r.method === req.method));
    const matchedRouteAnyMethod = !matchedRoute ? matchRoute(req.url, allRoutes) : null;

    const audit = {
      name: req.name,
      folder: req.folder,
      file: req.file,
      method: req.method,
      url: req.url,
      normalizedUrl: normalizeUrl(req.url),
      // Auth analysis
      hasAuthHeader: req.hasAuthHeader,
      authType: req.authType,
      inheritsCollectionAuth: !req.hasAuthHeader && !req.authType, // will use collection-level bearer
      // Body analysis
      bodyType: req.bodyType,
      bodyFields: req.bodyFields,
      // Query & path
      queryParams: req.queryParams,
      pathVariables: req.pathVariables,
      // Scripts
      scripts: req.scripts,
      // Route matching
      routeMatch: matchedRoute ? {
        matchType: matchedRoute.matchType,
        backendPath: matchedRoute.path,
        requiresAuth: matchedRoute.requiresAuth,
        isAdmin: matchedRoute.isAdmin,
        isFieldOwner: matchedRoute.isFieldOwner,
        sourceFile: matchedRoute.sourceFile,
      } : null,
      methodMismatch: !matchedRoute && matchedRouteAnyMethod ? {
        expectedMethod: matchedRouteAnyMethod.method,
        actualMethod: req.method,
        backendPath: matchedRouteAnyMethod.path,
      } : null,
    };

    // Detect issues
    const reqIssues = [];

    if (!matchedRoute && !matchedRouteAnyMethod) {
      reqIssues.push('NO_ROUTE_MATCH: URL does not match any backend route');
    }

    if (matchedRoute && matchedRoute.requiresAuth && !req.hasAuthHeader && !req.authType) {
      // This is OK if collection-level auth is set (bearer with {{auth_token}})
      // But flag if the route needs auth and there's explicitly noauth
      if (req.authType === 'noauth') {
        reqIssues.push('AUTH_MISSING: Route requires auth but request has noauth');
      }
    }

    if (audit.methodMismatch) {
      reqIssues.push(`METHOD_MISMATCH: Request uses ${req.method} but route expects ${matchedRouteAnyMethod.method}`);
    }

    // Check for undefined variables in body
    if (req.bodyType === 'json' && req.bodyFields.length > 0) {
      // Read raw content to check for {{undefined}} vars
      const rawContent = fs.readFileSync(path.join(POSTMAN_DIR, req.file), 'utf8');
      const varMatches = rawContent.match(/\{\{([^}]+)\}\}/g) || [];
      const knownVars = ['base_url', 'auth_token', 'user_id', 'field_id', 'booking_id', 'team_id',
        'team_member_id', 'notification_id', 'rating_id', 'match_result_id', 'role_request_id',
        'test_email', 'test_password', 'reset_token'];
      const unknownVars = varMatches
        .map(v => v.replace(/\{\{|\}\}/g, ''))
        .filter(v => !knownVars.includes(v) && !v.startsWith('$'));
      if (unknownVars.length > 0) {
        reqIssues.push(`UNDEFINED_VARS: Uses variables not in env/collection: ${unknownVars.join(', ')}`);
      }
    }

    audit.issues = reqIssues;
    auditResults.push(audit);

    if (reqIssues.length > 0) {
      issues.push({ request: req.name, file: req.file, issues: reqIssues });
    }
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  const summary = {
    totalBackendRoutes: allRoutes.length,
    totalPostmanRequests: requests.length,
    requestsWithRouteMatch: auditResults.filter(a => a.routeMatch).length,
    requestsWithNoMatch: auditResults.filter(a => !a.routeMatch && !a.methodMismatch).length,
    requestsWithMethodMismatch: auditResults.filter(a => a.methodMismatch).length,
    requestsWithExplicitAuth: auditResults.filter(a => a.hasAuthHeader || a.authType).length,
    requestsInheritingAuth: auditResults.filter(a => a.inheritsCollectionAuth).length,
    requestsWithBody: auditResults.filter(a => a.bodyType).length,
    requestsWithScripts: auditResults.filter(a => a.scripts && a.scripts.length > 0).length,
    totalIssues: issues.length,
  };

  // ─── UNMATCHED ROUTES (backend routes with no Postman request) ────────────
  const matchedPaths = new Set(auditResults.filter(a => a.routeMatch).map(a => a.routeMatch.backendPath + ':' + a.method));
  const unmatchedRoutes = allRoutes.filter(r => !matchedPaths.has(r.path + ':' + r.method));

  // ─── OUTPUT ───────────────────────────────────────────────────────────────
  const fullReport = {
    summary,
    backendRoutes: allRoutes,
    unmatchedBackendRoutes: unmatchedRoutes,
    postmanRequests: auditResults,
    issues,
  };

  // Print summary
  console.log('─── SUMMARY ───────────────────────────────────────────');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n─── ISSUES FOUND ──────────────────────────────────────');
  if (issues.length === 0) {
    console.log('No issues found!');
  } else {
    for (const issue of issues) {
      console.log(`\n  [!] ${issue.request || issue.file}`);
      if (issue.issues) {
        for (const i of issue.issues) {
          console.log(`      - ${i}`);
        }
      } else if (issue.issue) {
        console.log(`      - ${issue.issue}`);
      }
    }
  }

  console.log('\n─── UNMATCHED BACKEND ROUTES (no Postman request) ─────');
  if (unmatchedRoutes.length === 0) {
    console.log('All backend routes have matching Postman requests!');
  } else {
    for (const r of unmatchedRoutes) {
      console.log(`  ${r.method.padEnd(7)} ${r.path}  (${r.sourceFile})`);
    }
  }

  // Write full JSON report
  const reportPath = path.join(__dirname, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
  console.log(`\n─── FULL REPORT ───────────────────────────────────────`);
  console.log(`Written to: ${reportPath}`);

  // Also print the full JSON to stdout
  console.log('\n─── FULL AUDIT DATA (JSON) ────────────────────────────');
  console.log(JSON.stringify(fullReport, null, 2));
}

runAudit();
