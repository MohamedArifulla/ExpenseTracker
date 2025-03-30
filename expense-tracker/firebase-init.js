import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging.js";


const firebaseConfig = {
  apiKey: "AIzaSyDV6gAAvYZIpkTHbSeXlza_6LSdilSIkEQ",
  authDomain: "expensetracker-d6889.firebaseapp.com",
  projectId: "expensetracker-d6889",
  storageBucket: "expensetracker-d6889.firebasestorage.app",
  messagingSenderId: "650170915367",
  appId: "1:650170915367:web:b52e1b71204a8b7389cc02",
  measurementId: "G-QQ2MKYFH3N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Enable Firestore offline support
enableIndexedDbPersistence(db).catch((err) => {
  console.error("Offline support failed: ", err);
});

// Initialize service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered');
    });
}


export {
  auth, db, messaging, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, query, where, collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  getToken,
  onMessage
};