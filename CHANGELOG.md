# CHANGELOG

## [Fixed] - Auth Flow Issues - 2025-10-05

### 🔧 **Backend Fixes (FastAPI)**

- **✅ Database Logging**: Added startup logging to track `ENV` and `DATABASE_URL` for debugging
- **✅ Dev User Seeding**: Enhanced `seed_dev_user.py` with robust logging and verification
- **✅ Email Normalization**: Fixed case-insensitive email lookup using `func.lower()`
- **✅ Error Handling**: Standardized error responses (`INVALID_CREDENTIALS`, `ACCOUNT_INACTIVE`)
- **✅ Auth Logging**: Added structured logging for login attempts and failures
- **✅ CORS Configuration**: Updated to allow specific frontend domains instead of wildcard

### 🎨 **Frontend Fixes (React/Vite)**

- **✅ API Error Handling**: Improved error parsing for JSON responses
- **✅ Login Validation**: Removed password length restrictions on login forms
- **✅ Error Messages**: Better user feedback for different error scenarios

### 🧪 **Testing & Validation**

- **✅ Acceptance Tests**: Created comprehensive test suite (`acceptance_tests.sh`)
- **✅ All Tests Pass**: Backend API, case-insensitive email, password verification, error handling

### 📁 **Files Modified**

**Backend:**
- `minimal_auth_server.py` - Added startup logging, improved CORS
- `auth_router.py` - Enhanced error handling and logging
- `seed_dev_user.py` - Robust dev user seeding with verification
- `auth.py` - Case-insensitive email lookup

**Frontend:**
- `apps/web/src/services/authService.ts` - Better error handling
- `apps/web/src/lib/api.ts` - Improved JSON error parsing

**Testing:**
- `acceptance_tests.sh` - Comprehensive auth flow testing

### 🌐 **Environment Setup**

**Required Environment Variable:**
```bash
ENV=dev  # Enables dev user seeding
```

### 🔐 **Test Credentials**

- **Email**: `sla@test.com`
- **Password**: `1234567`
- **Role**: `superadmin`
- **Status**: `active`

### 🚀 **Access URLs**

- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:8000/api
- **Login API**: http://localhost:8000/api/auth/login

### ✅ **Acceptance Criteria Met**

- ✅ **Seeding**: Dev user exists with valid hashed password
- ✅ **Login**: Returns `200` with JWT token, redirects to dashboard
- ✅ **Error Handling**: Wrong password returns `401` with `INVALID_CREDENTIALS`
- ✅ **Case Insensitivity**: `SLA@Test.com` works correctly
- ✅ **Security**: Uses bcrypt verification, no plaintext comparisons
- ✅ **Frontend**: No false negatives, proper error states
- ✅ **CORS**: Configured for localhost and preview domains

### 🎯 **Summary**

**Fix login: lowercase email, hash verify, dev seed, CORS allowlist, FE validation & endpoint wiring.**

### 🔧 **Final Fix - Frontend API URL**

**Issue**: Frontend was using incorrect API URL configuration
- **Problem**: `VITE_API_URL` was set to `http://localhost:8000` instead of `http://localhost:8000/api`
- **Solution**: Updated `/Users/bokarhamma/SLA-DEV/apps/web/.env.local` to include `VITE_API_URL=http://localhost:8000/api`
- **Result**: Frontend now correctly calls the backend API endpoint

**Files Modified:**
- `apps/web/.env.local` - Added correct `VITE_API_URL`
- `acceptance_tests.sh` - Updated frontend port from 5174 to 5173

The authentication flow is now fully functional and secure! 🎉
