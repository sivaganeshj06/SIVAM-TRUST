# Login Issues - Diagnosis & Fix

## ✅ Current Status

All login components are working correctly:
- ✅ Database connection: WORKING
- ✅ 5 Active members found
- ✅ JWT Secret: CONFIGURED
- ✅ Frontend URL: CONFIGURED  
- ✅ Password hashing: WORKING

## 🔐 Available Login Accounts

Use these credentials to login:

### 1. Founder Account
```
Reference: STF/2026/FOU
Name: Sivaganesh J
Email: sivaganesh73acm@gmail.com
Dashboard: /founder-dashboard
```

### 2. Co-Founder 1
```
Reference: STF/2026/COF/01
Name: Santhosh S
Email: Santhoshsuresh513@gmail.com
Dashboard: /cofounder-dashboard
```

### 3. Co-Founder 2
```
Reference: STF/2026/COF/02
Name: Hariprasath R
Email: prasathhari5490@gmail.com
Dashboard: /cofounder-dashboard
```

### 4. Accountant
```
Reference: STF/2026/ACC/01
Name: Agathiyan R
Email: agathiyan8778@gmail.com
Dashboard: /accountant-dashboard
```

### 5. Media Manager
```
Reference: STF/2026/VED/01
Name: Elavarasan E
Dashboard: /media-dashboard
```

---

## 🛠️ Common Login Issues & Solutions

### Issue 1: "Invalid credentials" Error

**Symptoms:**
- Red error message appears
- Login form doesn't redirect
- Says "Invalid reference number or password"

**Causes:**
1. ❌ Wrong password
2. ❌ Wrong reference number format
3. ❌ Account is inactive
4. ❌ Password not set in database

**Solutions:**
```
✅ Double-check reference number (copy from list above)
✅ Make sure password is correct
✅ Check if account status is "active" in database
✅ If forgot password, reset it in database
```

---

### Issue 2: Backend Not Running

**Symptoms:**
- Login button spins forever
- "Network Error" in console
- Can't connect to API

**Solution:**
```bash
# Terminal 1: Start Backend
cd trust-website/backend
npm start

# Should see:
# Server running on port 5000 🚀
```

**Verify Backend is Running:**
```bash
# Windows PowerShell
curl http://localhost:5000/

# Should return:
# {"message":"Trust Website API Running ✅","status":"healthy"}
```

---

### Issue 3: Frontend Can't Connect to Backend

**Symptoms:**
- CORS errors in console
- 404 Not Found errors
- Network timeout

**Check Frontend API Configuration:**
```javascript
// File: trust-website/frontend/src/utils/api.js
// Should automatically detect localhost:5000
```

**Solution:**
```
✅ Make sure BOTH frontend and backend are running
✅ Frontend: http://localhost:3000
✅ Backend: http://localhost:5000
✅ Check browser console for errors
```

---

### Issue 4: Password Reset Needed

If you forgot the password, you have two options:

**Option 1: Reset via Database (Recommended)**
```sql
-- In Supabase dashboard, run this query:
-- Replace 'new_password' with your desired password

-- First, generate a hash (use bcrypt online tool)
-- Then update in database:
UPDATE members 
SET password_hash = '$2b$10$...' -- Your hashed password here
WHERE reference_number = 'STF/2026/FOU';
```

**Option 2: Use Password Reset Feature**
```
1. Go to /forgot-password (if implemented)
2. Enter email or reference number
3. Check email for reset link
4. Set new password
```

---

## 🧪 Testing Login Locally

### Quick Test Script
Run this to verify everything:

```bash
cd trust-website/backend
node simple_login_test.js
```

**Expected Output:**
```
✅ Database connected successfully
✅ Found 5 active members
✅ JWT_SECRET is configured
✅ FRONTEND_URL is configured
✅ Password hashing works
```

---

## 🔧 Backend Configuration Fixed

### Updated .env File:
```env
PORT=5000
SUPABASE_URL=https://rquocfboxadrmfvymjvm.supabase.co
SUPABASE_ANON_KEY=...
JWT_SECRET=sivamtrust_super_secret_key_2026
FRONTEND_URL=http://localhost:3000  ← ADDED
NODE_ENV=development                ← ADDED
```

### What Was Fixed:
1. ✅ Added `FRONTEND_URL` for CORS
2. ✅ Added `NODE_ENV` for environment detection
3. ✅ Verified JWT_SECRET exists
4. ✅ Verified Supabase connection

---

## 📋 Login Flow Verification

### Step-by-Step Process:

1. **User enters credentials**
   ```
   Reference: STF/2026/FOU
   Password: ********
   ```

2. **Frontend sends POST request**
   ```
   POST http://localhost:5000/api/auth/login
   Body: { reference_number, password }
   ```

3. **Backend validates**
   ```
   ✅ Check if user exists
   ✅ Check if status is "active"
   ✅ Verify password with bcrypt
   ✅ Generate JWT tokens
   ```

4. **Backend responds**
   ```json
   {
     "token": "eyJhbGc...",
     "user": {
       "id": "...",
       "name": "Sivaganesh J",
       "role": "founder",
       "email": "..."
     }
   }
   ```

5. **Frontend stores data**
   ```javascript
   localStorage.setItem('token', token)
   localStorage.setItem('trust_user', JSON.stringify(user))
   ```

6. **Frontend redirects**
   ```
   founder → /founder-dashboard
   co-founder-1 → /cofounder-dashboard
   co-founder-2 → /cofounder-dashboard
   accountant → /accountant-dashboard
   media → /media-dashboard
   ```

---

## 🐛 Debugging Tips

### Check Backend Logs:
```bash
# Backend terminal will show:
AUTH_SUCCESS { userId: '...', role: 'founder', ip: '::1' }
```

### Check Frontend Console:
```javascript
// Open DevTools (F12) → Console
// Should NOT see:
❌ CORS error
❌ Network error  
❌ 401 Unauthorized (unless credentials wrong)

// Should see:
✅ Successful API response
✅ User data stored
✅ Redirect happening
```

### Test API Directly:
```bash
# Using curl or Postman
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"reference_number":"STF/2026/FOU","password":"your_password"}'
```

---

## ✅ Pre-Deployment Checklist

Before deploying, verify:

- [ ] Backend runs without errors
- [ ] Frontend connects to backend
- [ ] Login works for all 5 accounts
- [ ] Redirects work correctly
- [ ] Data appears after login
- [ ] Logout works
- [ ] Session persists on page reload
- [ ] No CORS errors

---

## 🚀 Production Deployment Notes

When deploying to production:

### Backend .env:
```env
PORT=5000
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
JWT_SECRET=your_production_secret
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Frontend .env:
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

### Security Notes:
- ✅ Use HTTPS for both frontend and backend
- ✅ Use strong JWT_SECRET (not the default)
- ✅ Enable CORS only for your domain
- ✅ Use secure cookies in production
- ✅ Rate limit login attempts

---

## 📞 Still Having Issues?

### Run Diagnostics:
```bash
cd trust-website/backend
node simple_login_test.js
```

### Check These:
1. Backend running? → `curl http://localhost:5000/`
2. Database accessible? → Check Supabase dashboard
3. Credentials correct? → Verify reference number
4. Browser console? → Check for errors (F12)
5. Network tab? → Check API calls

### Common Error Messages:

**"Invalid credentials"**
→ Wrong password or reference number

**"Network Error"**
→ Backend not running

**"CORS Error"**
→ Frontend/backend mismatch

**"401 Unauthorized"**
→ Token expired or invalid

**"403 Forbidden"**
→ Wrong role for that dashboard

---

## 🎯 Summary

### What's Working:
✅ Database connection  
✅ 5 active accounts  
✅ JWT authentication  
✅ Password hashing  
✅ Backend configuration  

### What You Need:
1. **Start backend**: `cd backend && npm start`
2. **Start frontend**: `cd frontend && npm start`
3. **Login at**: `http://localhost:3000/admin/login`
4. **Use reference**: `STF/2026/FOU` (or any from list)
5. **Enter password**: Your account password

### If Login Fails:
- Check backend is running (port 5000)
- Verify reference number format
- Confirm password is correct
- Look at browser console for errors
- Check backend terminal for logs

---

**Everything is configured correctly!**  
**Just make sure backend is running and use correct credentials.** ✅

---

**Last Updated**: Login Fix Complete  
**Status**: READY TO USE ✅
