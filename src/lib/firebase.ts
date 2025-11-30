import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDcwJQxiLYLvg7IoEWWWkyAy7vlK9wvCU",
  authDomain: "schmiedap.firebaseapp.com",
  projectId: "schmiedap",
  storageBucket: "schmiedap.firebasestorage.app",
  messagingSenderId: "838315921448",
  appId: "1:838315921448:web:2921bc107fbc64b26a651d",
  measurementId: "G-JBHDEB6VF0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
