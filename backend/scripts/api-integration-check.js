const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const backendDir = path.join(__dirname, '..');
process.chdir(backendDir);
require('dotenv').config({ path: path.join(backendDir, '.env') });
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Field,
  Team,
  TeamMember,
  Booking,
  MatchResult,
  Rating,
  Notification
} = require('../src/models');

const port = Number(process.env.PORT) || 5000;
const baseUrl = `http://127.0.0.1:${port}`;
const seed = Date.now().toString(36);
const password = 'Password123';
const state = {
  checks: 0,
  users: {},
  tokens: {},
  ids: { fields: {}, teams: {}, bookings: {}, matchResults: {}, ratings: {}, notifications: {}, teamMembers: {} }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const isoAt = (dayOffset, hour, minute) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};
const summarize = (value) => {
  if (typeof value === 'string') return value.slice(0, 200);
  try {
    return JSON.stringify(value).slice(0, 200);
  } catch (_) {
    return String(value).slice(0, 200);
  }
};
const profile = (label, role) => ({
  username: `${label}_${seed}`.slice(0, 30),
  email: `${label}.${seed}@example.com`,
  password,
  firstName: label.slice(0, 1).toUpperCase() + label.slice(1),
  lastName: 'Api',
  phone: '+15550001111',
  role
});

async function request(name, options = {}) {
  const {
    method = 'GET',
    path: requestPath,
    token,
    json,
    rawBody,
    form,
    headers = {},
    expected = 200
  } = options;
  state.checks += 1;
  const expectedCodes = Array.isArray(expected) ? expected : [expected];
  const requestHeaders = { ...headers };
  let body;
  if (form) {
    body = form;
  } else if (rawBody !== undefined) {
    body = rawBody;
  } else if (json !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${requestPath}`, { method, headers: requestHeaders, body });
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') && text ? JSON.parse(text) : text;
  if (!expectedCodes.includes(response.status)) {
    throw new Error(`${name} -> ${response.status} ${summarize(data)}`);
  }
  return { status: response.status, data, headers: response.headers };
}

async function login(label) {
  const result = await request(`login ${label}`, {
    method: 'POST',
    path: '/api/auth/login',
    json: { email: state.users[label].email, password }
  });
  assert(result.data && result.data.success, `login ${label} failed`);
  state.tokens[label] = result.data.data.token;
}

function imageForm(fieldName, filename) {
  const form = new FormData();
  form.append(fieldName, new Blob([Buffer.from('image')], { type: 'image/png' }), filename);
  return form;
}

function webhookOptions() {
  const event = {
    id: `evt_${seed}`,
    object: 'event',
    type: 'integration.test',
    data: { object: { id: `obj_${seed}` } }
  };
  if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_SECRET_KEY) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const payload = JSON.stringify(event);
    return {
      method: 'POST',
      path: '/api/payments/webhook',
      rawBody: payload,
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripe.webhooks.generateTestHeaderString({
          payload,
          secret: process.env.STRIPE_WEBHOOK_SECRET
        })
      }
    };
  }
  return { method: 'POST', path: '/api/payments/webhook', json: event };
}

async function waitForServer() {
  require(path.join(backendDir, 'server.js'));
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
    } catch (_) {}
    await delay(250);
  }
  throw new Error(`Server not ready on ${baseUrl}`);
}

async function seedData() {
  const hash = await bcrypt.hash(password, 10);
  const admin = await User.create({ ...profile('admin', 'admin'), password: hash });
  const owner = await User.create({ ...profile('owner', 'field_owner'), password: hash });
  const captainone = await User.create({ ...profile('captainone', 'captain'), password: hash });
  const captaintwo = await User.create({ ...profile('captaintwo', 'captain'), password: hash });
  const playerone = await User.create({ ...profile('playerone', 'player'), password: hash });
  const playertwo = await User.create({ ...profile('playertwo', 'player'), password: hash });
  const extramember = await User.create({ ...profile('extramember', 'player'), password: hash });
  state.users = { admin, owner, captainone, captaintwo, playerone, playertwo, extramember };
  const field = await Field.create({
    name: `Seed Field ${seed}`,
    description: 'Seeded for API integration tests',
    address: '100 Seed Street',
    city: 'Seed City',
    province: 'Seed Province',
    ownerId: owner.id,
    pricePerHour: 75,
    fieldType: '7v7',
    surfaceType: 'artificial_turf',
    capacity: 14,
    isActive: true
  });
  const teamOne = await Team.create({ name: `Seed Team One ${seed}`, captainId: captainone.id, skillLevel: 'intermediate', maxPlayers: 12, homeFieldId: field.id, isActive: true });
  const teamTwo = await Team.create({ name: `Seed Team Two ${seed}`, captainId: captaintwo.id, skillLevel: 'advanced', maxPlayers: 14, homeFieldId: field.id, isActive: true });
  await TeamMember.bulkCreate([
    { teamId: teamOne.id, userId: captainone.id, role: 'captain', status: 'active', isActive: true },
    { teamId: teamTwo.id, userId: captaintwo.id, role: 'captain', status: 'active', isActive: true },
    { teamId: teamTwo.id, userId: playerone.id, role: 'player', status: 'active', isActive: true }
  ]);
  state.ids.fields.seed = field.id;
  state.ids.teams.one = teamOne.id;
  state.ids.teams.two = teamTwo.id;
}

async function cleanup() {
  const userIds = Object.values(state.users).map((user) => user && user.id).filter(Boolean);
  const fieldIds = Object.values(state.ids.fields).filter(Boolean);
  const teamIds = Object.values(state.ids.teams).filter(Boolean);
  const bookingIds = Object.values(state.ids.bookings).filter(Boolean);
  const matchResultIds = Object.values(state.ids.matchResults).filter(Boolean);
  const ratingIds = Object.values(state.ids.ratings).filter(Boolean);
  const notificationIds = Object.values(state.ids.notifications).filter(Boolean);
  const teamMemberIds = Object.values(state.ids.teamMembers).filter(Boolean);
  try {
    if (notificationIds.length || userIds.length) await Notification.destroy({ where: { [Op.or]: [notificationIds.length ? { id: { [Op.in]: notificationIds } } : null, userIds.length ? { userId: { [Op.in]: userIds } } : null].filter(Boolean) } });
    if (ratingIds.length) await Rating.destroy({ where: { id: { [Op.in]: ratingIds } } });
    if (matchResultIds.length) await MatchResult.destroy({ where: { id: { [Op.in]: matchResultIds } } });
    if (bookingIds.length || userIds.length || fieldIds.length) await Booking.destroy({ where: { [Op.or]: [bookingIds.length ? { id: { [Op.in]: bookingIds } } : null, userIds.length ? { createdBy: { [Op.in]: userIds } } : null, fieldIds.length ? { fieldId: { [Op.in]: fieldIds } } : null].filter(Boolean) } });
    if (teamMemberIds.length || userIds.length || teamIds.length) await TeamMember.destroy({ where: { [Op.or]: [teamMemberIds.length ? { id: { [Op.in]: teamMemberIds } } : null, userIds.length ? { userId: { [Op.in]: userIds } } : null, teamIds.length ? { teamId: { [Op.in]: teamIds } } : null].filter(Boolean) } });
    if (teamIds.length) await Team.destroy({ where: { id: { [Op.in]: teamIds } } });
    if (fieldIds.length) await Field.destroy({ where: { id: { [Op.in]: fieldIds } } });
    if (userIds.length) await User.destroy({ where: { id: { [Op.in]: userIds } } });
    for (const userId of userIds) fs.rmSync(path.join(backendDir, 'uploads', 'avatars', String(userId)), { recursive: true, force: true });
    for (const fieldId of fieldIds) fs.rmSync(path.join(backendDir, 'uploads', 'fields', String(fieldId)), { recursive: true, force: true });
    for (const teamId of teamIds) fs.rmSync(path.join(backendDir, 'uploads', 'teams', String(teamId)), { recursive: true, force: true });
  } catch (error) {
    console.error('Cleanup warning:', error.message);
  }
}
async function run() {
  await seedData();
  await waitForServer();

  const root = await request('root', { path: '/' });
  assert(root.data && root.data.endpoints, 'root endpoint failed');

  const requester = profile('requester', 'player');
  const authRegister = await request('auth register', { method: 'POST', path: '/api/auth/register', json: requester, expected: 201 });
  assert(authRegister.data && authRegister.data.success, 'auth register failed');
  state.users.requester = authRegister.data.data.user;
  state.tokens.requester = authRegister.data.data.token;

  const createdUser = await request('user register', { method: 'POST', path: '/api/users/register', json: profile('createduser', 'player'), expected: 201 });
  assert(createdUser.data && createdUser.data.success, 'user register failed');
  state.users.createduser = createdUser.data.data;

  await login('admin');
  await login('owner');
  await login('captainone');
  await login('captaintwo');
  await login('playerone');
  await login('playertwo');

  await request('auth profile', { path: '/api/auth/profile', token: state.tokens.requester });
  await request('auth profile update', { method: 'PUT', path: '/api/auth/profile', token: state.tokens.requester, json: { firstName: 'Requester', lastName: 'Updated', phone: '+15552223333' } });
  await request('auth public profile', { path: `/api/auth/public/profile/${state.users.requester.id}` });
  await request('field owner request', { method: 'POST', path: '/api/auth/request-field-owner', token: state.tokens.requester, json: {}, expected: 201 });

  await request('users list', { path: '/api/users', token: state.tokens.admin });
  const requests = await request('users field owner requests', { path: '/api/users/field-owner-requests', token: state.tokens.admin });
  const ownerRequest = requests.data.data.find((item) => { const metadata = item && item.metadata ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata) : null; return metadata && String(metadata.requesterId) === String(state.users.requester.id); });
  assert(ownerRequest, 'field owner request notification missing');
  await request('users resolve field owner', { method: 'PUT', path: `/api/users/field-owner-requests/${ownerRequest.id}`, token: state.tokens.admin, json: { action: 'approve' } });
  await request('users get by id', { path: `/api/users/${state.users.requester.id}`, token: state.tokens.admin });
  await request('users update', { method: 'PUT', path: `/api/users/${state.users.playerone.id}`, token: state.tokens.admin, json: { username: state.users.playerone.username, email: state.users.playerone.email, firstName: 'Player', lastName: 'Updated', phone: '+15554445555', role: 'player' } });
  await request('users avatar', { method: 'POST', path: '/api/users/avatar', token: state.tokens.playerone, form: imageForm('avatar', 'avatar.png') });
  await request('users delete', { method: 'DELETE', path: `/api/users/${state.users.createduser.id}`, token: state.tokens.admin });
  delete state.users.createduser;

  await request('fields list', { path: '/api/fields' });
  await request('fields search', { path: `/api/fields/search?q=${encodeURIComponent(seed)}` });
  await request('fields get', { path: `/api/fields/${state.ids.fields.seed}` });
  await request('fields availability', { path: `/api/fields/${state.ids.fields.seed}/availability?date=${encodeURIComponent(isoAt(2, 0, 0).slice(0, 10))}` });
  await request('fields mine', { path: '/api/fields/my-fields', token: state.tokens.owner });
  const newField = await request('fields create', { method: 'POST', path: '/api/fields', token: state.tokens.owner, json: { name: `API Field ${seed}`, description: 'API field', address: '200 Api Street', city: 'Api City', province: 'Api Province', pricePerHour: 88, capacity: 16, fieldType: '7v7', surfaceType: 'artificial_turf', status: 'available' }, expected: 201 });
  state.ids.fields.api = newField.data.data.id;
  await request('fields update', { method: 'PUT', path: `/api/fields/${state.ids.fields.api}`, token: state.tokens.owner, json: { name: `API Field ${seed} Updated`, description: 'Updated API field', address: '200 Api Street', city: 'Api City', province: 'Api Province', pricePerHour: 99, capacity: 18, fieldType: '7v7', surfaceType: 'artificial_turf', status: 'available' } });
  await request('fields upload', { method: 'POST', path: `/api/fields/${state.ids.fields.api}/images`, token: state.tokens.owner, form: imageForm('images', 'field.png'), expected: 201 });
  const dropField = await request('fields create drop', { method: 'POST', path: '/api/fields', token: state.tokens.owner, json: { name: `Drop Field ${seed}`, description: 'Delete path field', address: '300 Api Street', city: 'Api City', province: 'Api Province', pricePerHour: 50, capacity: 10, fieldType: '5v5', surfaceType: 'artificial_turf', status: 'available' }, expected: 201 });
  state.ids.fields.drop = dropField.data.data.id;
  await request('fields delete', { method: 'DELETE', path: `/api/fields/${state.ids.fields.drop}`, token: state.tokens.owner });
  delete state.ids.fields.drop;

  await request('teams list', { path: '/api/teams', token: state.tokens.captainone });
  await request('teams search', { path: `/api/teams/search?q=${encodeURIComponent(seed)}`, token: state.tokens.captainone });
  await request('public teams list', { path: '/api/public/teams' });
  await request('public teams get', { path: `/api/public/teams/${state.ids.teams.one}` });
  const newTeam = await request('teams create', { method: 'POST', path: '/api/teams', token: state.tokens.captainone, json: { name: `API Team ${seed}`, description: 'API team', skillLevel: 'intermediate', maxPlayers: 15, homeFieldId: state.ids.fields.api }, expected: 201 });
  state.ids.teams.api = newTeam.data.data.id;
  await request('teams update', { method: 'PUT', path: `/api/teams/${state.ids.teams.api}`, token: state.tokens.captainone, json: { name: `API Team ${seed} Updated`, description: 'Updated API team', skillLevel: 'professional', maxPlayers: 16, homeFieldId: state.ids.fields.api } });
  await request('teams logo', { method: 'POST', path: `/api/teams/${state.ids.teams.api}/logo`, token: state.tokens.captainone, form: imageForm('logo', 'logo.png'), expected: 201 });
  await request('teams invite', { method: 'POST', path: `/api/teams/${state.ids.teams.api}/invite`, token: state.tokens.captainone, json: { userId: state.users.playertwo.id }, expected: 201 });
  await request('teams respond', { method: 'POST', path: `/api/teams/${state.ids.teams.api}/invitations/respond`, token: state.tokens.playertwo, json: { action: 'accept' } });
  await request('teams leave', { method: 'POST', path: `/api/teams/${state.ids.teams.api}/leave`, token: state.tokens.playertwo, json: {} });
  await request('teams join', { method: 'POST', path: `/api/teams/${state.ids.teams.two}/join`, token: state.tokens.playertwo, json: {}, expected: 201 });
  await request('teams requests', { path: `/api/teams/${state.ids.teams.two}/requests`, token: state.tokens.captaintwo });
  await request('teams approve', { method: 'PUT', path: `/api/teams/${state.ids.teams.two}/members/${state.users.playertwo.id}`, token: state.tokens.captaintwo, json: { status: 'active' } });
  await request('teams members', { path: `/api/teams/${state.ids.teams.two}/members`, token: state.tokens.captaintwo });
  await request('teams add member', { method: 'POST', path: `/api/teams/${state.ids.teams.two}/members`, token: state.tokens.captaintwo, json: { userId: state.users.extramember.id, role: 'substitute' }, expected: 201 });
  await request('teams remove member', { method: 'DELETE', path: `/api/teams/${state.ids.teams.two}/members/${state.users.extramember.id}`, token: state.tokens.captaintwo });

  const tm = await request('team-members create', { method: 'POST', path: '/api/team-members', token: state.tokens.captainone, json: { teamId: state.ids.teams.api, userId: state.users.extramember.id, role: 'substitute' }, expected: 201 });
  state.ids.teamMembers.api = tm.data.data.id;
  await request('team-members list', { path: '/api/team-members', token: state.tokens.captainone });
  await request('team-members get', { path: `/api/team-members/${state.ids.teamMembers.api}`, token: state.tokens.captainone });
  await request('team-members public get', { path: `/api/team-members/public/${state.ids.teamMembers.api}` });
  await request('team-members public team', { path: `/api/team-members/public/team/${state.ids.teams.api}` });
  await request('team-members update', { method: 'PUT', path: `/api/team-members/${state.ids.teamMembers.api}`, token: state.tokens.captainone, json: { status: 'inactive', role: 'substitute' } });
  await request('team-members delete', { method: 'DELETE', path: `/api/team-members/${state.ids.teamMembers.api}`, token: state.tokens.captainone });
  delete state.ids.teamMembers.api;
  const bookingOne = await request('bookings create one', { method: 'POST', path: '/api/bookings', token: state.tokens.playerone, json: { fieldId: state.ids.fields.api, teamId: state.ids.teams.api, startTime: isoAt(2, 9, 0), endTime: isoAt(2, 11, 0) }, expected: 201 });
  state.ids.bookings.one = bookingOne.data.data.id;
  await request('bookings list player', { path: '/api/bookings', token: state.tokens.playerone });
  await request('bookings list owner', { path: '/api/bookings', token: state.tokens.owner });
  await request('bookings get', { path: `/api/bookings/${state.ids.bookings.one}`, token: state.tokens.playerone });
  await request('bookings public get', { path: `/api/bookings/public/${state.ids.bookings.one}` });
  await request('bookings confirm', { method: 'PUT', path: `/api/bookings/${state.ids.bookings.one}`, token: state.tokens.owner, json: { status: 'confirmed' } });
  const bookingTwo = await request('bookings create two', { method: 'POST', path: '/api/bookings', token: state.tokens.playerone, json: { fieldId: state.ids.fields.api, teamId: state.ids.teams.api, startTime: isoAt(3, 14, 0), endTime: isoAt(3, 16, 0) }, expected: 201 });
  state.ids.bookings.two = bookingTwo.data.data.id;
  await request('bookings cancel request', { method: 'POST', path: `/api/bookings/${state.ids.bookings.two}/request-cancel`, token: state.tokens.playerone, json: { reason: 'API test' } });

  const matchResult = await request('match-results create', { method: 'POST', path: '/api/match-results', token: state.tokens.captainone, json: { bookingId: state.ids.bookings.one, homeTeamId: state.ids.teams.api, awayTeamId: state.ids.teams.one, homeScore: 3, awayScore: 1, matchStatus: 'completed', mvpPlayerId: state.users.playerone.id }, expected: 201 });
  state.ids.matchResults.api = matchResult.data.data.id;
  await request('match-results list', { path: '/api/match-results', token: state.tokens.captainone });
  await request('match-results get', { path: `/api/match-results/${state.ids.matchResults.api}`, token: state.tokens.captainone });
  await request('match-results update', { method: 'PUT', path: `/api/match-results/${state.ids.matchResults.api}`, token: state.tokens.captainone, json: { homeScore: 4, awayScore: 1 } });

  const rating = await request('ratings create', { method: 'POST', path: '/api/ratings', token: state.tokens.playerone, json: { raterTeamId: state.ids.teams.api, ratedTeamId: state.ids.teams.one, bookingId: state.ids.bookings.one, rating: 5, comment: 'API test rating', ratingType: 'overall', isRecommended: true }, expected: 201 });
  state.ids.ratings.api = rating.data.data.id;
  await request('ratings list', { path: '/api/ratings', token: state.tokens.playerone });
  await request('ratings get', { path: `/api/ratings/${state.ids.ratings.api}`, token: state.tokens.playerone });
  await request('ratings public get', { path: `/api/ratings/public/${state.ids.ratings.api}` });
  await request('ratings update', { method: 'PUT', path: `/api/ratings/${state.ids.ratings.api}`, token: state.tokens.admin, json: { rating: 4, comment: 'Updated by admin' } });

  const notice = await request('notifications create', { method: 'POST', path: '/api/notifications', token: state.tokens.admin, json: { userId: state.users.playerone.id, type: 'system', title: 'API Notice', message: 'Created by test' }, expected: 201 });
  state.ids.notifications.api = notice.data.data.id;
  await request('notifications list', { path: '/api/notifications', token: state.tokens.playerone });
  await request('notifications get', { path: `/api/notifications/${state.ids.notifications.api}`, token: state.tokens.playerone });
  await request('notifications read', { method: 'PUT', path: `/api/notifications/${state.ids.notifications.api}/read`, token: state.tokens.playerone, json: {} });
  await request('notifications update', { method: 'PUT', path: `/api/notifications/${state.ids.notifications.api}`, token: state.tokens.admin, json: { userId: state.users.playerone.id, type: 'system', title: 'API Notice Updated', message: 'Updated by test' } });
  await request('notifications mark all', { method: 'PUT', path: `/api/notifications/mark-all-read?userId=${state.users.playerone.id}`, token: state.tokens.admin, json: {} });

  await request('dashboard stats', { path: '/api/dashboard/stats', token: state.tokens.admin });
  await request('dashboard analytics', { path: '/api/dashboard/analytics', token: state.tokens.admin });
  await request('dashboard search', { path: `/api/dashboard/search?q=${encodeURIComponent(seed)}`, token: state.tokens.admin });
  await request('payments config', { path: '/api/payments/config', token: state.tokens.playerone });
  const webhook = await request('payments webhook', webhookOptions());
  if (webhook.data && typeof webhook.data === 'object') assert(webhook.data.success === true, 'payments webhook failed');
  await request('analytics overview', { path: '/api/analytics/overview', token: state.tokens.admin });
  const csv = await request('analytics csv', { path: '/api/analytics/report.csv', token: state.tokens.admin });
  assert((csv.headers.get('content-type') || '').includes('text/csv'), 'analytics csv failed');

  await request('notifications delete', { method: 'DELETE', path: `/api/notifications/${state.ids.notifications.api}`, token: state.tokens.admin });
  delete state.ids.notifications.api;
  await request('ratings delete', { method: 'DELETE', path: `/api/ratings/${state.ids.ratings.api}`, token: state.tokens.admin });
  delete state.ids.ratings.api;
  await request('match-results delete', { method: 'DELETE', path: `/api/match-results/${state.ids.matchResults.api}`, token: state.tokens.captainone });
  delete state.ids.matchResults.api;

  return { success: true, checks: state.checks, seed, baseUrl };
}

(async () => {
  try {
    const result = await run();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 0;
  } catch (error) {
    console.error(`API integration test failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await cleanup();
    await delay(100);
    process.exit(process.exitCode || 0);
  }
})();
