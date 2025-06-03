import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../../firebase-config'; // ודא שהנתיב נכון

// הגדרת טיפוסים (ניתן להרחיב בהמשך)
interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean; // נוסף כדי לדעת מתי האימות נטען
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

// יצירת הקונטקסט עם ערך ברירת מחדל
const AuthContext = createContext<AuthContextType | null>(null);

// יצירת ה-Provider
interface ClientAuthProviderProps {
  children: ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // מתחיל כ-true עד שנקבל תשובה מ-Firebase

  useEffect(() => {
    // הפונקציה הזו מאזינה לשינויים במצב האימות
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // סיימנו לטעון את מצב האימות
      console.log('Auth state changed:', user);
    });

    // ניתוק ההאזנה כשהקומפוננטה יורדת
    return unsubscribe;
  }, []);

  // בדיקה אם המשתמש בפורטל הלקוחות ולא בפורטל הניהול
  useEffect(() => {
    const checkPathAndRedirect = () => {
      const isClientPath = window.location.pathname.startsWith('/client') || 
                           window.location.pathname === '/login-client';
      
      // אם המשתמש לא מחובר והוא בנתיב של הלקוחות, נפנה אותו לדף ההתחברות של הלקוחות
      if (currentUser === null && !loading && isClientPath && 
          window.location.pathname !== '/login-client') {
        window.location.href = '/login-client';
      }
    };

    checkPathAndRedirect();
  }, [currentUser, loading]);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      console.log(`ניסיון התחברות עם אימייל: ${email}, זכור אותי: ${rememberMe}`);
      
      // קביעת סוג ה-persistence לפי בחירת המשתמש
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      console.log(`נקבע persistence: ${rememberMe ? 'local' : 'session'}`);
      
      await signInWithEmailAndPassword(auth, email, password);
      console.log('התחברות הצליחה');
    } catch (error) {
      console.error('שגיאה בהתחברות:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log("התנתקות הצליחה");
      // המצב ישתנה אוטומטית בזכות onAuthStateChanged
      
      // ניתוב ידני לדף ההתחברות של הלקוחות
      window.location.href = '/login-client';
    } catch (error) {
      console.error("שגיאה בהתנתקות:", error);
      throw error;
    }
  };

  const isAuthenticated = !loading && currentUser !== null;

  // בזמן הטעינה, אפשר להציג מסך טעינה או כלום
  if (loading) {
    return <div className="flex justify-center items-center p-8 min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <span className="mr-3">טוען אימות...</span>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook לשימוש בקונטקסט
export const useClientAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}; 