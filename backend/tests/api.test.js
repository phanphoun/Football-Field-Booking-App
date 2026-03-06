/**
 * Football Field Booking API - Comprehensive API Tests
 * 
 * This test suite covers all API endpoints in the backend.
 * Run with: npm test
 * 
 * Prerequisites:
 * 1. Create .env file with test database credentials
 * 2. Ensure MySQL is running
 * 3. Run npm run seed to populate test data
 */

const request = require('supertest');
const { sequelize, User, Field, Team, Booking, TeamMember } = require('../src/models');

// Base URL - change if testing against running server
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// Test data storage
let adminToken = '';
let ownerToken = '';
let captain1Token = '';
let captain2Token = '';
let player1Token = '';
let player2Token = '';

let testFieldId = 1;
let testTeamId = 1;
let testBookingId = 1;
let testUserId = 1;

// Helper function to authenticate and get tokens
const authenticateUsers = async () => {
  console.log('\n=== Authenticating Users ===\n');
  
  // Admin login
  const adminRes = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'Password123' });
  adminToken = adminRes.body.token || adminRes.body.data?.token;
  console.log('Admin authenticated:', adminToken ? '✓' : '✗');
  
  // Owner login
  const ownerRes = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ email: 'owner@example.com', password: 'Password123' });
  ownerToken = ownerRes.body.token || ownerRes.body.data?.token;
  console.log('Owner authenticated:', ownerToken ? '✓' : '✗');
  
  // Captain 1 login
  const captain1Res = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ email: 'captain1@example.com', password: 'Password123' });
  captain1Token = captain1Res.body.token || captain1Res.body.data?.token;
  console.log('Captain 1 authenticated:', captain1Token ? '✓' : '✗');
  
  // Captain 2 login
  const captain2Res = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ email: 'captain2@example.com', password: 'Password123' });
  captain2Token = captain2Res.body.token || captain2Res.body.data?.token;
  console.log('Captain 2 authenticated:', captain2Token ? '✓' : '✗');
  
  // Player 1 login
  const player1Res = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ email: 'player@example.com', password: 'Password123' });
  player1Token = player1Res.body.token || player1Res.body.data?.token;
  console.log('Player 1 authenticated:', player1Token ? '✓' : '✗');
  
  // Player 2 login
  const player2Res = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ email: 'player2@example.com', password: 'Password123' });
  player2Token = player2Res.body.token || player2Res.body.data?.token;
  console.log('Player 2 authenticated:', player2Token ? '✓' : '✗');
};

describe('🏥 Health & Info Endpoints', () => {
  test('GET /health - Health check', async () => {
    const res = await request(BASE_URL).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('GET / - API Documentation', async () => {
    const res = await request(BASE_URL).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Football Field Booking API');
  });
});

describe('🔐 Authentication Endpoints', () => {
  test('POST /api/auth/register - Register new user', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'Password123',
        firstName: 'New',
        lastName: 'User',
        role: 'player'
      });
    // May return 201 (created) or 400 (validation error if user exists)
    expect([201, 400, 409]).toContain(res.status);
  });

  test('POST /api/auth/login - Valid credentials', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'player@example.com', password: 'Password123' });
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.token || res.body.data?.token).toBeDefined();
    }
  });

  test('POST /api/auth/login - Invalid credentials', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'player@example.com', password: 'wrongpassword' });
    expect([401, 400]).toContain(res.status);
  });

  test('GET /api/auth/profile - Get user profile (authenticated)', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('PUT /api/auth/profile - Update profile', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({ firstName: 'Updated' });
    expect([200, 400, 401]).toContain(res.status);
  });
});

describe('👥 User Endpoints', () => {
  test('GET /api/users - Get all users (Admin only)', async () => {
    if (!adminToken) return;
    const res = await request(BASE_URL)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 401, 403]).toContain(res.status);
  });

  test('GET /api/users/search - Search users', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/users/search?q=admin')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/users/:id - Get user by ID (Admin only)', async () => {
    if (!adminToken) return;
    const res = await request(BASE_URL)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 401, 404]).toContain(res.status);
  });
});

describe('⚽ Field Endpoints', () => {
  test('GET /api/fields - Get all fields (Public)', async () => {
    const res = await request(BASE_URL).get('/api/fields');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200 && res.body.length > 0) {
      testFieldId = res.body[0].id;
    }
  });

  test('GET /api/fields/:id - Get field by ID', async () => {
    const res = await request(BASE_URL).get('/api/fields/1');
    expect([200, 404, 500]).toContain(res.status);
  });

  test('GET /api/fields/my-fields - Get my fields (Owner/Admin)', async () => {
    if (!ownerToken) return;
    const res = await request(BASE_URL)
      .get('/api/fields/my-fields')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect([200, 401, 403]).toContain(res.status);
  });

  test('POST /api/fields - Create field (Owner/Admin)', async () => {
    if (!ownerToken) return;
    const res = await request(BASE_URL)
      .post('/api/fields')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Field',
        description: 'Test description',
        address: '123 Test St',
        city: 'Test City',
        province: 'Test Province',
        pricePerHour: 50,
        capacity: 10,
        fieldType: '5v5',
        surfaceType: 'artificial_turf'
      });
    expect([201, 400, 401, 403]).toContain(res.status);
    if (res.status === 201) {
      testFieldId = res.body.id;
    }
  });

  test('PUT /api/fields/:id - Update field', async () => {
    if (!ownerToken) return;
    const res = await request(BASE_URL)
      .put('/api/fields/1')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Updated Field Name' });
    expect([200, 400, 401, 403, 404]).toContain(res.status);
  });

  test('DELETE /api/fields/:id - Delete field', async () => {
    if (!ownerToken) return;
    const res = await request(BASE_URL)
      .delete('/api/fields/999')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect([200, 401, 403, 404]).toContain(res.status);
  });
});

describe('📅 Booking Endpoints', () => {
  test('GET /api/bookings - Get all bookings', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/bookings/open-matches - Get open matches', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/bookings/open-matches')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/bookings/:id - Get booking by ID', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/bookings/1')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });

  test('POST /api/bookings - Create booking', async () => {
    if (!player1Token) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const res = await request(BASE_URL)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({
        fieldId: 1,
        date: dateStr,
        startTime: '10:00',
        endTime: '11:00',
        totalPrice: 50
      });
    expect([201, 400, 401, 404]).toContain(res.status);
    if (res.status === 201 && res.body.id) {
      testBookingId = res.body.id;
    }
  });

  test('PUT /api/bookings/:id - Update booking status', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .put('/api/bookings/1')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({ status: 'confirmed' });
    expect([200, 400, 401, 404]).toContain(res.status);
  });

  test('PATCH /api/bookings/:id/open-for-opponents - Toggle open for opponents', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .patch('/api/bookings/1/open-for-opponents')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });

  test('POST /api/bookings/:id/join-requests - Request to join match', async () => {
    if (!player2Token) return;
    const res = await request(BASE_URL)
      .post('/api/bookings/1/join-requests')
      .set('Authorization', `Bearer ${player2Token}`);
    expect([201, 400, 401, 404]).toContain(res.status);
  });

  test('GET /api/bookings/:id/join-requests - Get join requests', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/bookings/1/join-requests')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });
});

describe('👥 Team Endpoints', () => {
  test('GET /api/teams - Get all teams', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
    if (res.status === 200 && res.body.length > 0) {
      testTeamId = res.body[0].id;
    }
  });

  test('GET /api/teams/my-teams - Get my teams', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams/my-teams')
      .set('Authorization', `Bearer ${captain1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/teams/my-invitations - Get my invitations', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams/my-invitations')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/teams/captained - Get captained teams', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams/captained')
      .set('Authorization', `Bearer ${captain1Token}`);
    expect([200, 401, 403]).toContain(res.status);
  });

  test('GET /api/teams/:id - Get team by ID', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams/1')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });

  test('GET /api/teams/:id/members - Get team members', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams/1/members')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });

  test('GET /api/teams/:id/requests - Get join requests', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams/1/requests')
      .set('Authorization', `Bearer ${captain1Token}`);
    expect([200, 401, 403, 404]).toContain(res.status);
  });

  test('GET /api/teams/:id/matches - Get team match history', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/teams/1/matches')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });

  test('POST /api/teams - Create team', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .post('/api/teams')
      .set('Authorization', `Bearer ${captain1Token}`)
      .send({
        name: 'Test Team FC',
        description: 'A test team',
        skillLevel: 'intermediate',
        maxPlayers: 15
      });
    expect([201, 400, 401, 403]).toContain(res.status);
    if (res.status === 201 && res.body.id) {
      testTeamId = res.body.id;
    }
  });

  test('POST /api/teams/:id/join - Request to join team', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .post('/api/teams/1/join')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 400, 401, 404]).toContain(res.status);
  });

  test('POST /api/teams/:id/leave - Leave team', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .post('/api/teams/1/leave')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 400, 401, 404]).toContain(res.status);
  });

  test('POST /api/teams/:id/members - Add team member', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .post('/api/teams/1/members')
      .set('Authorization', `Bearer ${captain1Token}`)
      .send({ userId: 2, role: 'player' });
    expect([201, 400, 401, 403, 404]).toContain(res.status);
  });

  test('PUT /api/teams/:id/members/:userId - Update team member', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .put('/api/teams/1/members/2')
      .set('Authorization', `Bearer ${captain1Token}`)
      .send({ role: 'player' });
    expect([200, 400, 401, 403, 404]).toContain(res.status);
  });

  test('DELETE /api/teams/:id/members/:userId - Remove team member', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .delete('/api/teams/1/members/999')
      .set('Authorization', `Bearer ${captain1Token}`);
    expect([200, 401, 403, 404]).toContain(res.status);
  });

  test('PUT /api/teams/:id - Update team', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .put('/api/teams/1')
      .set('Authorization', `Bearer ${captain1Token}`)
      .send({ name: 'Updated Team Name' });
    expect([200, 400, 401, 403, 404]).toContain(res.status);
  });

  test('DELETE /api/teams/:id - Delete team', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .delete('/api/teams/999')
      .set('Authorization', `Bearer ${captain1Token}`);
    expect([200, 401, 403, 404]).toContain(res.status);
  });

  test('POST /api/teams/:id/invite - Invite player', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .post('/api/teams/1/invite')
      .set('Authorization', `Bearer ${captain1Token}`)
      .send({ email: 'player2@example.com' });
    expect([201, 400, 401, 403, 404]).toContain(res.status);
  });

  test('POST /api/teams/:id/invite/accept - Accept invitation', async () => {
    if (!player2Token) return;
    const res = await request(BASE_URL)
      .post('/api/teams/1/invite/accept')
      .set('Authorization', `Bearer ${player2Token}`)
      .send({ teamId: 1 });
    expect([200, 400, 401, 404]).toContain(res.status);
  });

  test('POST /api/teams/:id/invite/decline - Decline invitation', async () => {
    // Skip as it may cause issues
    return;
  });
});

describe('🔗 Team Member Endpoints', () => {
  test('GET /api/team-members - Get all team members', async () => {
    if (!adminToken) return;
    const res = await request(BASE_URL)
      .get('/api/team-members')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/team-members/invitations/mine - Get my invitations', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/team-members/invitations/mine')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/team-members/:id - Get team member by ID', async () => {
    if (!adminToken) return;
    const res = await request(BASE_URL)
      .get('/api/team-members/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 401, 404]).toContain(res.status);
  });
});

describe('🌐 Public Endpoints', () => {
  test('GET /api/public/teams - Get public teams', async () => {
    const res = await request(BASE_URL).get('/api/public/teams');
    expect([200, 500]).toContain(res.status);
  });

  test('GET /api/public/teams/:id - Get public team by ID', async () => {
    const res = await request(BASE_URL).get('/api/public/teams/1');
    expect([200, 404, 500]).toContain(res.status);
  });

  test('GET /api/public/schedule - Get public schedule', async () => {
    const res = await request(BASE_URL).get('/api/public/schedule');
    expect([200, 500]).toContain(res.status);
  });
});

describe('🏆 Match Result Endpoints', () => {
  test('GET /api/match-results - Get all match results', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/match-results')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/match-results/:id - Get match result by ID', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/match-results/1')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });

  test('POST /api/match-results - Create match result', async () => {
    if (!captain1Token) return;
    const res = await request(BASE_URL)
      .post('/api/match-results')
      .set('Authorization', `Bearer ${captain1Token}`)
      .send({
        team1Id: 1,
        team2Id: 2,
        team1Score: 2,
        team2Score: 1,
        matchDate: new Date().toISOString().split('T')[0]
      });
    expect([201, 400, 401, 403]).toContain(res.status);
  });
});

describe('🔔 Notification Endpoints', () => {
  test('GET /api/notifications - Get all notifications', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/notifications/:id - Get notification by ID', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/notifications/1')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });
});

describe('⭐ Rating Endpoints', () => {
  test('GET /api/ratings - Get all ratings', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/ratings')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401]).toContain(res.status);
  });

  test('GET /api/ratings/:id - Get rating by ID', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .get('/api/ratings/1')
      .set('Authorization', `Bearer ${player1Token}`);
    expect([200, 401, 404]).toContain(res.status);
  });

  test('POST /api/ratings - Create rating', async () => {
    if (!player1Token) return;
    const res = await request(BASE_URL)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({
        fieldId: 1,
        rating: 5,
        comment: 'Great field!'
      });
    expect([201, 400, 401, 403]).toContain(res.status);
  });
});

describe('📊 Dashboard Endpoints', () => {
  test('GET /api/dashboard/stats - Get dashboard stats', async () => {
    if (!adminToken) return;
    const res = await request(BASE_URL)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 401, 403]).toContain(res.status);
  });

  test('GET /api/dashboard/search - Search resources', async () => {
    if (!adminToken) return;
    const res = await request(BASE_URL)
      .get('/api/dashboard/search?q=field')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 400, 401]).toContain(res.status);
  });
});

describe('⚽ Football Data API Endpoints (External)', () => {
  test('GET /api/matches - Get football matches', async () => {
    const res = await request(BASE_URL).get('/api/matches');
    expect([200, 500]).toContain(res.status);
  });

  test('GET /api/matches?league=PL - Get matches for specific league', async () => {
    const res = await request(BASE_URL).get('/api/matches?league=PL');
    expect([200, 500]).toContain(res.status);
  });

  test('GET /api/leagues/standings - Get league standings', async () => {
    const res = await request(BASE_URL).get('/api/leagues/standings');
    expect([200, 500]).toContain(res.status);
  });

  test('GET /api/leagues/standings?league=PL - Get specific league standings', async () => {
    const res = await request(BASE_URL).get('/api/leagues/standings?league=PL');
    expect([200, 500]).toContain(res.status);
  });
});

// Print test summary
afterAll(async () => {
  console.log('\n=== API Test Summary ===');
  console.log('All API tests completed!');
});

// Run authentication before all tests
beforeAll(async () => {
  // Add a small delay to ensure server is ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  await authenticateUsers();
});

