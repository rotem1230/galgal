import React, { useContext, lazy, Suspense } from 'react';
import Layout from "./Layout.jsx";
import Categories from "./Categories";
import Products from "./Products";
import Orders from "./Orders";
import Customers from "./Customers";
import BulkProductImport from "./BulkProductImport";
import LoginPage from "./Login";
import ICountSettings from "./ICountSettings";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthContext } from "@/context/AuthContext";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

// עטיפה לרכיבי פורטל הלקוחות
// אנחנו משתמשים ב-lazy loading כדי לייבא את הקומפוננטות מהפרויקט השני רק כשצריך
const ClientApp = lazy(() => import('../../galbrother-client-portal/src/App'));

const PAGES = {
    Categories: Categories,
    Products: Products,
    BulkProductImport: BulkProductImport,
    Orders: Orders,
    Customers: Customers,
}

function _getCurrentPage(url) {
    if (!url || url === '/login-admin' || url === '/admin/login' || url === '/login') return '';
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Categories';
}

function AppContent() {
    const { isAuthenticated, currentUser } = useContext(AuthContext);
    const location = useLocation();

    console.log(`AppContent - מצב אימות: ${isAuthenticated ? 'מחובר' : 'לא מחובר'}`);
    if (currentUser) {
        console.log(`משתמש נוכחי: ${currentUser.email}`);
    }

    // דף הבחירה בין הפורטלים
    if (location.pathname === '/') {
        return <Navigate to="/launcher.html" replace />;
    }

    // ניתובים לפורטל הלקוחות
    if (location.pathname.startsWith('/login-client') || 
        location.pathname.startsWith('/client')) {
        return (
            <Suspense fallback={<div>טוען פורטל לקוחות...</div>}>
                <ClientApp />
            </Suspense>
        );
    }

    // דף התחברות לפורטל ניהול
    if (location.pathname === '/login-admin' || location.pathname === '/admin/login' || location.pathname === '/login') {
        return <LoginPage />;
    }

    if (isAuthenticated) {
        const currentPageName = _getCurrentPage(location.pathname);
        console.log(`משתמש מאומת ומורשה, מציג עמוד: ${currentPageName}`);
        return (
            <Layout currentPageName={currentPageName}>
                <Routes>
                    <Route path="/admin" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                    <Route path="/admin/Categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                    <Route path="/admin/Products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                    <Route path="/admin/BulkProductImport" element={<ProtectedRoute><BulkProductImport /></ProtectedRoute>} />
                    <Route path="/admin/Orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/admin/Customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                    <Route path="/admin/ICountSettings" element={<ProtectedRoute><ICountSettings /></ProtectedRoute>} />
                    
                    <Route path="/Categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                    <Route path="/Products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                    <Route path="/BulkProductImport" element={<ProtectedRoute><BulkProductImport /></ProtectedRoute>} />
                    <Route path="/Orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/Customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                    <Route path="/ICountSettings" element={<ProtectedRoute><ICountSettings /></ProtectedRoute>} />
                    
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </Layout>
        );
    }

    console.log("משתמש לא מאומת, מפנה לעמוד התחברות");
    // אם הנתיב מתחיל ב /admin, נפנה לעמוד התחברות של הניהול
    if (location.pathname.startsWith('/admin')) {
        return <Navigate to="/login-admin" state={{ from: location }} replace />;
    }
    
    return <Navigate to="/login-admin" state={{ from: location }} replace />;
}

export default function Pages() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}