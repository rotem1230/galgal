import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App(): JSX.Element {
  return (
    <ClientAuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* דף התחברות - נתיב ציבורי */}
            <Route path="/login" element={<ClientLoginPage />} />

            {/* דפים פנימיים - מוגנים ומשתמשים ב-ClientLayout */}
            <Route 
              path="/" 
              element={
                <ClientProtectedRoute>
                  <ClientLayout />
                </ClientProtectedRoute>
              }
            >
              {/* נתיב ברירת המחדל משתמש בקומפוננטה החדשה */}
              <Route index element={<ClientProductsPage />} /> 
              {/* נתיבים ספציפיים */}
              <Route path="cart" element={<CartPage />} />
              <Route path="new-order" element={<NewOrderPage />} />
              <Route path="history" element={<OrderHistoryPage />} />
            </Route>

            {/* נתיב לטיפול בדפים שלא נמצאו */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </CartProvider>
    </ClientAuthProvider>
  );
}

export default App; 