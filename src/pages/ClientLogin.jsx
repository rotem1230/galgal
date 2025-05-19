import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext'; // שימוש בקונטקסט הלקוחות

// --- נצטרך להוסיף קומפוננטות UI בהמשך (Button, Input, Label, Card...) ---
// --- או להתקין ולהשתמש ב-shadcn/ui כמו בפרויקט הניהול ---

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useClientAuth(); // שימוש בפונקציית ההתחברות מהקונטקסט

  const from = location.state?.from?.pathname || "/"; // ניווט לדף הבית של הלקוח לאחר התחברות

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Client login error:", err);
      // הודעות שגיאה דומות לדף ההתחברות של המנהל
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('אימייל או סיסמה שגויים');
      } else if (err.code === 'auth/invalid-email') {
        setError('כתובת אימייל לא תקינה');
      } else {
        setError('אירעה שגיאה בעת ההתחברות. נסה שנית.');
      }
      setLoading(false);
    }
  };

  // --- עיצוב זמני - נשפר בהמשך כשנוסיף קומפוננטות UI --- 
  return (
    <div style={{ direction: 'rtl', padding: '2rem', maxWidth: '400px', margin: 'auto', marginTop: '5rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>כניסת לקוחות - האחים גל</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="email">אימייל</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div>
          <label htmlFor="password">סיסמה</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
          />
          <label htmlFor="remember-me">זכור אותי</label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'מתחבר...' : 'התחבר'}
        </button>
      </form>
    </div>
  );
} 