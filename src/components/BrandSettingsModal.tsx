import React, { useState } from 'react';
import { X, Sparkles, Image, Check, RefreshCw, Mail, Lock } from 'lucide-react';
import { BrandConfig } from '../types';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  onSave: (config: BrandConfig) => void;
}

const PRESET_LOGOS = [
  {
    name: 'לוגו שי עולמות',
    url: 'https://raw.githubusercontent.com/shey3132/-22/refs/heads/main/%D7%9C%D7%95%D7%92%D7%95%20%D7%A9%D7%99%20%D7%A2%D7%95%D7%9C%D7%9E%D7%95%D7%AA.png',
    desc: 'הלוגו הרשמי של שי עולמות'
  },
  {
    name: 'זהב מלכותי',
    url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&fit=crop&q=80',
    desc: 'לוגו סגנון זהב קלאסי'
  },
  {
    name: 'אינדיגו יוקרתי',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=128&fit=crop&q=80',
    desc: 'חותם מודרני בצבע כחול-כהה'
  }
];

export default function BrandSettingsModal({ isOpen, onClose, brandConfig, onSave }: BrandSettingsModalProps) {
  const [logoUrl, setLogoUrl] = useState(brandConfig.logoUrl || '');
  const [orgName, setOrgName] = useState(brandConfig.orgName || 'שי עולמות');
  const [adminEmail, setAdminEmail] = useState(brandConfig.adminEmail || 'shey7048@gmail.com');
  const [adminPassword, setAdminPassword] = useState(brandConfig.adminPassword || '1234');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave({
        logoUrl: logoUrl.trim() || undefined,
        orgName: orgName.trim() || 'שי עולמות',
        adminEmail: adminEmail.trim() || 'shey7048@gmail.com',
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
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden transform transition-all p-6 z-10">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              הגדרות מערכת ומיתוג
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              עדכן את שם המותג, לוגו הכניסה ופרטי גישת המנהל (מסתנכרן ישירות מול השרת)
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
              שם הארגון / המוסד
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm font-semibold"
              placeholder="שי עולמות"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              קישור לתמונת הלוגו (Logo URL)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Image className="h-4 w-4" />
              </div>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm text-slate-600 font-mono text-xs"
                placeholder="https://example.com/logo.png"
                style={{ direction: 'ltr' }}
              />
            </div>
          </div>

          {/* Quick Preset Options */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 mb-2">
              בחירה מהירה מתוך לוגואים מוכנים:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_LOGOS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setLogoUrl(preset.url)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    logoUrl === preset.url
                      ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="h-8 w-8 object-cover rounded-lg mb-1 mx-auto"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[10px] font-bold text-slate-700 truncate">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Credentials Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-blue-900" />
              פרטי התחברות של מנהל (Email & Password)
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  כתובת מייל מנהל
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pr-8 pl-2 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-mono"
                    placeholder="email@example.com"
                    style={{ direction: 'ltr' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  סיסמת מנהל חדשה
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pr-8 pl-2 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-mono"
                    placeholder="1234"
                    style={{ direction: 'ltr' }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-amber-600 font-semibold leading-normal">
              שינוי פרטים אלו יעדכן מיד את הגישה בשרת ובכל המכשירים של שי עולמות.
            </p>
          </div>

          {/* Logo Live Preview */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80 flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Live Preview"
                  className="h-10 w-10 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/shey3132/-22/refs/heads/main/%D7%9C%D7%95%D7%92%D7%95%20%D7%A9%D7%99%20%D7%A2%D7%95%D7%9C%D7%9E%D7%95%D7%AA.png';
                  }}
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-blue-900 text-white rounded-lg font-bold text-xs">
                  ש
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">תצוגה מקדימה של המיתוג</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                {orgName} &bull; מנהל פעיל: {adminEmail}
              </div>
            </div>
          </div>

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
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 transition-all flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>שמור הגדרות</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
