# Firebase Project Setup Guide - AdaptiLearn

## 🚀 **Step-by-Step Firebase Configuration**

### **Step 1: Create Firebase Project (5-10 minutes)**

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Create a project"**
3. **Project name**: `AdaptiLearn-MVP` or `AI-Adaptive-Exam-Assistant`
4. **Enable Google Analytics**: Yes (recommended for user insights)
5. **Choose Analytics account**: Create new or use existing

### **Step 2: Enable Authentication (2-3 minutes)**

1. In Firebase Console, go to **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. **Enable Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" → Save
4. **Enable Google Sign-in**:
   - Click on "Google"
   - Toggle "Enable"
   - Add your email as test user
   - Save

### **Step 3: Create Firestore Database (2-3 minutes)**

1. Go to **Firestore Database** → **Create database**
2. **Start in test mode** (we'll secure it later)
3. **Choose location**: Select closest to your region
   - For India: `asia-south1 (Mumbai)`
   - For US: `us-central1`
4. **Click Done**

### **Step 4: Configure Firebase Storage (1-2 minutes)**

1. Go to **Storage** → **Get started**
2. **Start in test mode**
3. **Choose same location** as Firestore
4. **Click Done**

### **Step 5: Get Configuration Keys (3-5 minutes)**

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. **Click web icon** `</>`
4. **App nickname**: `AdaptiLearn-Web`
5. **Enable Firebase Hosting**: Yes
6. **Register app**

7. **Copy the configuration** object that looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### **Step 6: Update Environment Variables**

1. **Open** `.env` file in your project root
2. **Replace** the placeholder values with your actual Firebase config:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyC...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### **Step 7: Test Firebase Connection**

1. **Save all files**
2. **Restart your development server**:
   ```bash
   npm start
   ```
3. **Open browser console** (F12)
4. **Look for Firebase initialization** messages
5. **Try the authentication** features

---

## 🔥 **Firebase Collections Structure**

### **Users Collection**
```
users/{userId}
├── displayName: string
├── email: string
├── photoURL: string (optional)
├── createdAt: timestamp
├── lastLogin: timestamp
├── preferences: object
└── profile: object
```

### **User Assessments**
```
users/{userId}/assessments/{assessmentId}
├── subject: string
├── questions: array
├── answers: array
├── score: number
├── totalQuestions: number
├── difficulty: string
├── timeSpent: number
├── timestamp: timestamp
└── adaptiveData: object
```

### **Questions Collection**
```
questions/{questionId}
├── question: string
├── options: array
├── correctAnswer: string
├── explanation: string
├── subject: string
├── topic: string
├── difficulty: string (easy/medium/hard)
├── tags: array
└── metadata: object
```

### **User Progress**
```
users/{userId}/progress/current
├── totalAssessments: number
├── averageScore: number
├── strongSubjects: array
├── weakSubjects: array
├── learningStreak: number
├── lastActive: timestamp
├── studyTimeToday: number
└── weeklyProgress: object
```

---

## 🎯 **Quick Test Checklist**

### **After Firebase Setup:**
- [ ] Firebase project created
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore database created
- [ ] Configuration added to `.env`
- [ ] Development server restarted
- [ ] No console errors visible

### **Authentication Test:**
- [ ] Can create new account
- [ ] Can login with email/password
- [ ] Google sign-in works
- [ ] User state persists on refresh
- [ ] Logout works properly

### **Next Priority: UserContext Integration**
Once authentication works, we'll connect your UserContext to Firestore for real-time data storage and retrieval.

---

## 🚨 **Common Issues & Solutions**

### **Error: "Firebase project not found"**
- Double-check project ID in `.env`
- Ensure `.env` file is in project root
- Restart development server

### **Error: "Auth domain not authorized"**
- Go to Authentication → Settings → Authorized domains
- Add `localhost` and your domain

### **Error: "API key restrictions"**
- Go to Google Cloud Console
- Check API key restrictions
- Enable required APIs

### **Error: "Firestore permission denied"**
- Check Firestore rules
- Ensure test mode is enabled initially

---

## ⚡ **Ready for Next Step?**

Once you complete the Firebase setup:

1. **Test authentication** - Create account and sign in
2. **Verify Firestore** - Check if user documents are created
3. **Move to Priority 3** - UserContext integration with real data

**Estimated setup time**: 15-20 minutes
**Result**: Fully functional authentication system with real Firebase backend! 🔥
