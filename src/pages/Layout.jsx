import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, Archive, FileText, Users, Menu, X, LogOut, Upload, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthContext } from "@/context/AuthContext";

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // מניעת pull-to-refresh בלבד, ללא פגיעה בגלילה רגילה
  React.useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const y = e.touches[0].clientY;
      const isScrollingUp = y > startY;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

      // מונע רק את הריענון בגלילה למעלה כשנמצאים בראש הדף
      if (isScrollingUp && scrollTop <= 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // הניווט לדף ההתחברות יקרה אוטומטית בזכות ה-ProtectedRoute
      // navigate('/login'); // אפשר להוסיף אם רוצים ניתוב ידני מיידי
    } catch (error) {
      console.error("Failed to log out:", error);
      // ניתן להוסיף הודעת שגיאה למשתמש
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6fd839__-removebg-preview.png" 
          alt="האחים גל" 
          className="h-12 object-contain"
        />
      </div>

      <div className="flex min-h-[calc(100vh-56px)] lg:min-h-screen">
        {/* Sidebar for Desktop */}
        <div className="hidden lg:flex w-64 h-screen bg-white border-l shadow-sm flex-col overflow-hidden">
          <div className="p-6 flex items-center justify-center border-b flex-shrink-0">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6fd839__-removebg-preview.png" 
              alt="האחים גל" 
              className="w-40 h-40 object-contain"
            />
          </div>
          <nav className="p-4 space-y-2 flex-grow overflow-y-auto">
            <NavLink to="Categories" icon={<Archive />} label="קטגוריות" />
            <NavLink to="Products" icon={<Package />} label="מוצרים" />
            <NavLink to="BulkProductImport" icon={<Upload />} label="העלאת מוצרים מתמונות" />
            <NavLink to="Orders" icon={<FileText />} label="הזמנות" />
            <NavLink to="Customers" icon={<Users />} label="לקוחות" />
            <NavLink to="ICountSettings" icon={<Settings />} label="הגדרות iCount" />
          </nav>
          <div className="p-4 border-t flex-shrink-0">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 ml-3" />
              <span>התנתק</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
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
            <nav className="p-4 space-y-2 flex-grow overflow-y-auto">
              <NavLink 
                to="Categories" 
                icon={<Archive />} 
                label="קטגוריות"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink 
                to="Products" 
                icon={<Package />} 
                label="מוצרים"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink 
                to="BulkProductImport" 
                icon={<Upload />} 
                label="העלאת מוצרים מתמונות"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink 
                to="Orders" 
                icon={<FileText />} 
                label="הזמנות"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink 
                to="Customers" 
                icon={<Users />} 
                label="לקוחות"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink 
                to="ICountSettings" 
                icon={<Settings />} 
                label="הגדרות iCount"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </nav>
            <div className="p-4 border-t flex-shrink-0">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-5 h-5 ml-3" />
                  <span>התנתק</span>
                </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className="py-4 px-6 bg-white border-t text-center text-sm text-gray-600">
            מערכת זו פותחה ע"י רותם אנצל, נייד: 054-542-9681
          </footer>
        </main>
      </div>
    </div>
  );
}

// NavLink Component
function NavLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={createPageUrl(to)}
      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      {React.cloneElement(icon, { className: "w-5 h-5" })}
      <span>{label}</span>
    </Link>
  );
}
