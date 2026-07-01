import React, { useState } from 'react';
import { Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, isFirebaseAvailable } from '../firebase';
import Logo from './Logo';
import { BrandConfig } from '../types';

interface LoginScreenProps {
  brandConfig: BrandConfig;
  onLoginSuccess: (user: { uid: string; email: string; displayName?: string }) => void;
}

export default function LoginScreen({ brandConfig, onLoginSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputPassword = password;

    if (!inputPassword) {
      setError("אנא הזן סיסמה.");
      setLoading(false);
      return;
    }

    // Custom Firestore/Local credentials validation (Supports custom admin password)
    const targetEmail = (brandConfig.adminEmail || 'shey7048@gmail.com').toLowerCase().trim();
    const targetPassword = brandConfig.adminPassword || '1234';

    if (inputPassword === targetPassword) {
      if (isFirebaseAvailable && auth) {
        try {
          // Attempt to authenticate the custom admin in Firebase Auth as well
          let userCredential = null;
          try {
            userCredential = await signInWithEmailAndPassword(auth, targetEmail, inputPassword);
          } catch (signInErr: any) {
            // If the user doesn't exist in Firebase Auth yet, auto-create it
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
              try {
                userCredential = await createUserWithEmailAndPassword(auth, targetEmail, inputPassword);
              } catch (createErr) {
                console.warn("Could not auto-create Firebase Auth user:", createErr);
              }
            } else {
              console.warn("Could not sign in Firebase Auth user:", signInErr);
            }
          }

          onLoginSuccess({
            uid: userCredential?.user.uid || 'admin-uid',
            email: targetEmail,
            displayName: brandConfig.orgName || 'שי עולמות',
          });
          setLoading(false);
          return;
        } catch (fbErr) {
          console.error("Firebase Auth fallback error:", fbErr);
        }
      }

      // Offline/Fallback login success
      onLoginSuccess({
        uid: 'admin-uid',
        email: targetEmail,
        displayName: brandConfig.orgName || 'שי עולמות',
      });
      setLoading(false);
      return;
    }

    // Fallback to Firebase Auth using pre-configured admin email
    try {
      if (isFirebaseAvailable && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, targetEmail, inputPassword);
        onLoginSuccess({
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || undefined,
        });
      } else {
        setError("הסיסמה שהזנת אינה נכונה. אנא נסה שוב.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("הסיסמה שהזנת אינה נכונה. אנא נסה שוב.");
      } else {
        setError("אירעה שגיאה בחיבור לשרת או שהסיסמה שגויה. אנא נסה שוב.");
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
            {brandConfig.orgName || 'שי עולמות'}
          </h1>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-slate-700">
          פורטל הוצאות ודיווח פיננסי
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          כניסה מאובטחת באמצעות סיסמה
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
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                סיסמת גישה למערכת (Password)
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
                  placeholder="הזן סיסמת מנהל"
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
            מערכת ניהול הוצאות רשמית ומאובטחת &bull; כל הפעולות מבוקרות
          </p>
        </div>
      </div>
    </div>
  );
}
