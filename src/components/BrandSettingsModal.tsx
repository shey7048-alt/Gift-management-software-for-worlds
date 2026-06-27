import React, { useState } from 'react';
import { X, Sparkles, Image, Check, RefreshCw } from 'lucide-react';
import { BrandConfig } from '../types';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  onSave: (config: BrandConfig) => void;
}

const PRESET_LOGOS = [
  {
    name: 'Emerald Royal',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=128&fit=crop&q=80',
    desc: 'Classic business stamp logo'
  },
  {
    name: 'Modern Gold',
    url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&fit=crop&q=80',
    desc: 'Golden luxury corporate emblem'
  },
  {
    name: 'Geometric Blue',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&fit=crop&q=80',
    desc: 'Hi-tech abstract pattern'
  }
];

export default function BrandSettingsModal({ isOpen, onClose, brandConfig, onSave }: BrandSettingsModalProps) {
  const [logoUrl, setLogoUrl] = useState(brandConfig.logoUrl || '');
  const [orgName, setOrgName] = useState(brandConfig.orgName || 'שי אולמות');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave({
        logoUrl: logoUrl.trim() || undefined,
        orgName: orgName.trim() || 'שי אולמות'
      });
      setSaving(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Content Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden transform transition-all p-6 z-10">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              הגדרות מיתוג ולוגו
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Customize the system branding, name, and logo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              שם הארגון / המוסד
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
              placeholder="שי אולמות"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              קישור ללוגו (Logo Image URL)
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Image className="h-4 w-4" />
              </div>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-600 font-mono text-xs"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              הדבק כאן את קישור הלוגו שלך. הלוגו יוצג אוטומטית בכל חלקי המערכת.
            </p>
          </div>

          {/* Quick Preset Options */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              דוגמאות לוגו מוכנות (Presets)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_LOGOS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setLogoUrl(preset.url)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    logoUrl === preset.url
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="h-8 w-8 object-cover rounded-lg mb-1 mx-auto"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[10px] font-bold text-slate-700 text-center truncate">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Logo Live Preview */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Live Preview"
                  className="h-10 w-10 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=128&fit=crop&q=80';
                  }}
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-emerald-600 text-white rounded-lg font-bold text-xs">
                  ש
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">תצוגה מקדימה של הלוגו</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                {orgName} &bull; מותאם למסמכים ולדוחות
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-all flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>שמור שינויים</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
