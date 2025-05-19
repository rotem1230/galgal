import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext'; // שימוש בקונטקסט הלקוחות

const ClientProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useClientAuth(); // בדיקה מול קונטקסט הלקוחות
  const location = useLocation();

  if (!isAuthenticated) {
    // אם הלקוח לא מחובר, ננתב לדף ההתחברות של הלקוחות
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // אם הלקוח מחובר, נציג את התוכן המבוקש
  return children;
};

export default ClientProtectedRoute; 