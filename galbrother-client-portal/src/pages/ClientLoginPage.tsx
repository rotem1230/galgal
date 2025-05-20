import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useClientAuth } from '../context/ClientAuthContext.tsx'; // לא נשתמש ב-login מכאן יותר
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase-config'; // ודא שהנתיב נכון

const ClientLoginPage: React.FC = () => {
  const [email, setEmail] = useState(''); // שינוי מ-username ל-email
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4" dir="rtl">
      <div className="w-full max-w-md shadow-2xl border-t-4 border-blue-600 bg-white rounded-lg overflow-hidden">
        <div className="text-center space-y-4 p-6 bg-white">
          <div className="mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6fd839__-removebg-preview.png" 
              alt="לוגו האחים גל" 
              className="w-64 h-64 mx-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">פורטל לקוחות - האחים גל</h2>
          <p className="text-gray-600">נא להזין פרטי התחברות</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                כתובת אימייל
              </label>
              <input
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md shadow-sm text-right"
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                סיסמה
              </label>
              <input
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md shadow-sm text-right"
                id="password"
                type="password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label 
                htmlFor="remember-me" 
                className="text-sm font-medium leading-none cursor-pointer"
              >
                זכור אותי
              </label>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
        </div>
        
        <div className="text-center text-sm text-gray-500 pt-4 pb-6 border-t">
          © כל הזכויות שמורות לאחים גל | פותח ע"י רותם אנגל
        </div>
      </div>
    </div>
  );
};

export default ClientLoginPage; 