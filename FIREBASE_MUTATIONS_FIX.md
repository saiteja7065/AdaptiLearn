# Firebase Mutations Error - Quick Fix Guide

## 🚨 **Current Error:**
```
Cannot read properties of undefined (reading 'mutations')
TypeError: Cannot read properties of undefined (reading 'mutations')
```

## 🔧 **IMMEDIATE SOLUTIONS:**

### **Solution 1: Clear Browser Storage (Fastest)**
1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Click "Storage"** in left sidebar
4. **Click "Clear site data"**
5. **Refresh page** (F5)

### **Solution 2: Hard Refresh**
- **Press**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Or**: `Ctrl + F5`

### **Solution 3: Disable Offline Persistence (Code Fix)**
Add this to your Firebase config to prevent offline sync issues:

```javascript
// In src/firebase/config.js - add this after db initialization
import { connectFirestoreEmulator, disableNetwork } from 'firebase/firestore';

// Disable offline persistence for development
if (process.env.NODE_ENV === 'development') {
  try {
    disableNetwork(db);
  } catch (error) {
    console.log('Network already disabled or error:', error);
  }
}
```

## 🎯 **ROOT CAUSE:**
This error typically happens when:
- Firebase rules were changed while app was running
- Browser cached old connection state
- Offline persistence conflicts with new rules

## ⚡ **QUICK TEST:**
After trying solutions above:
1. **Open browser console**
2. **Look for**: "Firebase connection test complete"
3. **Test authentication**: Should work without mutations error
