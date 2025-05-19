import React, { createContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth } from '../firebase-config';
import { db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // נשמור את המשתמש המחובר
  const [loading, setLoading] = useState(true); // מצב טעינה לבדיקת מצב אימות ראשוני
  const [isAdmin, setIsAdmin] = useState(false); // האם המשתמש הוא מנהל

  // פונקציה לבדיקה אם משתמש הוא מנהל
  const checkIfUserIsAdmin = async (email) => {
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
          const isUserAdmin = userRoleSnap.data().role === "admin";
          console.log(`בדיקת הרשאות ב-Firestore עבור ${email}: ${isUserAdmin ? 'מנהל' : 'לא מנהל'}`);
          return isUserAdmin;
        } else {
          console.log(`לא נמצא מסמך הרשאות ב-Firestore עבור ${email}`);
        }
      } catch (error) {
        console.error("שגיאה בבדיקת הרשאות מול הדאטאבייס:", error);
        // ממשיכים הלאה - אם זה מנהל קבוע, נחזיר true בכל מקרה
      }
      
      // אם הגענו לכאן והמשתמש לא מנהל קבוע ולא נמצא בדאטאבייס, נחזיר false
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  // פונקציית התחברות באמצעות Firebase עם טיפול ב-rememberMe
  const login = async (email, password, rememberMe) => {
    try {
      console.log(`ניסיון התחברות עם אימייל: ${email}`);
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log(`התחברות לפיירבייס הצליחה עבור: ${email}`);
      
      // בדיקה אם המשתמש הוא מנהל
      const admin = await checkIfUserIsAdmin(email);
      console.log(`תוצאת בדיקת מנהל עבור ${email}: ${admin}`);
      
      if (!admin) {
        // אם המשתמש אינו מנהל, התנתק ממנו וזרוק שגיאה
        console.error(`המשתמש ${email} אינו מנהל - מתנתק`);
        await signOut(auth);
        throw new Error("אין לך הרשאות גישה למערכת הניהול");
      }
      
      console.log(`התחברות מוצלחת למשתמש ${email} עם הרשאות מנהל`);
      return result;
    } catch (error) {
      console.error("שגיאה בהתחברות:", error);
      throw error;
    }
  };

  // פונקציית התנתקות באמצעות Firebase
  const logout = () => {
    return signOut(auth);
  };

  // בדיקת הרשאות המשתמש בעת שינוי מצב האימות
  const checkUserPermissions = async (user) => {
    if (user) {
      try {
        const admin = await checkIfUserIsAdmin(user.email);
        console.log(`עדכון סטטוס מנהל עבור ${user.email}: ${admin}`);
        setIsAdmin(admin);
        return admin;
      } catch (error) {
        console.error("Error checking user permissions:", error);
        setIsAdmin(false);
        return false;
      }
    } else {
      setIsAdmin(false);
      return false;
    }
  };

  // מאזין לשינויים במצב האימות
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        console.log(`נמצא משתמש מחובר: ${user.email}`);
        await checkUserPermissions(user);
      } else {
        console.log("אין משתמש מחובר");
        setIsAdmin(false);
      }
      
      setLoading(false); // סיום בדיקת מצב אימות ראשוני
    });

    // ניקוי המאזין בעת פירוק הקומפוננטה
    return unsubscribe;
  }, []);

  const value = {
    currentUser, // משתמש נוכחי (אובייקט מלא מ-Firebase או null)
    isAuthenticated: !!currentUser && isAdmin, // בוליאני - האם המשתמש מחובר והוא מנהל
    isAdmin, // האם המשתמש הוא מנהל
    login,
    logout
  };

  // לא נציג את האפליקציה עד שנדע את מצב האימות
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 