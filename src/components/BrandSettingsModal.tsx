import React, { useState } from 'react';
import { X, Lock, Check, RefreshCw } from 'lucide-react';
import { BrandConfig } from '../types';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  onSave: (config: BrandConfig) => void;
}

export default function BrandSettingsModal({ isOpen, onClose, brandConfig, onSave }: BrandSettingsModalProps) {
  const [adminPassword, setAdminPassword] = useState(brandConfig.adminPassword || '1234');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave({
        ...brandConfig,
        adminPassword: adminPassword.trim() || '1234'
      });
      setSaving(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Content Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden transform transition-all p-6 z-10">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-900" />
              שינוי סיסמת מנהל
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              עדכן את סיסמת הגישה לממשק הניהול של שי עולמות
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-colors mr-auto ml-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              סיסמת מנהל חדשה
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm font-mono"
                placeholder="1234"
                style={{ direction: 'ltr' }}
              />
            </div>
          </div>

          <p className="text-[11px] text-blue-900/80 font-medium leading-normal bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
            הסיסמה החדשה תישמר באופן מאובטח בשרת ותשמש אותך בכניסות הבאות מכל מכשיר.
          </p>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
            >
              ביטול
            </button>
            <button
              id="save-settings-btn"
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 transition-all flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>עדכן סיסמה</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
