import React, { useState } from 'react';
import { Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import { auth, signInWithEmailAndPassword, isFirebaseAvailable } from '../firebase';
import Logo from './Logo';
import { BrandConfig } from '../types';

interface LoginScreenProps {
  brandConfig: BrandConfig;
  onLoginSuccess: (user: { uid: string; email: string; displayName?: string }) => void;
}

export default function LoginScreen({ brandConfig, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputEmail = email.toLowerCase().trim();
    const inputPassword = password;

    if (!inputEmail || !inputPassword) {
      setError("אנא מלא את כל השדות.");
      setLoading(false);
      return;
    }

    // Custom Firestore/Local credentials validation (Supports "1234" custom admin password)
    const targetEmail = (brandConfig.adminEmail || 'shey7048@gmail.com').toLowerCase().trim();
    const targetPassword = brandConfig.adminPassword || '1234';

    if (inputEmail === targetEmail && inputPassword === targetPassword) {
      setTimeout(() => {
        onLoginSuccess({
          uid: 'admin-uid',
          email: targetEmail,
          displayName: brandConfig.orgName || 'עולמות',
        });
        setLoading(false);
      }, 500);
      return;
    }

    // Fallback to Firebase Auth if they want to check another account (or if custom settings don't match)
    try {
      if (isFirebaseAvailable && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, inputEmail, inputPassword);
        onLoginSuccess({
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || undefined,
        });
      } else {
        setError("שגיאת התחברות: פרטי הגישה שהזנת אינם נכונים.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("שגיאת התחברות: פרטי הגישה שהזנת אינם נכונים.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("אימייל או סיסמה שגויים. אנא נסה שוב.");
      } else {
        setError("ארעה שגיאה בחיבור לשרת. אנא ודא שפרטי הגישה נכונים.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in" dir="rtl">
      <div className="sm:mx-auto w-full max-w-md text-center px-4">
        <div className="flex flex-col justify-center items-center gap-4 mb-4">
          <Logo brandConfig={brandConfig} className="h-24 w-24 shadow-xl shadow-blue-100/50 border border-slate-100 rounded-2xl" iconClassName="h-12 w-12" />
          <h1 className="text-3xl font-black tracking-tight text-slate-950 font-sans">
            {brandConfig.orgName || 'עולמות'}
          </h1>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-slate-700">
          פורטל הוצאות ודיווח פיננסי
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          כניסה מאובטחת לניהול ודיווח הוצאות
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100/80 rounded-3xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                כתובת דוא"ל (Email)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pr-10 pl-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm placeholder-slate-400 font-medium"
                  placeholder="name@example.com"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                סיסמה (Password)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pl-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm placeholder-slate-400 font-medium font-mono"
                  placeholder="••••••••"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-900 focus:ring-blue-800 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="mr-2 block text-xs font-semibold text-slate-700">
                  זכור אותי במכשיר זה
                </label>
              </div>
            </div>

            <div>
              <button
                id="submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 transition-all duration-150 shadow-blue-100"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "התחברות למערכת"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            מערכת ניהול הוצאות מורשת &bull; כל הפעולות מבוקרות ומאובטחות
          </p>
        </div>
      </div>
    </div>
  );
}
