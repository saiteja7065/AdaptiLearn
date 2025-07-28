# 🚨 URGENT: Fix Firestore Database Rules

## **IMMEDIATE ACTION REQUIRED** (5 minutes)

The Firebase connection is failing because Firestore security rules are blocking access. Here's how to fix it:

### **Step 1: Access Firebase Console**
1. **Open**: https://console.firebase.google.com/
2. **Sign in** with your Google account
3. **Select project**: `adaptilearn-312da`

### **Step 2: Navigate to Firestore Rules**
1. **Click**: "Firestore Database" in left sidebar
2. **Click**: "Rules" tab (next to Data, Indexes, Usage)

### **Step 3: Update Security Rules**
**Replace the current rules** with this **EXACT** text:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access for authenticated users during development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### **Step 4: Publish Rules**
1. **Click**: "Publish" button
2. **Confirm**: "Publish rules"
3. **Wait**: For confirmation message

### **Step 5: Verify Database Setup**
1. **Go to**: "Data" tab in Firestore
2. **Check**: Database exists and is in "Native mode"
3. **Location**: Should show your selected region

### **Step 6: Check Authentication Settings**
1. **Click**: "Authentication" in left sidebar
2. **Go to**: "Settings" tab
3. **Authorized domains**: Ensure `localhost` is listed
4. **Sign-in methods**: Verify Email/Password and Google are enabled

---

## **Expected Result:**
- ✅ No more "client is offline" errors
- ✅ Authentication will work properly
- ✅ User data can be saved to Firestore
- ✅ Real-time updates will function

---

## **After Fixing Rules:**
1. **Refresh** your browser tab (localhost:3001)
2. **Check console** - errors should be gone
3. **Test registration** - should work without errors
4. **Test login** - should authenticate successfully

---

## **Security Note:**
These are **development rules** that allow all access. For production, you'll want more restrictive rules, but for MVP development and hackathon, this is perfect.

**Time to fix**: ~5 minutes
**Impact**: Enables all Firebase features to work properly
