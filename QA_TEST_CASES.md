# 🧪 QA Test Cases - Football Field Booking App

## 📋 Test Plan Overview

**Project:** Football Field Booking Application  
**Testing Duration:** 4 weeks (aligned with sprints)  
**Test Environment:** Staging/Development  
**Test Types:** Functional, UI/UX, Performance, Security, Integration  

---

## 🏃 Sprint 1 Test Cases (Week 1)

### **EPIC-001: User Authentication System**

#### **TEST-AUTH-001: User Registration**
**Test Case ID:** TC-REG-001  
**Priority:** High  
**Test Type:** Functional  

**Test Steps:**
1. Navigate to `/register` page
2. Enter valid email: `test@example.com`
3. Enter password: `Test123!@#`
4. Enter confirm password: `Test123!@#`
5. Fill in all required fields (first name, last name, phone)
6. Click "Register" button

**Expected Results:**
- User is successfully registered
- Redirected to login page
- Success message displayed: "Registration successful"
- User data stored in database with hashed password

**Test Data:**
- Valid emails: `user@test.com`, `qa@test.com`
- Invalid emails: `invalid`, `test@`, `@test.com`
- Weak passwords: `123`, `password`, `test`

---

#### **TEST-AUTH-002: User Login**
**Test Case ID:** TC-LOGIN-001  
**Priority:** High  
**Test Type:** Functional  

**Test Steps:**
1. Navigate to `/login` page
2. Enter registered email and password
3. Click "Login" button

**Expected Results:**
- User successfully authenticated
- JWT token generated
- Redirected to dashboard/home page
- User session established

**Negative Test Cases:**
- Invalid email/password shows error message
- Empty fields show validation errors
- Account not found displays appropriate message

---

#### **TEST-AUTH-003: Password Security**
**Test Case ID:** TC-SEC-001  
**Priority:** High  
**Test Type:** Security  

**Test Steps:**
1. Register new user with password: `MySecurePassword123!`
2. Check database for password storage
3. Attempt login with correct password
4. Attempt login with incorrect password

**Expected Results:**
- Password stored as hash (not plain text)
- bcrypt salt rounds applied (minimum 10)
- Login succeeds with correct password
- Login fails with incorrect password

---

### **EPIC-002: Field Management System**

#### **TEST-FIELD-001: Field Creation**
**Test Case ID:** TC-FIELD-001  
**Priority:** High  
**Test Type:** Functional  

**Test Steps:**
1. Login as field owner
2. Navigate to field management section
3. Click "Add New Field"
4. Fill field details:
   - Name: "Test Football Field"
   - Address: "123 Test Street"
   - Price per hour: $25
   - Field type: "Standard"
   - Capacity: 22 players
5. Upload field images
6. Click "Save Field"

**Expected Results:**
- Field successfully created
- Images uploaded and stored
- Field appears in field listings
- Data correctly saved in database

---

#### **TEST-FIELD-002: Field Search and Filtering**
**Test Case ID:** TC-FIELD-002  
**Priority:** Medium  
**Test Type:** Functional  

**Test Steps:**
1. Navigate to `/fields` page
2. Enter search term: "Phnom Penh"
3. Apply filters:
   - Price range: $20-$30
   - Field type: "Standard"
   - Available now: Yes
4. Click "Search"

**Expected Results:**
- Relevant fields displayed
- Filters applied correctly
- Search results match criteria
- No duplicate entries

---

### **EPIC-003: Basic UI Structure**

#### **TEST-UI-001: Navigation and Routing**
**Test Case ID:** TC-UI-001  
**Priority:** Medium  
**Test Type:** UI/UX  

**Test Steps:**
1. Test all navigation links
2. Verify URL routing
3. Test browser back/forward buttons
4. Test mobile responsive menu

**Expected Results:**
- All links work correctly
- URLs update appropriately
- 404 pages handled gracefully
- Mobile menu functions properly

---

## ⚡ Sprint 2 Test Cases (Week 2)

### **EPIC-004: Booking Management**

#### **TEST-BOOKING-001: Create Booking**
**Test Case ID:** TC-BOOK-001  
**Priority:** High  
**Test Type:** Functional  

**Test Steps:**
1. Login as regular user
2. Select a field from listings
3. Choose date: Tomorrow
4. Select time slot: 18:00-19:00
5. Enter number of players: 11
6. Click "Confirm Booking"

**Expected Results:**
- Booking successfully created
- Confirmation email sent
- Time slot marked as unavailable
- Booking appears in user dashboard

---

#### **TEST-BOOKING-002: Booking Conflict Detection**
**Test Case ID:** TC-BOOK-002  
**Priority:** High  
**Test Type:** Functional  

**Test Steps:**
1. Create booking for Field A, 18:00-19:00
2. Attempt second booking for same field/time
3. Verify conflict detection

**Expected Results:**
- Second booking rejected
- Error message: "Time slot already booked"
- First booking remains unaffected
- Available time slots updated

---

#### **TEST-BOOKING-003: Time Slot Management**
**Test Case ID:** TC-BOOK-003  
**Priority:** Medium  
**Test Type:** Functional  

**Test Steps:**
1. View field availability calendar
2. Test different time slots
3. Verify booking hours (8:00-22:00)
4. Test minimum booking duration (1 hour)

**Expected Results:**
- Available slots clearly marked
- Booked slots disabled
- Operating hours enforced
- Duration validation working

---

### **EPIC-005: User Profile Management**

#### **TEST-PROFILE-001: Profile Update**
**Test Case ID:** TC-PROF-001  
**Priority:** Medium  
**Test Type:** Functional  

**Test Steps:**
1. Login and navigate to profile
2. Update first name: "John Updated"
3. Update phone number: "+85512345678"
4. Upload profile picture
5. Click "Save Changes"

**Expected Results:**
- Profile successfully updated
- Changes reflected immediately
- Image uploaded and displayed
- Database updated correctly

---

#### **TEST-PROFILE-002: Profile Image Upload**
**Test Case ID:** TC-PROF-002  
**Priority:** Medium  
**Test Type:** Functional  

**Test Steps:**
1. Navigate to profile settings
2. Click "Upload Photo"
3. Select image file (JPG, PNG)
4. Upload and save

**Expected Results:**
- Image uploaded successfully
- File size limits enforced (max 5MB)
- File type validation working
- Image displayed properly

---

### **EPIC-006: Booking Interface**

#### **TEST-UI-002: Field Listing Page**
**Test Case ID:** TC-UI-002  
**Priority:** Medium  
**Test Type:** UI/UX  

**Test Steps:**
1. Navigate to `/fields`
2. Test search functionality
3. Test sorting options (price, rating, distance)
4. Test pagination
5. Test field card interactions

**Expected Results:**
- Search returns relevant results
- Sorting works correctly
- Pagination functions properly
- Field cards display correctly

---

## 🎯 Sprint 3 Test Cases (Week 3)

### **EPIC-007: Team Management**

#### **TEST-TEAM-001: Team Creation**
**Test Case ID:** TC-TEAM-001  
**Priority:** High  
**Test Type:** Functional  

**Test Steps:**
1. Login as team captain
2. Navigate to team management
3. Click "Create Team"
4. Fill team details:
   - Team name: "Test Warriors"
   - Jersey color: "Blue"
   - Secondary color: "White"
   - Max players: 15
5. Click "Create Team"

**Expected Results:**
- Team successfully created
- User assigned as captain
- Team appears in team listings
- Team dashboard accessible

---

#### **TEST-TEAM-002: Member Management**
**Test Case ID:** TC-TEAM-002  
**Priority:** Medium  
**Test Type:** Functional  

**Test Steps:**
1. Navigate to team dashboard
2. Click "Invite Members"
3. Enter member email: `player@test.com`
4. Set member role: "Player"
5. Send invitation

**Expected Results:**
- Invitation email sent
- Member appears as "Pending"
- Acceptance updates status
- Member can join team

---

#### **TEST-TEAM-003: Team Role System**
**Test Case ID:** TC-TEAM-003  
**Priority:** Medium  
**Test Type:** Functional  

**Test Steps:**
1. Test captain permissions
2. Test player permissions
3. Test role assignment
4. Test role removal

**Expected Results:**
- Captains can manage team
- Players have limited access
- Role changes apply immediately
- Permission boundaries enforced

---

### **EPIC-008: Match Management**

#### **TEST-MATCH-001: Match Scheduling**
**Test Case ID:** TC-MATCH-001  
**Priority:** High  
**Test Type:** Functional  

**Test Steps:**
1. Create team and book field
2. Navigate to match scheduling
3. Select opponent team
4. Set match date and time
5. Confirm match creation

**Expected Results:**
- Match successfully scheduled
- Both teams notified
- Field booking linked to match
- Match appears in calendars

---

#### **TEST-MATCH-002: Opponent Matchmaking**
**Test Case ID:** TC-MATCH-002  
**Priority**: Medium  
**Test Type:** Functional  

**Test Steps:**
1. Create booking with "Find Opponent"
2. Search for available teams
3. Send match request
4. Accept/reject match requests

**Expected Results:**
- Available teams displayed
- Match requests sent/received
- Acceptance creates match
- Rejection removes request

---

#### **TEST-MATCH-003: Match Result Tracking**
**Test Case ID:** TC-MATCH-003  
**Priority**: Medium  
**Test Type:** Functional  

**Test Steps:**
1. Navigate to completed match
2. Enter final scores: Home 2-1 Away
3. Select MVP player
4. Add match notes
5. Save results

**Expected Results:**
- Results saved correctly
- Team statistics updated
- MVP recorded
- Match history updated

---

### **EPIC-009: Team Dashboard**

#### **TEST-UI-003: Team Interface**
**Test Case ID:** TC-UI-003  
**Priority**: Medium  
**Test Type:** UI/UX  

**Test Steps:**
1. Navigate to team dashboard
2. Test all team features
3. Test member management interface
4. Test statistics display

**Expected Results:**
- Dashboard loads correctly
- All features accessible
- Statistics display accurately
- Interface responsive

---

## 🚀 Sprint 4 Test Cases (Week 4)

### **EPIC-009: System Optimization**

#### **TEST-PERF-001: Performance Testing**
**Test Case ID:** TC-PERF-001  
**Priority**: High  
**Test Type**: Performance  

**Test Steps:**
1. Load test with 100 concurrent users
2. Test page load times
3. Test API response times
4. Test database query performance

**Expected Results:**
- Page load < 3 seconds
- API response < 500ms
- Database queries optimized
- System handles load gracefully

---

#### **TEST-PERF-002: Caching Strategy**
**Test Case ID:** TC-PERF-002  
**Priority**: Medium  
**Test Type**: Performance  

**Test Steps:**
1. Test field listing cache
2. Test user session cache
3. Test cache invalidation
4. Measure cache hit rates

**Expected Results:**
- Cache hit rate > 80%
- Cache invalidation works
- Reduced database load
- Improved response times

---

#### **TEST-PERF-003: API Rate Limiting**
**Test Case ID:** TC-PERF-003  
**Priority**: Medium  
**Test Type**: Performance  

**Test Steps:**
1. Send 100 requests/minute to API
2. Test rate limiting enforcement
3. Test rate limit bypass attempts
4. Verify rate limit headers

**Expected Results:**
- Rate limiting enforced
- 429 status code returned
- Rate limit headers present
- System protection working

---

### **EPIC-010: Deployment Preparation**

#### **TEST-DEPLOY-001: Environment Configuration**
**Test Case ID:** TC-DEPLOY-001  
**Priority**: High  
**Test Type**: Integration  

**Test Steps:**
1. Test production environment variables
2. Test database connections
3. Test external service integrations
4. Verify SSL certificates

**Expected Results:**
- Environment variables loaded
- Database connections stable
- External services working
- SSL certificates valid

---

#### **TEST-DEPLOY-002: Backup Strategy**
**Test Case ID:** TC-DEPLOY-002  
**Priority**: Medium  
**Test Type**: Integration  

**Test Steps:**
1. Test database backup
2. Test file backup
3. Test backup restoration
4. Verify backup schedules

**Expected Results:**
- Backups created successfully
- Restoration works correctly
- Backup schedules active
- Data integrity maintained

---

### **EPIC-011: Final Polish**

#### **TEST-UI-004: Responsive Design**
**Test Case ID:** TC-UI-004  
**Priority**: Medium  
**Test Type**: UI/UX  

**Test Steps:**
1. Test on mobile devices
2. Test on tablets
3. Test different screen resolutions
4. Test orientation changes

**Expected Results:**
- Mobile layout functional
- Tablet layout optimized
- All resolutions supported
- Orientation handled correctly

---

#### **TEST-UI-005: Accessibility**
**Test Case ID**: TC-UI-005  
**Priority**: Medium  
**Test Type**: Accessibility  

**Test Steps:**
1. Test keyboard navigation
2. Test screen reader compatibility
3. Test color contrast
4. Test ARIA labels

**Expected Results:**
- Keyboard navigation works
- Screen reader compatible
- Color contrast WCAG compliant
- ARIA labels present

---

#### **TEST-UI-006: Error Handling**
**Test Case ID**: TC-UI-006  
**Priority**: Medium  
**Test Type**: UI/UX  

**Test Steps:**
1. Test network errors
2. Test server errors
3. Test validation errors
4. Test 404 pages

**Expected Results:**
- User-friendly error messages
- Graceful error recovery
- Consistent error styling
- Proper 404 handling

---

## 🔒 Security Testing

### **TEST-SEC-001: Authentication Security**
**Test Case ID**: TC-SEC-001  
**Priority**: Critical  
**Test Type**: Security  

**Test Steps:**
1. Test SQL injection attempts
2. Test XSS vulnerabilities
3. Test CSRF protection
4. Test session hijacking

**Expected Results:**
- SQL injection blocked
- XSS filtered
- CSRF tokens validated
- Session security enforced

---

### **TEST-SEC-002: API Security**
**Test Case ID**: TC-SEC-002  
**Priority**: Critical  
**Test Type**: Security  

**Test Steps:**
1. Test unauthorized access
2. Test API endpoint security
3. Test data validation
4. Test rate limiting

**Expected Results:**
- Unauthorized access blocked
- API endpoints secured
- Input validation working
- Rate limiting active

---

## 📊 Test Execution Plan

### **Daily Testing Schedule**
- **Morning:** Smoke tests and regression tests
- **Mid-day:** New feature testing
- **Evening:** Performance and security tests

### **Weekly Milestones**
- **Week 1:** Core functionality testing complete
- **Week 2:** Booking system validated
- **Week 3:** Team features tested
- **Week 4:** Full system integration tested

### **Test Metrics**
- **Test Coverage:** > 90%
- **Pass Rate:** > 95%
- **Bug Resolution:** < 24 hours
- **Performance:** < 3 second load times

---

## 🐛 Bug Reporting Template

### **Bug Report Format**
```
Bug ID: BUG-XXX
Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Priority: [1-5]
Environment: [Browser/OS/Device]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Attachments: [Screenshots/Videos]
```

---

## ✅ Acceptance Criteria

### **Definition of Done**
- [ ] All test cases executed
- [ ] No critical bugs remaining
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] User acceptance testing complete
- [ ] Documentation updated

### **Release Criteria**
- [ ] 95%+ test cases passing
- [ ] All critical issues resolved
- [ ] Performance requirements met
- [ ] Security audit passed
- [ ] Stakeholder approval received

---

**Last Updated:** February 17, 2026  
**Test Manager:** [QA Team Lead Name]  
**Next Review:** End of each sprint

---

*This comprehensive test plan ensures quality delivery across all sprints with thorough coverage of functional, performance, and security requirements.*
