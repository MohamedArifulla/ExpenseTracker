# Expense Tracker PWA with Firebase

## Setup Guide
1. Clone this repo
2. Create a Firebase project and enable:
   - Authentication (Email/Password + Google)
   - Firestore Database
   - Cloud Messaging (FCM)
3. Replace Firebase config in `firebase-init.js`
4. Deploy:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy