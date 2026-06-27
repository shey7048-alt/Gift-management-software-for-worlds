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
      // Create readable label
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const startStr = startObj.toLocaleDateString('en-US', options);
      const endStr = endObj.toLocaleDateString('en-US', options);
      const weekLabel = `Week of ${startStr} - ${endStr}`;

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
    <div id="weekly-period-modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            {initialPeriod ? 'Edit Weekly Period' : 'Open New Weekly Period'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all duration-150"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Start Date (Sunday)
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                id="period-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              End Date (Saturday)
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                id="period-end-date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Period Notes / Comments
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-slate-400">
                <FileText className="h-5 w-5" />
              </div>
              <textarea
                id="period-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="E.g., Event catering setup and office operational overhead"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-150"
            >
              Cancel
            </button>
            <button
              id="save-period-btn"
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50 inline-flex items-center gap-1 transition-all duration-150"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4" />}
              <span>{initialPeriod ? 'Save Changes' : 'Open Period'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
