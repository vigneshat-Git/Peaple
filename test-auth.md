# Authentication Debugging Guide

## 401 Unauthorized Error - Diagnosis & Solutions

### Immediate Steps to Debug

1. **Open Browser Console** and run the debug script:
   ```javascript
   // Copy and paste the contents of debug-auth.js into your browser console
   ```

2. **Check the Network Tab**:
   - Look for the failed request to `/api/communities`
   - Check if the `Authorization` header is present
   - Verify the token format

### Common Causes & Solutions

#### 1. No Token in localStorage
**Symptoms**: 
- Console shows "Token exists: false"
- No Authorization header in network request

**Solution**: 
- User needs to log in again
- Check if login process is storing token correctly

#### 2. Invalid/Expired Token
**Symptoms**:
- Token exists but 401 error still occurs
- Token might be expired or malformed

**Solution**:
- Token is automatically cleared on 401 error
- User will be redirected to login page

#### 3. Token is "undefined" string
**Symptoms**:
- Token exists but is literally "undefined"
- Authorization header contains "Bearer undefined"

**Solution**:
- Code now handles this case automatically
- Invalid token is cleared and user redirected

### Testing the Fix

1. **Try logging out and logging back in**
2. **Clear localStorage manually**:
   ```javascript
   localStorage.removeItem("token");
   localStorage.removeItem("peaple_user");
   location.reload();
   ```
3. **Check server logs** to see why the token is being rejected

### Backend Verification

Make sure your backend at `http://localhost:5000`:
- Accepts Bearer tokens in Authorization header
- Has proper JWT middleware configured
- Token secret matches between services

### Debug Output

With the added debugging, you should see console logs like:
```
[API Debug] Request to: /communities
[API Debug] Token exists: true
[API Debug] Token value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[API Debug] Token is "undefined": false
[API Debug] Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If you see `[API Error] 401 Unauthorized`, the token is being rejected by the server.
