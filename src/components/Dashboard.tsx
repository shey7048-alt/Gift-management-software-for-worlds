import React, { useState, useMemo } from 'react';
import { 
  FolderOpen, Plus, Calendar, DollarSign, Search, Archive, AlertCircle, 
  Trash2, FileText, PieChart, ChevronRight, Sparkles, Filter, Edit, 
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

  // Filter periods based on tab
  const filteredPeriods = useMemo(() => {
    return periods
      .filter(p => p.status === activeTab)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [periods, activeTab]);

  // If no period is selected, default to the most recent filtered period (if exists)
  React.useEffect(() => {
    if (!selectedPeriodId && filteredPeriods.length > 0) {
      setSelectedPeriodId(filteredPeriods[0].id);
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
    <div id="dashboard-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Overview Cards */}
      <section id="metrics-bento" className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard 
          id="stat-all-time"
          title="All-Time Expenditures"
          value={`$${stats.totalAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Cumulated organization spending"
          icon={DollarSign}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <StatCard 
          id="stat-this-year"
          title="Yearly Spending (2026)"
          value={`$${stats.totalThisYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Cumulative calendar year"
          icon={TrendingUp}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <StatCard 
          id="stat-this-month"
          title="Monthly Spending"
          value={`$${stats.totalThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Current month expenditures"
          icon={Calendar}
          colorClass="text-amber-600 bg-amber-50"
        />
        <StatCard 
          id="stat-active-week"
          title="Selected Week Total"
          value={`$${stats.activePeriodTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={selectedPeriod ? selectedPeriod.weekLabel : "No week selected"}
          icon={Clock}
          colorClass="text-teal-600 bg-teal-50"
        />
      </section>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Weekly Period Navigator (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-emerald-600" />
                <span>Weekly Logs</span>
              </h3>
              <button
                id="btn-add-period"
                onClick={onAddPeriod}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-150"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Week</span>
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
                Active
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
                Archived
              </button>
            </div>

            {/* List of Periods */}
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {filteredPeriods.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No periods found</p>
                  <p className="text-[10px] text-slate-400 mt-1">Open a new weekly log above</p>
                </div>
              ) : (
                filteredPeriods.map(p => {
                  const itemsCount = (expenses[p.id] || []).length;
                  const totalCost = (expenses[p.id] || []).reduce((sum, e) => sum + e.totalCost, 0);
                  const isSelected = p.id === selectedPeriodId;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPeriodId(p.id)}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10' 
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {p.weekLabel}
                        </p>
                        <p className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'} font-medium`}>
                          {p.startDate} &rarr; {p.endDate}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected ? 'text-white translate-x-1' : 'text-slate-400 group-hover:translate-x-1'
                        }`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Category Breakdown for selected Period */}
          {selectedPeriod && periodExpenses.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-emerald-600" />
                <span>Week Category Split</span>
              </h4>

              <div className="space-y-3">
                {categoryBreakdown.map(cat => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{cat.name}</span>
                      <span className="text-slate-900">${cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Weekly Expenses Detail Grid (lg:col-span-8) */}
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
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {selectedPeriod.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Period Dates: {selectedPeriod.startDate} to {selectedPeriod.endDate}
                  </p>
                  {selectedPeriod.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 mt-2 max-w-xl">
                      <span className="font-semibold text-slate-700">Notes:</span> {selectedPeriod.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onEditPeriod(selectedPeriod)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-all duration-150"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Period</span>
                  </button>

                  <button
                    onClick={() => onArchivePeriod(selectedPeriod.id, selectedPeriod.status === 'active' ? 'archived' : 'active')}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-150 ${
                      selectedPeriod.status === 'active'
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {selectedPeriod.status === 'active' ? (
                      <>
                        <Archive className="h-3.5 w-3.5" />
                        <span>Archive Period</span>
                      </>
                    ) : (
                      <>
                        <ArchiveRestore className="h-3.5 w-3.5" />
                        <span>Activate Period</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this entire weekly period? This will also remove all its logged expenses.")) {
                        onDeletePeriod(selectedPeriod.id);
                        setSelectedPeriodId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-xl transition-all duration-150"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Sub-header Controls: Search & Category Filter & Add Expense Button */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-3 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="search-box"
                      type="text"
                      placeholder="Search items, tags, descriptions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block py-2 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white text-slate-700"
                  >
                    <option value="All">All Categories</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button
                  id="btn-add-expense"
                  onClick={() => onAddExpense(selectedPeriod.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 transition-all duration-150"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Expense</span>
                </button>
              </div>

              {/* Expenses List */}
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl space-y-3 bg-slate-50/50">
                  <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
                  <div>
                    <h5 className="font-bold text-slate-700">No Expenses Logged</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      There are no expense records matching your active filters. Create a new entry or adjust your query.
                    </p>
                  </div>
                  <button
                    onClick={() => onAddExpense(selectedPeriod.id)}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Create First Log</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-3xl">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Price/Qty</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt</th>
                          <th scope="col" className="relative px-6 py-3.5"><span className="sr-only">Actions</span></th>
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
                                <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <Sparkles className="h-2.5 w-2.5" /> Scanned
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                              ${exp.costPerItem.toFixed(2)} &times; {exp.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">
                              ${exp.totalCost.toFixed(2)}
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
                                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View File</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 italic">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-1.5">
                              <button
                                onClick={() => onEditExpense(selectedPeriod.id, exp)}
                                className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-lg transition-colors inline-flex"
                                title="Edit Expense"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this expense record?")) {
                                    onDeleteExpense(selectedPeriod.id, exp.id);
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                                title="Delete Expense"
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
                <h3 className="font-extrabold text-slate-800 text-lg">No Log Selected</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select a weekly log period from the left sidebar navigator, or open a brand new week to begin tracking expenditures.
                </p>
              </div>
              <button
                onClick={onAddPeriod}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Open First Week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Viewing Receipt Image Modal */}
      {viewingReceipt && (
        <div id="receipt-preview-backdrop" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 truncate pr-4">{viewingReceipt.name}</h4>
              <button 
                onClick={() => setViewingReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg"
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
                />
              ) : (
                <div className="p-12 text-center space-y-3 text-slate-400">
                  <FileText className="h-16 w-16 mx-auto" />
                  <p className="text-sm font-semibold">{viewingReceipt.name}</p>
                  <p className="text-xs">PDF Document View (Self-Contained Base64 File)</p>
                  <a 
                    href={viewingReceipt.base64} 
                    download={viewingReceipt.name}
                    className="inline-flex bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
