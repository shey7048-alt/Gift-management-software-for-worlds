import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, List, Tag, FileText, CheckCircle, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Expense, EXPENSE_CATEGORIES } from '../types';
import ReceiptScanner from './ReceiptScanner';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialExpense?: Expense;
  weekLabel: string;
}

export default function ExpenseModal({ isOpen, onClose, onSave, initialExpense, weekLabel }: ExpenseModalProps) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [costPerItem, setCostPerItem] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [totalCost, setTotalCost] = useState(0);
  const [receiptBase64, setReceiptBase64] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);
  const [receiptType, setReceiptType] = useState<string | undefined>(undefined);
  
  const [loading, setLoading] = useState(false);
  const [scannedFields, setScannedFields] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (initialExpense) {
      setDate(initialExpense.date);
      setDescription(initialExpense.description);
      setCategory(initialExpense.category);
      setCostPerItem(initialExpense.costPerItem);
      setQuantity(initialExpense.quantity);
      setTotalCost(initialExpense.totalCost);
      setReceiptBase64(initialExpense.receiptBase64);
      setReceiptName(initialExpense.receiptName);
      setReceiptType(initialExpense.receiptType);
      setScannedFields({});
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory('Other');
      setCostPerItem(0);
      setQuantity(1);
      setTotalCost(0);
      setReceiptBase64(undefined);
      setReceiptName(undefined);
      setReceiptType(undefined);
      setScannedFields({});
    }
  }, [initialExpense, isOpen]);

  // Handle multiplication
  useEffect(() => {
    if (!scannedFields['totalCost']) {
      setTotalCost(parseFloat((costPerItem * quantity).toFixed(2)));
    }
  }, [costPerItem, quantity]);

  if (!isOpen) return null;

  const handleScanComplete = (scannedData: any) => {
    setDate(scannedData.date);
    setDescription(scannedData.description);
    setCategory(scannedData.category);
    setCostPerItem(scannedData.costPerItem);
    setQuantity(scannedData.quantity);
    setTotalCost(scannedData.totalCost);
    setReceiptBase64(scannedData.receiptBase64);
    setReceiptName(scannedData.receiptName);
    setReceiptType(scannedData.receiptType);
    
    // Mark fields as auto-filled for sparkles visual aid
    setScannedFields({
      date: true,
      description: true,
      category: true,
      costPerItem: true,
      quantity: true,
      totalCost: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !category) return;

    setLoading(true);
    try {
      await onSave({
        date,
        description,
        category,
        costPerItem,
        quantity,
        totalCost,
        receiptBase64,
        receiptName,
        receiptType,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeReceipt = () => {
    setReceiptBase64(undefined);
    setReceiptName(undefined);
    setReceiptType(undefined);
    const updatedFields = { ...scannedFields };
    delete updatedFields['receipt'];
    setScannedFields(updatedFields);
  };

  return (
    <div id="expense-modal-root" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl border border-slate-100 overflow-hidden transform transition-all flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Receipt Scanning Portal */}
        <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between bg-slate-50/40 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Sparkles className="h-4 w-4" />
              </span>
              <h4 className="font-bold text-slate-800">Smart Receipt Scan</h4>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Upload a scanned image or clear phone photograph of the expense receipt. Our built-in Gemini parser will automatically extract parameters.
            </p>

            {receiptBase64 ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-3 shadow-xs">
                  {receiptType?.startsWith('image/') ? (
                    <img 
                      src={receiptBase64} 
                      alt="Scanned Receipt preview" 
                      className="w-full h-48 object-contain rounded-xl bg-slate-50"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <FileText className="h-12 w-12" />
                      <span className="text-xs font-semibold mt-2">{receiptName || 'PDF Receipt'}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="absolute top-5 right-5 bg-rose-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-rose-600 transition-colors shadow-xs"
                  >
                    Delete Receipt
                  </button>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl border border-emerald-100/50 text-xs flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Receipt Attached Securely</p>
                    <p className="text-emerald-600/90 mt-0.5">Filename: {receiptName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <ReceiptScanner onScanComplete={handleScanComplete} />
            )}
          </div>
          
          <div className="hidden md:block pt-6 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
              Shai Olamot Expenses Core v1.1
            </span>
          </div>
        </div>

        {/* Right Side: Manual Form Entry */}
        <form onSubmit={handleSubmit} className="w-full md:w-1/2 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {initialExpense ? 'Edit Expense Record' : 'Log Weekly Expense'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{weekLabel}</p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all duration-150"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4 flex-1">
            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Date of Purchase</span>
                {scannedFields['date'] && (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Gemini Filled
                  </span>
                )}
              </label>
              <div className={`relative rounded-xl border transition-all ${
                scannedFields['date'] ? 'border-emerald-500/50 bg-emerald-50/5 ring-2 ring-emerald-500/10' : 'border-slate-200'
              }`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  id="expense-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setScannedFields({ ...scannedFields, date: false });
                  }}
                  className="block w-full pl-10 pr-3 py-2 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                />
              </div>
            </div>

            {/* Item Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Item Description / Details</span>
                {scannedFields['description'] && (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Gemini Filled
                  </span>
                )}
              </label>
              <div className={`relative rounded-xl border transition-all ${
                scannedFields['description'] ? 'border-emerald-500/50 bg-emerald-50/5 ring-2 ring-emerald-500/10' : 'border-slate-200'
              }`}>
                <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-slate-400">
                  <FileText className="h-4 w-4" />
                </div>
                <textarea
                  id="expense-description"
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setScannedFields({ ...scannedFields, description: false });
                  }}
                  placeholder="What was purchased? (e.g., Office printing paper packages)"
                  className="block w-full pl-10 pr-3 py-2 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                />
              </div>
            </div>

            {/* Categorization */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Category</span>
                {scannedFields['category'] && (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Gemini Filled
                  </span>
                )}
              </label>
              <div className={`relative rounded-xl border transition-all ${
                scannedFields['category'] ? 'border-emerald-500/50 bg-emerald-50/5 ring-2 ring-emerald-500/10' : 'border-slate-200'
              }`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Tag className="h-4 w-4" />
                </div>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setScannedFields({ ...scannedFields, category: false });
                  }}
                  className="block w-full pl-10 pr-3 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Numbers: Cost, Quantity, Total */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Price ($)</span>
                </label>
                <div className={`relative rounded-xl border transition-all ${
                  scannedFields['costPerItem'] ? 'border-emerald-500/50 bg-emerald-50/5' : 'border-slate-200'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs font-bold">$</span>
                  </div>
                  <input
                    id="expense-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPerItem}
                    onChange={(e) => {
                      setCostPerItem(parseFloat(e.target.value) || 0);
                      setScannedFields({ ...scannedFields, costPerItem: false });
                    }}
                    className="block w-full pl-6 pr-2 py-2 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Qty</span>
                </label>
                <div className={`relative rounded-xl border transition-all ${
                  scannedFields['quantity'] ? 'border-emerald-500/50 bg-emerald-50/5' : 'border-slate-200'
                }`}>
                  <input
                    id="expense-qty"
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(parseInt(e.target.value) || 1);
                      setScannedFields({ ...scannedFields, quantity: false });
                    }}
                    className="block w-full px-3 py-2 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Total</span>
                </label>
                <div className={`relative rounded-xl border bg-slate-50 transition-all ${
                  scannedFields['totalCost'] ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10' : 'border-slate-200'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs font-bold">$</span>
                  </div>
                  <input
                    id="expense-total"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={totalCost}
                    onChange={(e) => {
                      setTotalCost(parseFloat(e.target.value) || 0);
                      setScannedFields({ ...scannedFields, totalCost: true }); // override manual calculation
                    }}
                    className="block w-full pl-6 pr-2 py-2 text-slate-900 bg-transparent font-bold rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-150"
            >
              Cancel
            </button>
            <button
              id="save-expense-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 transition-all duration-150"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4 text-emerald-100" />
              )}
              <span>{initialExpense ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
