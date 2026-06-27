import { LogOut, User, Sparkles, AlertCircle, Settings } from 'lucide-react';
import { isFirebaseAvailable } from '../firebase';
import Logo from './Logo';
import { BrandConfig } from '../types';

interface NavbarProps {
  user: { email: string; displayName?: string };
  brandConfig: BrandConfig;
  onEditBrand: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, brandConfig, onEditBrand, onLogout }: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm shadow-slate-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <Logo brandConfig={brandConfig} className="h-10 w-10" iconClassName="h-6 w-6" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                {brandConfig.orgName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Shai Olamot Expense Management</p>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">
                {user.displayName || user.email.split('@')[0]}
              </span>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                <User className="h-3 w-3" />
                <span>Administrator</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Brand Settings Trigger */}
              <button
                onClick={onEditBrand}
                title="הגדרות מיתוג ולוגו"
                className="p-2 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 rounded-xl transition-all duration-150"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Dev mode / Firebase status indicator */}
              <span 
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md hidden md:inline-flex items-center gap-1 ${
                  isFirebaseAvailable 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}
                title={isFirebaseAvailable ? "Connected to live Firebase Firestore" : "Using offline-ready Local Storage fallback"}
              >
                {!isFirebaseAvailable && <AlertCircle className="h-3 w-3" />}
                {isFirebaseAvailable ? 'Cloud Sync Live' : 'Sandbox (Offline)'}
              </span>

              <button
                id="logout-btn"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-sm font-medium transition-all duration-150"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
