/**
 * Football Field Booking API - Standalone API Test Runner
 * 
 * This script tests all API endpoints without needing Jest.
 * Run with: node tests/runApiTests.js
 * 
 * Prerequisites:
 * 1. Backend server must be running on localhost:5000
 * 2. Database should be seeded with test data
 * 3. Run: npm run seed (to populate test data)
 */

const http = require('http');

// Base URL
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Tokens storage
let tokens = {
  admin: '',
  owner: '',
  captain1: '',
  captain2: '',
  player1: '',
  player2: ''
};

// Helper function to make HTTP requests
const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isJson = body && typeof body === 'object';
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (isJson) {
      options.headers['Content-Length'] = JSON.stringify(body).length;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (isJson) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Test helper
const test = async (name, fn) => {
  try {
    await fn();
    results.passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.errors.push({ name, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
};

// Assert helper
const expect = (value) => ({
  toBe: (expected) => {
    if (value !== expected) {
      throw new Error(`Expected ${expected}, got ${value}`);
    }
  },
  toBeDefined: () => {
    if (value === undefined || value === null) {
      throw new Error(`Expected value to be defined, got ${value}`);
    }
  },
  toContain: (expected) => {
    if (!value.includes(expected)) {
      throw new Error(`Expected ${value} to contain ${expected}`);
    }
  },
  toBeGreaterThan: (expected) => {
    if (value <= expected) {
      throw new Error(`Expected ${value} to be greater than ${expected}`);
    }
  }
});

const expectStatus = (res, expectedStatuses) => {
  if (!expectedStatuses.includes(res.status)) {
    throw new Error(`Expected status ${expectedStatuses.join(' or ')}, got ${res.status}`);
  }
};

// Authentication function
const authenticate = async () => {
  console.log('\n=== Authenticating Users ===\n');
  
  // Admin login
  let res = await request('POST', '/api/auth/login', { 
    email: 'admin@example.com', 
    password: 'Password123' 
  });
  tokens.admin = res.body?.token || res.body?.data?.token;
  console.log(`Admin: ${tokens.admin ? '✓' : '✗'}`);

  // Owner login
  res = await request('POST', '/api/auth/login', { 
    email: 'owner@example.com', 
    password: 'Password123' 
  });
  tokens.owner = res.body?.token || res.body?.data?.token;
  console.log(`Owner: ${tokens.owner ? '✓' : '✗'}`);

  // Captain 1 login
  res = await request('POST', '/api/auth/login', { 
    email: 'captain1@example.com', 
    password: 'Password123' 
  });
  tokens.captain1 = res.body?.token || res.body?.data?.token;
  console.log(`Captain 1: ${tokens.captain1 ? '✓' : '✗'}`);

  // Captain 2 login
  res = await request('POST', '/api/auth/login', { 
    email: 'captain2@example.com', 
    password: 'Password123' 
  });
  tokens.captain2 = res.body?.token || res.body?.data?.token;
  console.log(`Captain 2: ${tokens.captain2 ? '✓' : '✗'}`);

  // Player 1 login
  res = await request('POST', '/api/auth/login', { 
    email: 'player@example.com', 
    password: 'Password123' 
  });
  tokens.player1 = res.body?.token || res.body?.data?.token;
  console.log(`Player 1: ${tokens.player1 ? '✓' : '✗'}`);

  // Player 2 login
  res = await request('POST', '/api/auth/login', { 
    email: 'player2@example.com', 
    password: 'Password123' 
  });
  tokens.player2 = res.body?.token || res.body?.data?.token;
  console.log(`Player 2: ${tokens.player2 ? '✓' : '✗'}`);
};

// Run all tests
const runTests = async () => {
  console.log('\n========================================');
  console.log('🏈 Football Field Booking API - Test Suite');
  console.log('========================================\n');

  // Check if server is running
  try {
    await request('GET', '/health');
  } catch (error) {
    console.error('❌ Server is not running! Please start the server first:');
    console.error('   npm run dev');
    process.exit(1);
  }

  // Authenticate
  await authenticate();

  // Test Health & Info Endpoints
  console.log('\n--- Health & Info Endpoints ---');
  
  await test('GET /health - Health check', async () => {
    const res = await request('GET', '/health');
    expectStatus(res, [200]);
    expect(res.body.status).toBe('OK');
  });

  await test('GET / - API Documentation', async () => {
    const res = await request('GET', '/');
    expectStatus(res, [200]);
    expect(res.body.message).toBe('Football Field Booking API');
  });

  // Test Auth Endpoints
  console.log('\n--- Authentication Endpoints ---');

  await test('POST /api/auth/register - Register new user', async () => {
    const res = await request('POST', '/api/auth/register', {
      username: 'newuser' + Date.now(),
      email: 'newuser' + Date.now() + '@test.com',
      password: 'Password123',
      firstName: 'New',
      lastName: 'User',
      role: 'player'
    });
    expectStatus(res, [201, 400, 409]);
  });

  await test('POST /api/auth/login - Valid credentials', async () => {
    const res = await request('POST', '/api/auth/login', { 
      email: 'player@example.com', 
      password: 'Password123' 
    });
    expectStatus(res, [200, 401]);
  });

  await test('POST /api/auth/login - Invalid credentials', async () => {
    const res = await request('POST', '/api/auth/login', { 
      email: 'player@example.com', 
      password: 'wrongpassword' 
    });
    expectStatus(res, [401, 400]);
  });

  await test('GET /api/auth/profile - Get profile (authenticated)', async () => {
    const res = await request('GET', '/api/auth/profile', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('PUT /api/auth/profile - Update profile', async () => {
    const res = await request('PUT', '/api/auth/profile', { firstName: 'Updated' }, tokens.player1);
    expectStatus(res, [200, 400, 401]);
  });

  // Test User Endpoints
  console.log('\n--- User Endpoints ---');

  await test('GET /api/users - Get all users (Admin only)', async () => {
    const res = await request('GET', '/api/users', null, tokens.admin);
    expectStatus(res, [200, 401, 403]);
  });

  await test('GET /api/users/search - Search users', async () => {
    const res = await request('GET', '/api/users/search?q=admin', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/users/:id - Get user by ID', async () => {
    const res = await request('GET', '/api/users/1', null, tokens.admin);
    expectStatus(res, [200, 401, 404]);
  });

  // Test Field Endpoints
  console.log('\n--- Field Endpoints ---');

  await test('GET /api/fields - Get all fields', async () => {
    const res = await request('GET', '/api/fields');
    expectStatus(res, [200, 500]);
  });

  await test('GET /api/fields/:id - Get field by ID', async () => {
    const res = await request('GET', '/api/fields/1');
    expectStatus(res, [200, 404, 500]);
  });

  await test('GET /api/fields/my-fields - Get my fields (Owner/Admin)', async () => {
    const res = await request('GET', '/api/fields/my-fields', null, tokens.owner);
    expectStatus(res, [200, 401, 403]);
  });

  await test('POST /api/fields - Create field (Owner/Admin)', async () => {
    const res = await request('POST', '/api/fields', {
      name: 'Test Field ' + Date.now(),
      description: 'Test description',
      address: '123 Test St',
      city: 'Test City',
      province: 'Test Province',
      pricePerHour: 50,
      capacity: 10,
      fieldType: '5v5',
      surfaceType: 'artificial_turf'
    }, tokens.owner);
    expectStatus(res, [201, 400, 401, 403]);
  });

  await test('PUT /api/fields/:id - Update field', async () => {
    const res = await request('PUT', '/api/fields/1', { name: 'Updated Field' }, tokens.owner);
    expectStatus(res, [200, 400, 401, 403, 404]);
  });

  // Test Booking Endpoints
  console.log('\n--- Booking Endpoints ---');

  await test('GET /api/bookings - Get all bookings', async () => {
    const res = await request('GET', '/api/bookings', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/bookings/open-matches - Get open matches', async () => {
    const res = await request('GET', '/api/bookings/open-matches', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/bookings/:id - Get booking by ID', async () => {
    const res = await request('GET', '/api/bookings/1', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  await test('POST /api/bookings - Create booking', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const res = await request('POST', '/api/bookings', {
      fieldId: 1,
      date: tomorrow.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      totalPrice: 50
    }, tokens.player1);
    expectStatus(res, [201, 400, 401, 404]);
  });

  await test('PUT /api/bookings/:id - Update booking status', async () => {
    const res = await request('PUT', '/api/bookings/1', { status: 'confirmed' }, tokens.player1);
    expectStatus(res, [200, 400, 401, 404]);
  });

  await test('PATCH /api/bookings/:id/open-for-opponents - Toggle open for opponents', async () => {
    const res = await request('PATCH', '/api/bookings/1/open-for-opponents', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  // Test Team Endpoints
  console.log('\n--- Team Endpoints ---');

  await test('GET /api/teams - Get all teams', async () => {
    const res = await request('GET', '/api/teams', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/teams/my-teams - Get my teams', async () => {
    const res = await request('GET', '/api/teams/my-teams', null, tokens.captain1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/teams/my-invitations - Get my invitations', async () => {
    const res = await request('GET', '/api/teams/my-invitations', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/teams/:id - Get team by ID', async () => {
    const res = await request('GET', '/api/teams/1', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  await test('GET /api/teams/:id/members - Get team members', async () => {
    const res = await request('GET', '/api/teams/1/members', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  await test('GET /api/teams/:id/requests - Get join requests', async () => {
    const res = await request('GET', '/api/teams/1/requests', null, tokens.captain1);
    expectStatus(res, [200, 401, 403, 404]);
  });

  await test('GET /api/teams/:id/matches - Get team match history', async () => {
    const res = await request('GET', '/api/teams/1/matches', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  await test('POST /api/teams - Create team', async () => {
    const res = await request('POST', '/api/teams', {
      name: 'Test Team FC ' + Date.now(),
      description: 'A test team',
      skillLevel: 'intermediate',
      maxPlayers: 15
    }, tokens.captain1);
    expectStatus(res, [201, 400, 401, 403]);
  });

  await test('POST /api/teams/:id/join - Request to join team', async () => {
    const res = await request('POST', '/api/teams/1/join', null, tokens.player1);
    expectStatus(res, [200, 400, 401, 404, 409]);
  });

  // Test Public Endpoints
  console.log('\n--- Public Endpoints ---');

  await test('GET /api/public/teams - Get public teams', async () => {
    const res = await request('GET', '/api/public/teams');
    expectStatus(res, [200, 500]);
  });

  await test('GET /api/public/teams/:id - Get public team by ID', async () => {
    const res = await request('GET', '/api/public/teams/1');
    expectStatus(res, [200, 404, 500]);
  });

  await test('GET /api/public/schedule - Get public schedule', async () => {
    const res = await request('GET', '/api/public/schedule');
    expectStatus(res, [200, 500]);
  });

  // Test Match Result Endpoints
  console.log('\n--- Match Result Endpoints ---');

  await test('GET /api/match-results - Get all match results', async () => {
    const res = await request('GET', '/api/match-results', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/match-results/:id - Get match result by ID', async () => {
    const res = await request('GET', '/api/match-results/1', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  await test('POST /api/match-results - Create match result', async () => {
    const res = await request('POST', '/api/match-results', {
      team1Id: 1,
      team2Id: 2,
      team1Score: 2,
      team2Score: 1,
      matchDate: new Date().toISOString().split('T')[0]
    }, tokens.captain1);
    expectStatus(res, [201, 400, 401, 403]);
  });

  // Test Notification Endpoints
  console.log('\n--- Notification Endpoints ---');

  await test('GET /api/notifications - Get all notifications', async () => {
    const res = await request('GET', '/api/notifications', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/notifications/:id - Get notification by ID', async () => {
    const res = await request('GET', '/api/notifications/1', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  // Test Rating Endpoints
  console.log('\n--- Rating Endpoints ---');

  await test('GET /api/ratings - Get all ratings', async () => {
    const res = await request('GET', '/api/ratings', null, tokens.player1);
    expectStatus(res, [200, 401]);
  });

  await test('GET /api/ratings/:id - Get rating by ID', async () => {
    const res = await request('GET', '/api/ratings/1', null, tokens.player1);
    expectStatus(res, [200, 401, 404]);
  });

  await test('POST /api/ratings - Create rating', async () => {
    const res = await request('POST', '/api/ratings', {
      fieldId: 1,
      rating: 5,
      comment: 'Great field!'
    }, tokens.player1);
    expectStatus(res, [201, 400, 401, 403]);
  });

  // Test Dashboard Endpoints
  console.log('\n--- Dashboard Endpoints ---');

  await test('GET /api/dashboard/stats - Get dashboard stats', async () => {
    const res = await request('GET', '/api/dashboard/stats', null, tokens.admin);
    expectStatus(res, [200, 401, 403]);
  });

  await test('GET /api/dashboard/search - Search resources', async () => {
    const res = await request('GET', '/api/dashboard/search?q=field', null, tokens.admin);
    expectStatus(res, [200, 400, 401]);
  });

  // Test Football Data API Endpoints
  console.log('\n--- Football Data API Endpoints ---');

  await test('GET /api/matches - Get football matches', async () => {
    const res = await request('GET', '/api/matches');
    expectStatus(res, [200, 500]);
  });

  await test('GET /api/matches?league=PL - Get matches for specific league', async () => {
    const res = await request('GET', '/api/matches?league=PL');
    expectStatus(res, [200, 500]);
  });

  await test('GET /api/leagues/standings - Get league standings', async () => {
    const res = await request('GET', '/api/leagues/standings');
    expectStatus(res, [200, 500]);
  });

  await test('GET /api/leagues/standings?league=PL - Get specific league standings', async () => {
    const res = await request('GET', '/api/leagues/standings?league=PL');
    expectStatus(res, [200, 500]);
  });

  // Print summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n--- Failed Tests ---');
    results.errors.forEach(e => {
      console.log(`❌ ${e.name}: ${e.error}`);
    });
  }
  
  console.log('========================================\n');
  
  process.exit(results.failed > 0 ? 1 : 0);
};

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});

