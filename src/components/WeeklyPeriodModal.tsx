import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Loader2 } from 'lucide-react';
import { WeeklyPeriod } from '../types';

interface WeeklyPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (period: Omit<WeeklyPeriod, 'id' | 'createdAt'>) => Promise<void>;
  initialPeriod?: WeeklyPeriod;
}

export default function WeeklyPeriodModal({ isOpen, onClose, onSave, initialPeriod }: WeeklyPeriodModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-calculate weekly label or provide default Sunday-to-Saturday bounds
  useEffect(() => {
    if (initialPeriod) {
      setStartDate(initialPeriod.startDate);
      setEndDate(initialPeriod.endDate);
      setNotes(initialPeriod.notes || '');
    } else {
      const today = new Date();
      // Get previous Sunday
      const prevSunday = new Date(today);
      prevSunday.setDate(today.getDate() - today.getDay());
      
      // Get next Saturday
      const nextSaturday = new Date(prevSunday);
      nextSaturday.setDate(prevSunday.getDate() + 6);

      setStartDate(prevSunday.toISOString().split('T')[0]);
      setEndDate(nextSaturday.toISOString().split('T')[0]);
      setNotes('');
    }
  }, [initialPeriod, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      // Create readable Hebrew label
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const startStr = startObj.toLocaleDateString('he-IL', options);
      const endStr = endObj.toLocaleDateString('he-IL', options);
      const weekLabel = `שבוע מ-${startStr} עד ${endStr}`;

      await onSave({
        weekLabel,
        startDate,
        endDate,
        status: initialPeriod ? initialPeriod.status : 'active',
        notes: notes || undefined,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="weekly-period-modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            {initialPeriod ? 'עריכת שבוע דיווח' : 'פתיחת שבוע דיווח חדש'}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-all duration-150 mr-auto ml-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              תאריך התחלה (יום ראשון)
            </label>
            <div className="relative rounded-xl border border-slate-200">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                id="period-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full pr-10 pl-3.5 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                style={{ direction: 'ltr' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              תאריך סיום (יום שבת)
            </label>
            <div className="relative rounded-xl border border-slate-200">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                id="period-end-date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full pr-10 pl-3.5 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                style={{ direction: 'ltr' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              הערות שבועיות / הערות מנהל
            </label>
            <div className="relative rounded-xl border border-slate-200">
              <div className="absolute inset-y-0 right-0 pr-3.5 pt-3 pointer-events-none text-slate-400">
                <FileText className="h-4 w-4" />
              </div>
              <textarea
                id="period-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="למשל: רכישת חומרי בניין עבור סניף ירושלים או תקציב שבועי מוגדר מראש"
                className="block w-full pr-10 pl-3.5 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-150"
            >
              ביטול
            </button>
            <button
              id="save-period-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-md shadow-blue-100 disabled:opacity-50 inline-flex items-center gap-1.5 transition-all duration-150"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4" />}
              <span>{initialPeriod ? 'שמור שינויים' : 'פתח תקופת דיווח'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
