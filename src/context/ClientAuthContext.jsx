import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,              
  browserSessionPersistence,   
  browserLocalPersistence      
} from "firebase/auth";
import { auth } from '../firebase-config'; // ייבוא אובייקט האימות מההגדרה המשותפת

const ClientAuthContext = createContext(null);

export const ClientAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password, rememberMe) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    // המאזין הזה יפעל ברגע שהמשתמש מתחבר/מתנתק ב-Firebase
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; // ניקוי בעת פירוק
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout
  };

  // לא נציג את האפליקציה עד שנדע אם המשתמש מחובר או לא
  return (
    <ClientAuthContext.Provider value={value}>
      {!loading && children}
    </ClientAuthContext.Provider>
  );
};

// Hook מותאם אישית לשימוש קל בקונטקסט
export const useClientAuth = () => {
  return useContext(ClientAuthContext);
}; 