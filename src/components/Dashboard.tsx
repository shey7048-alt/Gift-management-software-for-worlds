import React, { useState, useMemo } from 'react';
import { 
  FolderOpen, Plus, Calendar, DollarSign, Search, Archive, AlertCircle, 
  Trash2, FileText, PieChart, ChevronLeft, Sparkles, Filter, Edit, 
  TrendingUp, CheckCircle, Eye, EyeOff, ArchiveRestore, Clock, X
} from 'lucide-react';
import { WeeklyPeriod, Expense, EXPENSE_CATEGORIES } from '../types';
import StatCard from './StatCard';

interface DashboardProps {
  periods: WeeklyPeriod[];
  expenses: { [periodId: string]: Expense[] };
  onAddPeriod: () => void;
  onEditPeriod: (period: WeeklyPeriod) => void;
  onDeletePeriod: (periodId: string) => void;
  onArchivePeriod: (periodId: string, status: 'active' | 'archived') => void;
  onAddExpense: (periodId: string) => void;
  onEditExpense: (periodId: string, expense: Expense) => void;
  onDeleteExpense: (periodId: string, expenseId: string) => void;
}

export default function Dashboard({
  periods,
  expenses,
  onAddPeriod,
  onEditPeriod,
  onDeletePeriod,
  onArchivePeriod,
  onAddExpense,
  onEditExpense,
  onDeleteExpense
}: DashboardProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  // Modal states for receipt previewing
  const [viewingReceipt, setViewingReceipt] = useState<{ name: string; base64: string; type: string } | null>(null);

  // Filter periods based on tab (Newest period is active, all others are archived)
  const filteredPeriods = useMemo(() => {
    if (periods.length === 0) return [];

    // Sort all periods by date descending (latest date first)
    const sortedAllPeriods = [...periods].sort((a, b) => {
      const dateA = a.date || a.startDate || '';
      const dateB = b.date || b.startDate || '';
      return dateB.localeCompare(dateA);
    });

    const newestPeriodId = sortedAllPeriods[0]?.id;

    return periods
      .filter(p => {
        const isActive = p.id === newestPeriodId;
        return activeTab === 'active' ? isActive : !isActive;
      })
      .sort((a, b) => {
        const dateA = a.date || a.startDate || '';
        const dateB = b.date || b.startDate || '';
        return dateB.localeCompare(dateA);
      });
  }, [periods, activeTab]);

  // Group filtered periods by Month and Year in Hebrew
  const groupedPeriods = useMemo(() => {
    const groups: { [key: string]: WeeklyPeriod[] } = {};
    
    filteredPeriods.forEach(p => {
      const pDate = p.date || p.startDate || '2026-06-24';
      const dateObj = new Date(pDate);
      if (isNaN(dateObj.getTime())) {
        const key = 'אחר';
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
        return;
      }
      
      const monthLabel = dateObj.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      if (!groups[monthLabel]) {
        groups[monthLabel] = [];
      }
      groups[monthLabel].push(p);
    });
    
    return groups;
  }, [filteredPeriods]);

  // Sort group keys chronologically (newest first)
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedPeriods).sort((a, b) => {
      const pA = groupedPeriods[a][0];
      const pB = groupedPeriods[b][0];
      const dateA = pA.date || pA.startDate || '';
      const dateB = pB.date || pB.startDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [groupedPeriods]);

  // If no period is selected or current selection is not in filtered list, select the most recent one
  React.useEffect(() => {
    if (filteredPeriods.length > 0) {
      const isSelectedInFiltered = filteredPeriods.some(p => p.id === selectedPeriodId);
      if (!isSelectedInFiltered) {
        setSelectedPeriodId(filteredPeriods[0].id);
      }
    } else {
      setSelectedPeriodId(null);
    }
  }, [filteredPeriods, selectedPeriodId]);

  const selectedPeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Expenses for the selected period
  const periodExpenses = useMemo(() => {
    if (!selectedPeriodId) return [];
    return expenses[selectedPeriodId] || [];
  }, [expenses, selectedPeriodId]);

  // Apply search and category filters on the active period's expenses
  const filteredExpenses = useMemo(() => {
    return periodExpenses.filter(exp => {
      const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            exp.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [periodExpenses, searchQuery, categoryFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    let totalAllTime = 0;
    let totalThisMonth = 0;
    let totalThisYear = 0;

    const currentMonth = new Date().getMonth(); // 0-11
    const currentYear = new Date().getFullYear();

    Object.values(expenses).forEach(expList => {
      expList.forEach(exp => {
        totalAllTime += exp.totalCost;
        
        try {
          const expDate = new Date(exp.date);
          if (expDate.getFullYear() === currentYear) {
            totalThisYear += exp.totalCost;
            if (expDate.getMonth() === currentMonth) {
              totalThisMonth += exp.totalCost;
            }
          }
        } catch (e) {
          console.error("Date parsing error in stats:", e);
        }
      });
    });

    const activePeriodTotal = periodExpenses.reduce((sum, exp) => sum + exp.totalCost, 0);

    return {
      activePeriodTotal,
      totalThisMonth,
      totalThisYear,
      totalAllTime,
    };
  }, [expenses, periodExpenses]);

  // Category breakdown for the selected week period
  const categoryBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    periodExpenses.forEach(exp => {
      breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.totalCost;
    });

    const total = periodExpenses.reduce((sum, exp) => sum + exp.totalCost, 0);

    return Object.keys(breakdown).map(cat => ({
      name: cat,
      amount: breakdown[cat],
      percentage: total > 0 ? Math.round((breakdown[cat] / total) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [periodExpenses]);

  return (
    <div id="dashboard-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Overview Cards */}
      <section id="metrics-bento" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard 
          id="stat-this-year"
          title="הוצאות שנתיות"
          value={`₪${stats.totalThisYear.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="שנה קלנדרית נוכחית"
          icon={TrendingUp}
          colorClass="text-indigo-900 bg-indigo-50"
        />
        <StatCard 
          id="stat-this-month"
          title="הוצאות חודשיות"
          value={`₪${stats.totalThisMonth.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="חודש נוכחי"
          icon={Calendar}
          colorClass="text-amber-700 bg-amber-50"
        />
        <StatCard 
          id="stat-active-week"
          title="סה״כ דיווח נבחר"
          value={`₪${stats.activePeriodTotal.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={selectedPeriod ? selectedPeriod.weekLabel : "לא נבחר דיווח"}
          icon={Clock}
          colorClass="text-slate-800 bg-slate-100"
        />
      </section>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Right Column in LTR is Right side in RTL: Weekly Period Navigator (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-900" />
                <span>יומני דיווח</span>
              </h3>
              <button
                id="btn-add-period"
                onClick={onAddPeriod}
                className="inline-flex items-center gap-1 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all duration-150 shadow-md shadow-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>דיווח חדש</span>
              </button>
            </div>

            {/* Tab Controls */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('active');
                  setSelectedPeriodId(null);
                }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'active' 
                    ? 'bg-white text-slate-800 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                דיווח פעיל
              </button>
              <button
                onClick={() => {
                  setActiveTab('archived');
                  setSelectedPeriodId(null);
                }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'archived' 
                    ? 'bg-white text-slate-800 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ארכיון דיווחים
              </button>
            </div>

            {/* List of Periods */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pl-1">
              {filteredPeriods.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">לא נמצאו יומני דיווח</p>
                  <p className="text-[10px] text-slate-400 mt-1">לחץ על 'דיווח חדש' למעלה כדי להתחיל</p>
                </div>
              ) : (
                sortedGroupKeys.map(groupKey => (
                  <div key={groupKey} className="space-y-2">
                    {/* Month/Year Divider */}
                    <div className="flex items-center gap-2 pt-1 pb-1 px-1">
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/30">
                        {groupKey}
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    <div className="space-y-2">
                      {groupedPeriods[groupKey].map(p => {
                        const itemsCount = (expenses[p.id] || []).length;
                        const totalCost = (expenses[p.id] || []).reduce((sum, e) => sum + e.totalCost, 0);
                        const isSelected = p.id === selectedPeriodId;

                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPeriodId(p.id)}
                            className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between group ${
                              isSelected 
                                ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-100' 
                                : 'bg-white hover:bg-slate-50 border-slate-100 shadow-xs'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                {p.weekLabel}
                              </p>
                              <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'} font-medium`}>
                                תאריך דיווח: {p.date || p.startDate}
                              </p>
                              <div className="flex gap-2 pt-1">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {itemsCount} {itemsCount === 1 ? 'הוצאה' : 'הוצאות'}
                                </span>
                              </div>
                            </div>

                            <div className="text-left flex items-center gap-2">
                              <div>
                                <p className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  ₪{totalCost.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                              <ChevronLeft className={`h-4 w-4 shrink-0 transition-transform ${
                                isSelected ? 'text-white -translate-x-1' : 'text-slate-400 group-hover:-translate-x-1'
                              }`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category Breakdown for selected Period */}
          {selectedPeriod && periodExpenses.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-900" />
                <span>פילוח קטגוריות לדיווח</span>
              </h4>

              <div className="space-y-3">
                {categoryBreakdown.map(cat => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{cat.name}</span>
                      <span className="text-slate-900">₪{cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-900 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Left Column in LTR is Right side in RTL: Weekly Expenses Detail Grid (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPeriod ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              {/* Period Actions and Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedPeriod.weekLabel}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedPeriod.status === 'active' 
                        ? 'bg-blue-50 text-blue-900 border border-blue-100' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {selectedPeriod.status === 'active' ? 'פעיל' : 'בארכיון'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    תאריך דיווח: {selectedPeriod.date || selectedPeriod.startDate}
                  </p>
                  {selectedPeriod.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 mt-2 max-w-xl">
                      <span className="font-semibold text-slate-700">הערות:</span> {selectedPeriod.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onEditPeriod(selectedPeriod)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-all duration-150"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>עריכת דיווח</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("האם אתה בטוח שברצונך למחוק את הדיווח הזה לחלוטין? כל ההוצאות המשויכות אליו יימחקו.")) {
                        onDeletePeriod(selectedPeriod.id);
                        setSelectedPeriodId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-xl transition-all duration-150"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>מחיקה</span>
                  </button>
                </div>
              </div>

              {/* Sub-header Controls: Search & Category Filter & Add Expense Button */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-3 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="search-box"
                      type="text"
                      placeholder="חיפוש הוצאות, תיאורים, קטגוריות..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
                    />
                  </div>

                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block py-2 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm bg-white text-slate-700"
                  >
                    <option value="All">כל הקטגוריות</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button
                  id="btn-add-expense"
                  onClick={() => onAddExpense(selectedPeriod.id)}
                  className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-blue-100 transition-all duration-150"
                >
                  <Plus className="h-4 w-4" />
                  <span>תיעוד הוצאה חדשה</span>
                </button>
              </div>

              {/* Expenses List */}
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl space-y-3 bg-slate-50/50">
                  <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
                  <div>
                    <h5 className="font-bold text-slate-700">אין הוצאות מתועדות</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      לא נמצאו הוצאות התואמות את החיפוש או הסינון שלך בדיווח זה.
                    </p>
                  </div>
                  <button
                    onClick={() => onAddExpense(selectedPeriod.id)}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-900" />
                    <span>הוסף הוצאה ראשונה</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-3xl">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">תאריך</th>
                          <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">תיאור הפריט</th>
                          <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">קטגוריה</th>
                          <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">כמות / מחיר</th>
                          <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">סה״כ</th>
                          <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">קבלה / קובץ</th>
                          <th scope="col" className="relative px-6 py-3.5"><span className="sr-only">פעולות</span></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                              {exp.date}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-800">{exp.description}</p>
                              {exp.receiptBase64 && (
                                <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] text-blue-900 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                  <Sparkles className="h-2.5 w-2.5" /> נסרק דיגיטלית
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                              ₪{exp.costPerItem.toFixed(2)} &times; {exp.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">
                              ₪{exp.totalCost.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                              {exp.receiptBase64 ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingReceipt({
                                    name: exp.receiptName || 'Attached Receipt',
                                    base64: exp.receiptBase64!,
                                    type: exp.receiptType || 'image/jpeg'
                                  })}
                                  className="inline-flex items-center gap-1 font-bold text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>הצג קובץ</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 italic">אין קובץ</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold space-x-1.5">
                              <button
                                onClick={() => onEditExpense(selectedPeriod.id, exp)}
                                className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-lg transition-colors inline-flex"
                                title="ערוך הוצאה"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("האם אתה בטוח שברצונך למחוק הוצאה זו?")) {
                                    onDeleteExpense(selectedPeriod.id, exp.id);
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                                title="מחק הוצאה"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
              <FolderOpen className="h-12 w-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">לא נבחר דיווח</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  בחר יומן דיווח מרשימת הדיווחים מימין כדי להציג את ההוצאות שלו, או פתח דיווח חדש לגמרי.
                </p>
              </div>
              <button
                onClick={onAddPeriod}
                className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100"
              >
                פתח דיווח ראשון
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Viewing Receipt Image Modal */}
      {viewingReceipt && (
        <div id="receipt-preview-backdrop" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 truncate pr-4">{viewingReceipt.name}</h4>
              <button 
                onClick={() => setViewingReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full mr-auto ml-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-center max-h-[70vh] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2">
              {viewingReceipt.type.startsWith('image/') ? (
                <img 
                  src={viewingReceipt.base64} 
                  alt="Receipt" 
                  className="max-h-[60vh] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-12 text-center space-y-3 text-slate-400">
                  <FileText className="h-16 w-16 mx-auto" />
                  <p className="text-sm font-semibold">{viewingReceipt.name}</p>
                  <p className="text-xs">מסמך דיגיטלי (קובץ Base64)</p>
                  <a 
                    href={viewingReceipt.base64} 
                    download={viewingReceipt.name}
                    className="inline-flex bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    הורד קובץ
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                סגור תצוגה מקדימה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
