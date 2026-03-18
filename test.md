# Football Field Booking API Testing Guide

## 🚀 Quick Setup

### Base URL
```
http://localhost:5000/api
```

### Test Users (Created for Testing)
| Role | Email | Password | Username | First Name | Last Name |
|-------|--------|----------|-----------|-------------|-------------|
| Admin | admin@test.com | admin123 | testadmin | Test Admin |
| Field Owner | owner@test.com | owner123 | testowner | Test Owner |
| Captain | captain@test.com | captain123 | testcaptain | Test Captain |
| Player | player@test.com | player123 | testplayer | Test Player |
| Guest | guest@test.com | guest123 | testguest | Test Guest |

---

## 🔐 Authentication Endpoints

### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@test.com", 
  "password": "password123",
  "firstName": "New",
  "lastName": "User",
  "phone": "0123456789",
  "role": "player"
}
```

### 2. Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "player@test.com",
  "password": "player123"
}
```

### 3. Get Current User Profile
```http
GET /auth/profile
Authorization: Bearer {{token}}
```

### 4. Update Profile
```http
PUT /auth/profile
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "0987654321"
}
```

### 5. Change Password
```http
PUT /auth/profile/password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "currentPassword": "player123",
  "newPassword": "newpassword123"
}
```

### 6. Logout
```http
POST /auth/logout
Authorization: Bearer {{token}}
```

---

## 👥 Users Endpoints

### 1. Get All Users (Admin Only)
```http
GET /users
Authorization: Bearer {{admin_token}}
```

### 2. Get User by ID
```http
GET /users/:id
Authorization: Bearer {{token}}
```

### 3. Update User (Admin Only)
```http
PUT /users/:id
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "status": "active"
}
```

### 4. Delete User (Admin Only)
```http
DELETE /users/:id
Authorization: Bearer {{admin_token}}
```

---

## 🏟️ Fields Endpoints

### 1. Get All Fields
```http
GET /fields?page=1&limit=10&status=available
```

### 2. Get Field by ID
```http
GET /fields/:id
```

### 3. Create Field (Field Owner Only)
```http
POST /fields
Authorization: Bearer {{owner_token}}
Content-Type: application/json

{
  "name": "Test Field",
  "description": "A beautiful football field",
  "address": "123 Test Street",
  "city": "Phnom Penh",
  "province": "Phnom Penh",
  "pricePerHour": 50,
  "fieldType": "7v7",
  "surfaceType": "artificial_turf",
  "capacity": 14,
  "operatingHours": {
    "monday": {"open": "08:00", "close": "22:00"},
    "tuesday": {"open": "08:00", "close": "22:00"}
  },
  "amenities": ["parking", "showers", "lights"]
}
```

### 4. Update Field (Owner Only)
```http
PUT /fields/:id
Authorization: Bearer {{owner_token}}
Content-Type: application/json

{
  "name": "Updated Field Name",
  "pricePerHour": 60
}
```

### 5. Delete Field (Owner Only)
```http
DELETE /fields/:id
Authorization: Bearer {{owner_token}}
```

### 6. Upload Field Images (Owner Only)
```http
POST /fields/:id/images
Authorization: Bearer {{owner_token}}
Content-Type: multipart/form-data

Key: images
Type: File
Value: [field_image1.jpg, field_image2.jpg]
```

---

## 📅 Bookings Endpoints

### 1. Get All Bookings
```http
GET /bookings?page=1&limit=10&status=confirmed
Authorization: Bearer {{token}}
```

### 2. Get Booking by ID
```http
GET /bookings/:id
Authorization: Bearer {{token}}
```

### 3. Create Booking
```http
POST /bookings
Authorization: Bearer {{player_token}}
Content-Type: application/json

{
  "fieldId": 1,
  "teamId": 1,
  "startTime": "2026-03-20T14:00:00.000Z",
  "endTime": "2026-03-20T16:00:00.000Z",
  "notes": "Friendly match"
}
```

### 4. Update Booking
```http
PUT /bookings/:id
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Updated booking details"
}
```

### 5. Cancel Booking
```http
PUT /bookings/:id/cancel
Authorization: Bearer {{token}}
```

### 6. Get Public Schedule
```http
GET /public/schedule?date=2026-03-15&limit=6
```

### 7. Get Booking Stats
```http
GET /bookings/public/stats?lookbackDays=30&statuses=confirmed,completed
```

---

## 👥 Teams Endpoints

### 1. Get All Teams
```http
GET /teams?page=1&limit=10
```

### 2. Get Team by ID
```http
GET /teams/:id
```

### 3. Create Team (Captain Only)
```http
POST /teams
Authorization: Bearer {{captain_token}}
Content-Type: application/json

{
  "name": "Test Team",
  "description": "A competitive football team",
  "maxPlayers": 22,
  "skillLevel": "intermediate",
  "homeFieldId": 1,
  "preferredDays": ["saturday", "sunday"],
  "preferredTimes": ["14:00-16:00", "16:00-18:00"]
}
```

### 4. Update Team (Captain Only)
```http
PUT /teams/:id
Authorization: Bearer {{captain_token}}
Content-Type: application/json

{
  "name": "Updated Team Name",
  "description": "Updated description"
}
```

### 5. Delete Team (Captain Only)
```http
DELETE /teams/:id
Authorization: Bearer {{captain_token}}
```

### 6. Upload Team Logo (Captain Only)
```http
POST /teams/:id/logo
Authorization: Bearer {{captain_token}}
Content-Type: multipart/form-data

Key: logo
Type: File
Value: team_logo.jpg
```

### 7. Join Team (Player Only)
```http
POST /teams/:id/join
Authorization: Bearer {{player_token}}
Content-Type: application/json

{
  "message": "I want to join this team",
  "position": "forward"
}
```

### 8. Get Team Members
```http
GET /teams/:id/members
Authorization: Bearer {{captain_token}}
```

### 9. Remove Team Member (Captain Only)
```http
DELETE /teams/:id/members/:memberId
Authorization: Bearer {{captain_token}}
```

---

## 🌐 Public Teams Endpoints

### 1. Get Public Teams
```http
GET /public/teams?page=1&limit=10&skillLevel=intermediate
```

### 2. Get Public Team Details
```http
GET /public/teams/:id
```

---

## 🔔 Notifications Endpoints

### 1. Get User Notifications
```http
GET /notifications
Authorization: Bearer {{token}}
```

### 2. Mark Notification as Read
```http
PUT /notifications/:id/read
Authorization: Bearer {{token}}
```

### 3. Delete Notification
```http
DELETE /notifications/:id
Authorization: Bearer {{token}}
```

---

## 🎯 Role Requests Endpoints

### 1. Get Role Requests
```http
GET /auth/role-requests
Authorization: Bearer {{token}}
```

### 2. Submit Role Request
```http
POST /auth/role-requests
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "requestedRole": "field_owner",
  "note": "I want to register my football field"
}
```

### 3. Get Admin Role Requests (Admin Only)
```http
GET /admin/role-requests
Authorization: Bearer {{admin_token}}
```

### 4. Approve Role Request (Admin Only)
```http
PUT /admin/role-requests/:id/approve
Authorization: Bearer {{admin_token}}
```

### 5. Reject Role Request (Admin Only)
```http
PUT /admin/role-requests/:id/reject
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "reason": "Insufficient documentation"
}
```

---

## 📊 Dashboard Endpoints

### 1. Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer {{token}}
```

### 2. Dashboard Search
```http
GET /dashboard/search?q=football&type=fields
Authorization: Bearer {{token}}
```

---

## 🏆 Match Results Endpoints

### 1. Get Match Results
```http
GET /match-results?page=1&limit=10
Authorization: Bearer {{token}}
```

### 2. Create Match Result
```http
POST /match-results
Authorization: Bearer {{captain_token}}
Content-Type: application/json

{
  "bookingId": 1,
  "homeTeamId": 1,
  "awayTeamId": 2,
  "homeScore": 3,
  "awayScore": 2,
  "matchDate": "2026-03-15T18:00:00.000Z"
}
```

---

## ⭐ Ratings Endpoints

### 1. Get Field Ratings
```http
GET /ratings/field/:fieldId
```

### 2. Create Field Rating
```http
POST /ratings/field
Authorization: Bearer {{player_token}}
Content-Type: application/json

{
  "fieldId": 1,
  "rating": 5,
  "comment": "Excellent field with great facilities!"
}
```

---

## 🧪 Postman Setup Instructions

### 1. Import Collection
1. Copy the entire content of this file
2. In Postman: Import > Raw text
3. Paste the content and click "Continue"

### 2. Set Environment Variables
Create environment variables in Postman:
- `base_url`: `http://localhost:5000/api`
- `admin_token`: (get from admin login response)
- `owner_token`: (get from owner login response)
- `captain_token`: (get from captain login response)
- `player_token`: (get from player login response)
- `token`: (any user token)

### 3. Test Workflow
1. **Login** with test credentials first
2. **Copy token** from login response to environment variables
3. **Test endpoints** with proper authorization
4. **Test CRUD operations** for each resource type

---

## 🔍 Common Test Scenarios

### Authentication Flow
1. Register new user → Should return 201 with token
2. Login with valid credentials → Should return 200 with token
3. Login with invalid credentials → Should return 400
4. Access protected endpoint without token → Should return 401
5. Access protected endpoint with invalid token → Should return 401

### CRUD Operations Test
1. **Create** → POST with valid data → Should return 201
2. **Read** → GET existing resource → Should return 200
3. **Update** → PUT with valid data → Should return 200
4. **Delete** → DELETE existing resource → Should return 200

### Permission Tests
1. **Admin** can access all endpoints
2. **Field Owner** can only manage their own fields
3. **Captain** can only manage their own teams
4. **Player** can only create bookings and join teams
5. **Guest** has limited access

---

## 📝 Response Codes

| Code | Meaning |
|-------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 🚨 Important Notes

1. **Always include** `Authorization: Bearer {{token}}` header for protected endpoints
2. **Use** `Content-Type: application/json` for JSON requests
3. **Use** `Content-Type: multipart/form-data` for file uploads
4. **Test** with different user roles to verify permissions
5. **Backend must be running** on `http://localhost:5000`
6. **Database should be populated** with test data

---

## 🎯 Testing Checklist

- [ ] Login with all test user roles
- [ ] Test all CRUD operations
- [ ] Verify permission-based access control
- [ ] Test file upload functionality
- [ ] Test error scenarios
- [ ] Validate response formats
- [ ] Check rate limiting (if implemented)

Happy Testing! 🧪
