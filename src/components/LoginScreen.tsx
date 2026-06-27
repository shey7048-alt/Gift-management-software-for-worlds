import React, { useState } from 'react';
import { Building, Lock, Mail, Sparkles, Loader2, UserCheck } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, isFirebaseAvailable } from '../firebase';

interface LoginScreenProps {
  onLoginSuccess: (user: { uid: string; email: string; displayName?: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      if (isFirebaseAvailable && auth) {
        if (isRegistering) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (name) {
            await updateProfile(userCredential.user, { displayName: name });
          }
          onLoginSuccess({
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            displayName: name || userCredential.user.displayName || undefined,
          });
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          onLoginSuccess({
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            displayName: userCredential.user.displayName || undefined,
          });
        }
      } else {
        // Fallback demo authentication if Firebase is unavailable or offline
        console.warn("Using demo authentication fallback.");
        setTimeout(() => {
          onLoginSuccess({
            uid: 'demo-admin-uid',
            email: email,
            displayName: name || 'Demo Administrator',
          });
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      let message = "Authentication failed. Please check your credentials.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = "Incorrect email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password must be at least 6 characters long.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        uid: 'demo-admin-uid',
        email: 'admin@shaiolamot.org',
        displayName: 'Demo Administrator',
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md shadow-emerald-200">
            <Building className="h-8 w-8" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800">שי אולמות</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Shai Olamot Expense Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Secure Administrative Login & Expense Reporting
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 rounded-3xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-sm flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-slate-400"
                    placeholder="Israel Israeli"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-slate-400"
                  placeholder="admin@shaiolamot.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Keep me secure
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                  }}
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  {isRegistering ? "Back to Login" : "Create Admin Account"}
                </button>
              </div>
            </div>

            <div>
              <button
                id="submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-150"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : isRegistering ? (
                  "Register Administrator"
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-y-0 flex items-center w-full">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-500 uppercase font-semibold tracking-wider">
                  Test Sandbox Bypass
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-150"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Demo Admin Login (Instant Access)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Organization: Shai Olamot Expenses &bull; All sessions are audited
          </p>
        </div>
      </div>
    </div>
  );
}
