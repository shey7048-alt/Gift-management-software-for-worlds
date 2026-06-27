import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';

// Shai Olamot Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBe2xfDZixsKvQu-ESpxgxo-8bDjdfBosw",
  authDomain: "plasma-channel-d8gvj.firebaseapp.com",
  projectId: "plasma-channel-d8gvj",
  storageBucket: "plasma-channel-d8gvj.firebasestorage.app",
  messagingSenderId: "125368924234",
  appId: "1:125368924234:web:aebac646fea75e7e18ceb3"
};

let app;
let auth: any = null;
let db: any = null;
let isFirebaseAvailable = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  // Initialize firestore with custom database ID from config
  const customDbId = "ai-studio-shaiolamotexpens-40d1395e-e831-4d9c-8611-0ba0bc9476fb";
  db = getFirestore(app, customDbId);
  isFirebaseAvailable = true;
  console.log("Firebase initialized successfully with database:", customDbId);
} catch (error) {
  console.error("Firebase failed to initialize, falling back to local storage:", error);
}

export { 
  app, 
  auth, 
  db, 
  isFirebaseAvailable,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where
};
