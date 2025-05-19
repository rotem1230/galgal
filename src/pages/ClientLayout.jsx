import React from 'react';
import { Outlet, Link } from 'react-router-dom'; // Outlet ישמש להצגת התוכן של הראוט הפנימי
import { useClientAuth } from '../context/ClientAuthContext';

// --- שוב, נצטרך קומפוננטת Button או עיצוב בסיסי --- 

const ClientLayout = () => {
  const { logout, currentUser } = useClientAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // הניתוב לדף ההתחברות יקרה אוטומטית
    } catch (error) {
      console.error("Client logout failed:", error);
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <header style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/" style={{ textDecoration: 'none', color: 'black', fontWeight: 'bold' }}>פורטל לקוחות - האחים גל</Link>
          {/* אפשר להוסיף כאן קישורי ניווט נוספים בהמשך */} 
          <Link to="/new-order" style={{ marginRight: '1rem' }}>הזמנה חדשה</Link>
          <Link to="/history" style={{ marginRight: '1rem' }}>היסטוריית הזמנות</Link>
        </div>
        <div>
          {currentUser && (
            <span style={{ marginLeft: '1rem' }}>שלום, {currentUser.email}</span>
          )}
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            התנתק
          </button>
        </div>
      </header>
      <main style={{ padding: '1rem' }}>
        <Outlet /> {/* כאן יוצג התוכן של הדף הפנימי (למשל, היסטוריית הזמנות) */}
      </main>
    </div>
  );
};

export default ClientLayout; 