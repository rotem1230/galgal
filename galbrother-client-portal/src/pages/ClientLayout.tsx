import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { 
  ShoppingCart, 
  Menu, 
  X, 
  LogOut, 
  Home, 
  FileText, 
  Clock, 
  Package 
} from 'lucide-react';

// פונקציית עזר עבור classNames מותנים
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const ClientLayout: React.FC = () => {
  const { logout, currentUser } = useClientAuth();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* כותרת למובייל */}
      <div className="lg:hidden bg-white border-b px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <button
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6fd839__-removebg-preview.png" 
          alt="האחים גל" 
          className="h-12 object-contain"
        />
        <Link 
          to="/client/cart" 
          className="relative p-2 rounded-md hover:bg-gray-100"
        > 
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-56px)] lg:min-h-screen">
        {/* סייד-בר לדסקטופ */}
        <div className="hidden lg:flex w-64 h-screen bg-white border-l shadow-sm flex-col overflow-hidden">
          <div className="p-6 flex items-center justify-center border-b flex-shrink-0">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6fd839__-removebg-preview.png" 
              alt="האחים גל" 
              className="w-40 h-40 object-contain"
            />
          </div>
          
          {currentUser && (
            <div className="p-4 border-b text-center">
              <div className="font-medium text-gray-800">שלום, {currentUser.email}</div>
              <div className="text-sm text-gray-500">פורטל לקוחות</div>
            </div>
          )}
          
          <nav className="p-4 space-y-2 flex-grow overflow-y-auto">
            <NavLink to="/client" icon={<Home />} label="ראשי" />
            <NavLink to="/client/new-order" icon={<FileText />} label="הזמנה חדשה" />
            <NavLink to="/client/history" icon={<Clock />} label="היסטוריית הזמנות" />
            <div className="relative">
              <NavLink to="/client/cart" icon={<ShoppingCart />} label="עגלת קניות" />
              {itemCount > 0 && (
                <span className="absolute left-4 top-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
          </nav>
          <div className="p-4 border-t flex-shrink-0">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>התנתק</span>
            </button>
          </div>
        </div>

        {/* תפריט מובייל */}
        <div 
          className={cn(
            "lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200",
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className={cn(
              "fixed inset-y-0 right-0 w-64 h-full bg-white shadow-xl transition-transform duration-200 transform flex flex-col overflow-hidden",
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b flex-shrink-0">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6fd839__-removebg-preview.png" 
                alt="האחים גל" 
                className="w-32 h-32 mx-auto object-contain"
              />
            </div>
            
            {currentUser && (
              <div className="p-4 border-b text-center">
                <div className="font-medium text-gray-800">שלום, {currentUser.email}</div>
                <div className="text-sm text-gray-500">פורטל לקוחות</div>
              </div>
            )}
            
            <nav className="p-4 space-y-2 flex-grow overflow-y-auto">
              <NavLink 
                to="/client" 
                icon={<Home />} 
                label="ראשי"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink 
                to="/client/new-order" 
                icon={<FileText />} 
                label="הזמנה חדשה"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink 
                to="/client/history" 
                icon={<Clock />} 
                label="היסטוריית הזמנות"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="relative">
                <NavLink 
                  to="/client/cart" 
                  icon={<ShoppingCart />} 
                  label="עגלת קניות"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                {itemCount > 0 && (
                  <span className="absolute left-4 top-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
            </nav>
            <div className="p-4 border-t flex-shrink-0">
              <button 
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>התנתק</span>
              </button>
            </div>
          </div>
        </div>

        {/* תוכן עיקרי */}
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="flex-1 p-6">
            <Outlet />
          </div>
          <footer className="py-4 px-6 bg-white border-t text-center text-sm text-gray-600">
            © {new Date().getFullYear()} האחים גל - כל הזכויות שמורות.
          </footer>
        </main>
      </div>
    </div>
  );
};

// קומפוננטת NavLink
function NavLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      {React.isValidElement(icon) ? React.cloneElement(icon, { className: "w-5 h-5" }) : icon}
      <span>{label}</span>
    </Link>
  );
}

export default ClientLayout; 