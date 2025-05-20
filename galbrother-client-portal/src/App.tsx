import React from 'react';
import { Routes, Route, Navigate, BrowserRouter as Router } from 'react-router-dom';
import { ClientAuthProvider } from './context/ClientAuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import ClientProtectedRoute from './components/ClientProtectedRoute.tsx';
import ClientLayout from './pages/ClientLayout.tsx';
import ClientLoginPage from './pages/ClientLoginPage.tsx';
import ClientProductsPage from './pages/ClientProductsPage.tsx';
import CartPage from './pages/CartPage.tsx';
import NewOrderPage from './pages/NewOrderPage.tsx';
import OrderHistoryPage from './pages/OrderHistoryPage.tsx';

// --- דפים זמניים אחרים (Placeholders) --- 
// const ClientProductsPage = () => <div><h2>מוצרים</h2><p>כאן יוצגו המוצרים.</p></div>; // הסרת ה-placeholder הישן
// const OrderHistoryPage = () => <div><h2>היסטוריית הזמנות</h2><p>כאן תוצג רשימת הזמנות קודמות.</p></div>; // הסרת ה-placeholder הישן
const NotFoundPage = () => <div><h2>404 - דף לא נמצא</h2></div>;

// בודק אם הקומפוננטה מיובאת מהאפליקציה הראשית
const isImportedFromMainApp = () => {
  try {
    return window.location.pathname.includes('/client') || 
           window.location.pathname.includes('/login-client');
  } catch (e) {
    return false;
  }
};

function ClientAppContent() {
  return (
    <ClientAuthProvider>
      <CartProvider>
        <Routes>
          {/* דפי התחברות - נתיב ציבורי */}
          <Route path="/login-client" element={<ClientLoginPage />} />

          {/* דפים פנימיים עם תחילית /client */}
          <Route 
            path="/client" 
            element={
              <ClientProtectedRoute>
                <ClientLayout />
              </ClientProtectedRoute>
            }
          >
            {/* נתיב ברירת המחדל לעמוד המוצרים */}
            <Route index element={<ClientProductsPage />} />
            {/* נתיבים ספציפיים */}
            <Route path="cart" element={<CartPage />} />
            <Route path="new-order" element={<NewOrderPage />} />
            <Route path="history" element={<OrderHistoryPage />} />
          </Route>

          {/* נתיבים לגישה ישירה (תמיכה אחורה) */}
          <Route path="/cart" element={<Navigate to="/client/cart" replace />} />
          <Route path="/new-order" element={<Navigate to="/client/new-order" replace />} />
          <Route path="/history" element={<Navigate to="/client/history" replace />} />

          {/* נתיב לטיפול בדפים שלא נמצאו */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </ClientAuthProvider>
  );
}

function App() {
  // כאשר מיובא מהאפליקציה הראשית, החזר רק את התוכן בלי Router נוסף
  if (isImportedFromMainApp()) {
    return <ClientAppContent />;
  }
  
  // כאשר מופעל כאפליקציה עצמאית, הוסף Router
  return (
    <Router>
      <ClientAppContent />
    </Router>
  );
}

export default App; 