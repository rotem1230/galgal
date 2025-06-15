import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase-config';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isCustomer, setIsCustomer] = useState(false);
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      // אם זה המשתמש המיוחד שלנו, לא צריך לבדוק אם הוא לקוח
      if (currentUser.email === 'rotemhaha321@gmail.com' || currentUser.email === 'kfirgal505@gmail.com') {
        console.log(`זיהינו את המשתמש המיוחד ${currentUser.email} - מאפשר גישה`);
        setIsCustomer(false);
        setLoading(false);
        return;
      }
      
      try {
        // בדיקה אם המשתמש הוא לקוח על ידי חיפוש ב-UID שלו בקולקציית הלקוחות
        const customersRef = collection(db, "customers");
        const q = query(customersRef, where("authUid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        // אם נמצאו תוצאות, המשתמש הוא לקוח ולא צריך לאפשר לו גישה לפורטל הניהול
        const isUserCustomer = !querySnapshot.empty;
        console.log(`בדיקת לקוח עבור ${currentUser.email}: ${isUserCustomer ? 'לקוח' : 'לא לקוח'}`);
        setIsCustomer(isUserCustomer);
        setLoading(false);
      } catch (error) {
        console.error("Error checking user role:", error);
        setLoading(false);
      }
    };

    checkUserRole();
  }, [currentUser]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">טוען...</div>;
  }

  if (!isAuthenticated) {
    // אם המשתמש לא מחובר, ננתב אותו לדף ההתחברות
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isCustomer) {
    // אם המשתמש הוא לקוח, נציג דף שגיאה במקום כל תוכן האפליקציה
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-red-50 p-4" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-red-500 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">גישה נדחתה</h2>
          <p className="mb-6">למשתמשי לקוחות אין גישה לפורטל הניהול.</p>
          <p className="text-sm text-gray-600 mb-4">נא להתחבר עם חשבון מנהל.</p>
          <button 
            onClick={() => {
              // התנתק ונווט לדף התחברות
              import('@/context/AuthContext').then(mod => {
                const { AuthContext } = mod;
                const { logout } = useContext(AuthContext);
                if (logout) {
                  logout().then(() => {
                    window.location.href = '/login';
                  });
                } else {
                  window.location.href = '/login';
                }
              }).catch(() => {
                window.location.href = '/login';
              });
            }} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            חזרה לדף התחברות
          </button>
        </div>
      </div>
    );
  }

  // אם המשתמש מחובר ואינו לקוח, נציג את הקומפוננטה המבוקשת
  return children;
};

export default ProtectedRoute; 