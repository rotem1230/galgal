// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; // הוסף אם תשתמש ב-Storage

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDurtEehM5IrQxeJmKAIyaucKqDyEy4nl0",
  authDomain: "galbrother-1baff.firebaseapp.com",
  projectId: "galbrother-1baff",
  storageBucket: "galbrother-1baff.firebasestorage.app",
  messagingSenderId: "100731308038",
  appId: "1:100731308038:web:a005fd238a5d50d5bb5b87",
  measurementId: "G-1QL9EP8J5Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service (אם הוספת)
// export const storage = getStorage(app);

/**
 * הערה חשובה לגבי הרשאות משתמשים:
 * 
 * הגדרת משתמש כמנהל מערכת צריכה להתבצע דרך קונסולת הניהול של Firebase,
 * או דרך Cloud Functions שרצות בצד השרת עם הרשאות מתאימות.
 * 
 * אין להוסיף או לשנות הרשאות משתמשים דרך קוד קליינט-סייד בגלל 
 * סיכוני האבטחה הכרוכים בכך.
 * 
 * כדי להוסיף משתמש מנהל מערכת, בצע את הפעולות הבאות:
 * 1. היכנס לקונסולת Firebase: https://console.firebase.google.com
 * 2. בחר את הפרויקט galbrother
 * 3. עבור ל"Authentication" > "Users"
 * 4. למשתמש שברצונך להפוך למנהל, נווט ל-Firestore ויצור מסמך ב:
 *    - קולקציה: userRoles
 *    - מזהה מסמך: כתובת האימייל של המשתמש
 *    - תוכן: { role: "admin" }
 */

// פונקציה לבדיקה אם משתמש הוא מנהל
export const isUserAdmin = async (email) => {
  try {
    // בדיקה אם המייל הוא של מנהל ידוע מערכת (הרשאה קבועה בקוד)
    if (email === 'rotemhaha321@gmail.com') {
      console.log("זוהה משתמש מנהל קבוע במערכת:", email);
      return true;
    }

    // ניסיון קריאה ממסמך ההרשאות (אם יש הרשאות פיירבייס מתאימות)
    try {
      const userRoleRef = doc(db, "userRoles", email);
      const userRoleSnap = await getDoc(userRoleRef);
      
      if (userRoleSnap.exists()) {
        const isAdmin = userRoleSnap.data().role === "admin";
        console.log(`בדיקת הרשאות מסמך עבור ${email}: ${isAdmin ? 'מנהל' : 'לא מנהל'}`);
        return isAdmin;
      } else {
        console.log(`לא נמצא מסמך הרשאות עבור ${email}`);
      }
    } catch (error) {
      console.error("שגיאה בבדיקת הרשאות מול הדאטאבייס:", error);
      // אם זה המנהל הקבוע, כבר החזרנו true מקודם
    }
    
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export default app; 