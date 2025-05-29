// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; // הוסף אם תשתמש ב-Storage

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDurtEehM5IrQxeJmKAIyaucKqDyEy4nl0",
  authDomain: "galbrother-1baff.firebaseapp.com",
  projectId: "galbrother-1baff",
  storageBucket: "galbrother-1baff.appspot.com",
  messagingSenderId: "100731308038",
  appId: "1:100731308038:web:a005fd238a5d50d5bb5b87",
  measurementId: "G-1QL9EP8J5Y"
};

// בדיקה אם כבר קיימת אפליקציית Firebase מאותחלת - אם כן, נשתמש בה במקום לאתחל מחדש
let app;
try {
  if (getApps().length) {
    // אם כבר קיימת אפליקציה, נשתמש בה
    app = getApp();
    console.log("Firebase: שימוש באפליקציה קיימת");
  } else {
    // אם לא קיימת אפליקציה, נאתחל חדשה
    app = initializeApp(firebaseConfig);
    console.log("Firebase: אתחול אפליקציה חדשה");
  }
} catch (error) {
  console.error("שגיאה באתחול Firebase:", error);
  // אתחול עם שם אחר במקרה של שגיאה
  app = initializeApp(firebaseConfig, "client-portal");
  console.log("Firebase: אתחול עם שם חלופי 'client-portal'");
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service (אם הוספת)
// export const storage = getStorage(app);

export default app; 