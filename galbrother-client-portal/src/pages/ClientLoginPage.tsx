import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useClientAuth } from '../context/ClientAuthContext.tsx'; // לא נשתמש ב-login מכאן יותר
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase-config'; // ודא שהנתיב נכון

const ClientLoginPage: React.FC = () => {
  const [email, setEmail] = useState(''); // שינוי מ-username ל-email
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // הוספת מצב טעינה לכפתור
  // const { login } = useClientAuth(); // לא נחוץ כאן
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // אין צורך בבדיקה ידנית, Firebase יעשה זאת
    // if (email.trim() === '' || password.trim() === '') { ... }

    try {
      console.log(`Attempting login with email: ${email}`);
      await signInWithEmailAndPassword(auth, email, password);
      // ההפניה צריכה להיות לפורטל הלקוחות
      navigate('/client'); // <-- שינוי מ-'/' ל-'/client'
      console.log('Login successful, navigating to client portal...');
    } catch (err: any) { // שים לב לטיפול בשגיאות
      console.error("Login failed:", err.code, err.message);
      // תרגום הודעות שגיאה נפוצות לעברית
      let errorMessage = 'אירעה שגיאה בתהליך ההתחברות.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'אימייל או סיסמה שגויים.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'כתובת אימייל אינה תקינה.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // סיים טעינה בכל מקרה
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4" dir="rtl">
      <div className="bg-white p-8 rounded-lg shadow-lg border border-blue-500 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="לוגו Gal Brothers" className="h-14 w-auto" />
        </div>

        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">פורטל לקוחות - האחים גל</h2>
            <p className="text-gray-600 mt-1">נא להזין פרטי התחברות</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" htmlFor="email">
              אימייל
            </label>
            <input
              className="appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right transition duration-150 ease-in-out"
              id="email"
              type="email"
              required
              placeholder="הכנס כתובת אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" htmlFor="password">
              סיסמה
            </label>
            <input
              className="appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right transition duration-150 ease-in-out"
              id="password"
              type="password"
              required
              placeholder="הכנס סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end">
             <div className="flex items-center">
               <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2" />
               <label htmlFor="remember-me" className="text-sm text-gray-700">
                 זכור אותי בכניסה הבאה
               </label>
             </div>
           </div>
          
          {error && <p className="text-red-600 text-sm text-center font-medium">{error}</p>}
          
          <div>
            <button
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed" // הוספת עיצוב ל-disabled
              type="submit"
              disabled={loading} // מניעת לחיצות כפולות בזמן טעינה
            >
              {loading ? 'מתחבר...' : 'התחבר'} {/* שינוי טקסט הכפתור בזמן טעינה */}
            </button>
          </div>
        </form>
        
        <footer className="text-center text-xs text-gray-500 mt-8">
          © {new Date().getFullYear()} כל הזכויות שמורות לאחים גל | פותח ע"י רותם אנגל
        </footer>
      </div>
    </div>
  );
};

export default ClientLoginPage; 