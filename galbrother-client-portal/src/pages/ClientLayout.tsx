import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext.tsx'; // שינוי נתיב וסיומת
import { useCart } from '../context/CartContext.tsx'; // <-- ייבוא ה-Hook של העגלה
import { ShoppingCart } from 'lucide-react'; // <-- אייקון עגלת קניות

const ClientLayout: React.FC = () => {
  const { logout } = useClientAuth();
  const { getItemCount } = useCart(); // <-- קבלת פונקציית ספירת הפריטים
  const itemCount = getItemCount(); // חישוב מספר הפריטים

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">פורטל לקוחות</h1>
        <nav className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-2 hover:bg-blue-700 rounded">מוצרים</Link>
          <Link to="/new-order" className="px-3 py-2 hover:bg-blue-700 rounded">הזמנה חדשה</Link>
          <Link to="/history" className="px-3 py-2 hover:bg-blue-700 rounded">היסטוריית הזמנות</Link>
          
          {/* אייקון עגלת קניות ומספר פריטים */}
          <Link to="/cart" className="relative flex items-center px-3 py-2 hover:bg-blue-700 rounded"> {/* נוסיף בעתיד נתיב /cart */}
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          <button 
            onClick={logout}
            className="ml-4 px-3 py-2 bg-red-500 hover:bg-red-600 rounded"
          >
            התנתק
          </button>
        </nav>
      </header>
      <main className="flex-grow p-6 bg-gray-100">
        <Outlet /> {/* כאן יוצג תוכן העמוד הספציפי */}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        © {new Date().getFullYear()} Gal Brothers Ltd. כל הזכויות שמורות.
      </footer>
    </div>
  );
};

export default ClientLayout; 