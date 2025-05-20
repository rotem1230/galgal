import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext.tsx'; // שינוי נתיב וסיומת

interface ClientProtectedRouteProps {
  children: ReactNode;
}

const ClientProtectedRoute: React.FC<ClientProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useClientAuth();

  if (!isAuthenticated) {
    // אם המשתמש לא מאומת, הפנה אותו לדף ההתחברות החדש
    return <Navigate to="/login-client" replace />;
  }

  // אם המשתמש מאומת, הצג את התוכן המוגן
  return <>{children}</>; // שימוש ב-Fragment
};

export default ClientProtectedRoute; 