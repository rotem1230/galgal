import React, { useContext } from 'react';
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

const PAGES = {
    Categories: Categories,
    Products: Products,
    BulkProductImport: BulkProductImport,
    Orders: Orders,
    Customers: Customers,
}

function _getCurrentPage(url) {
    if (!url || url === '/login') return '';
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

    if (location.pathname === '/login') {
        return <LoginPage />;
    }

    if (isAuthenticated) {
        const currentPageName = _getCurrentPage(location.pathname);
        console.log(`משתמש מאומת ומורשה, מציג עמוד: ${currentPageName}`);
        return (
            <Layout currentPageName={currentPageName}>
                <Routes>
                    <Route path="/" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                    <Route path="/Categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                    <Route path="/Products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                    <Route path="/BulkProductImport" element={<ProtectedRoute><BulkProductImport /></ProtectedRoute>} />
                    <Route path="/Orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/Customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                    <Route path="/ICountSettings" element={<ProtectedRoute><ICountSettings /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        );
    }

    console.log("משתמש לא מאומת, מפנה לעמוד התחברות");
    return <Navigate to="/login" state={{ from: location }} replace />;
}

export default function Pages() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}