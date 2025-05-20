import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthContext } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("שגיאת התחברות:", err);
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('אימייל או סיסמה שגויים');
      } else if (err.code === 'auth/invalid-email') {
        setError('כתובת אימייל לא תקינה');
      } else if (err.message && err.message.includes('הרשאות')) {
        setError(err.message);
      } else {
        setError(`אירעה שגיאה בעת ההתחברות: ${err.message || 'נסה שנית'}`);
        console.error("פרטי שגיאת התחברות מלאים:", err);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-blue-600">
        <CardHeader className="text-center space-y-4">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6fd839__-removebg-preview.png" 
            alt="לוגו האחים גל" 
            className="w-64 h-64 mx-auto object-contain mb-4"
          />
          <CardTitle className="text-3xl font-bold text-gray-800">מערכת ניהול - האחים גל</CardTitle>
          <CardDescription className="text-gray-600">נא להזין פרטי התחברות</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={loading}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-medium leading-none cursor-pointer"
              >
                זכור אותי
              </Label>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                {error}
              </div>
            )}
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500 pt-4">
          © כל הזכויות שמורות לאחים גל | פותח ע"י רותם אנצל
        </CardFooter>
      </Card>
    </div>
  );
} 