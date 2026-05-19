import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyskQyHor8qVuP4OBY0DOzw0JbjUwkN74",
  authDomain: "ai-mock-interview-dd9da.firebaseapp.com",
  projectId: "ai-mock-interview-dd9da",
  storageBucket: "ai-mock-interview-dd9da.firebasestorage.app",
  messagingSenderId: "646743947506",
  appId: "1:646743947506:web:6a74cfcc1b9208be78f86b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;