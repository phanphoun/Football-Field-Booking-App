# Postman Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Issue: "Validation failed"

#### ✅ Solution 1: Check Content-Type Header
**Make sure you have:**
- Header: `Content-Type` = `application/json`
- **NOT:** `Content-Type` = `text/plain` or missing

#### ✅ Solution 2: Check Body Format
**Correct Body Settings:**
- Body Type: **Raw**
- Raw Format: **JSON**
- **NOT:** Form-data, x-www-form-urlencoded

#### ✅ Solution 3: Check JSON Syntax
**Correct JSON:**
```json
{
  "email": "player@test.com",
  "password": "player123"
}
```

**Common JSON Errors:**
- Missing quotes around keys/values
- Extra commas
- Single quotes instead of double quotes

---

## 📋 Step-by-Step Postman Setup

### 1. Create New Request
- Click **New** → **Request**
- Name: "Login Test"

### 2. Set Method & URL
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`

### 3. Set Headers
- Go to **Headers** tab
- Add header:
  - **Key:** `Content-Type`
  - **Value:** `application/json`

### 4. Set Body
- Go to **Body** tab
- Select **Raw**
- From dropdown, select **JSON**
- Enter:
```json
{
  "email": "player@test.com",
  "password": "player123"
}
```

### 5. Send Request
- Click **Send**
- Should return status **200 OK**

---

## 🧪 Test All Users

### Admin Login
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

### Player Login
```json
{
  "email": "player@test.com",
  "password": "player123"
}
```

### Owner Login
```json
{
  "email": "owner@test.com",
  "password": "owner123"
}
```

### Captain Login
```json
{
  "email": "captain@test.com",
  "password": "captain123"
}
```

### Guest Login
```json
{
  "email": "guest@test.com",
  "password": "guest123"
}
```

---

## 🔧 Debug Steps

### Step 1: Check Backend Status
```bash
curl http://localhost:5000/
```
Should return API info.

### Step 2: Test with curl
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player@test.com","password":"player123"}'
```

### Step 3: Check Postman Console
- Click **Console** at bottom
- Look for error messages
- Check request headers and body

---

## 📱 Screenshots Guide

### Correct Postman Setup:
```
┌─────────────────────────────────────┐
│ POST | http://localhost:5000/api/auth/login │
├─────────────────────────────────────┤
│ Headers                              │
│ Content-Type: application/json      │
├─────────────────────────────────────┤
│ Body | Raw | JSON                    │
│ {                                    │
│   "email": "player@test.com",       │
│   "password": "player123"           │
│ }                                    │
└─────────────────────────────────────┘
```

### Wrong Postman Setup:
```
┌─────────────────────────────────────┐
│ POST | http://localhost:5000/api/auth/login │
├─────────────────────────────────────┤
│ Headers (MISSING!)                   │
├─────────────────────────────────────┤
│ Body | Form-data (WRONG!)            │
│ email: [text field]                  │
│ password: [text field]              │
└─────────────────────────────────────┘
```

---

## 🚨 Common Mistakes

### ❌ Using Form-data
```
Body Type: Form-data
Key: email, Value: player@test.com
Key: password, Value: player123
```
**Fix:** Change to Raw → JSON

### ❌ Missing Content-Type
```
Headers: (empty)
```
**Fix:** Add `Content-Type: application/json`

### ❌ Wrong JSON Format
```
{
  email: "player@test.com",  // Missing quotes
  "password": "player123",   // Extra comma
}
```
**Fix:** Proper JSON syntax

### ❌ Single Quotes
```
{
  'email': 'player@test.com',  // Single quotes
  'password': 'player123'
}
```
**Fix:** Use double quotes

---

## ✅ Success Response

You should see:
```json
{
  "user": {
    "id": 18,
    "username": "testplayer",
    "email": "player@test.com",
    "role": "player"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Status Code:** 200 OK

---

## 🆘 Still Not Working?

1. **Check backend is running:** `http://localhost:5000`
2. **Clear Postman cache:** File → Settings → Data → Clear
3. **Try incognito mode:** File → Incognito
4. **Restart Postman:** Close and reopen
5. **Check network:** No firewall blocking port 5000

---

## 📞 Need More Help?

If still getting "Validation failed":
1. Take screenshot of Postman request
2. Check Postman Console for errors
3. Verify backend logs
4. Test with curl command above
