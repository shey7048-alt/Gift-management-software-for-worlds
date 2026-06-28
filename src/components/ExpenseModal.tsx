import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, List, Tag, FileText, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
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
    <div id="expense-modal-root" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Right Side in LTR / Right Side in RTL layout - manual inputs */}
        <form onSubmit={handleSubmit} className="w-full md:w-1/2 flex flex-col justify-between overflow-y-auto border-l border-slate-100">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {initialExpense ? 'עריכת רשומת הוצאה' : 'תיעוד הוצאה שבועי'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{weekLabel}</p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-all duration-150 mr-auto ml-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4 flex-1">
            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex justify-between items-center">
                <span>תאריך הרכישה</span>
                {scannedFields['date'] && (
                  <span className="text-[10px] font-bold text-blue-900 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-2.5 w-2.5" /> מולא ע"י AI
                  </span>
                )}
              </label>
              <div className={`relative rounded-xl border transition-all ${
                scannedFields['date'] ? 'border-blue-900/50 bg-blue-50/5 ring-2 ring-blue-900/10' : 'border-slate-200'
              }`}>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
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
                  className="block w-full pr-10 pl-3.5 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            {/* Item Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex justify-between items-center">
                <span>תיאור הפריט / פירוט הוצאה</span>
                {scannedFields['description'] && (
                  <span className="text-[10px] font-bold text-blue-900 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-2.5 w-2.5" /> מולא ע"י AI
                  </span>
                )}
              </label>
              <div className={`relative rounded-xl border transition-all ${
                scannedFields['description'] ? 'border-blue-900/50 bg-blue-50/5 ring-2 ring-blue-900/10' : 'border-slate-200'
              }`}>
                <div className="absolute inset-y-0 right-0 pr-3 pt-3 pointer-events-none text-slate-400">
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
                  placeholder="מה נרכש? (למשל: רכישת חומרי בניין, ציוד משרדי, כיבוד וכו')"
                  className="block w-full pr-10 pl-3.5 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm"
                />
              </div>
            </div>

            {/* Categorization */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex justify-between items-center">
                <span>קטגוריית הוצאה</span>
                {scannedFields['category'] && (
                  <span className="text-[10px] font-bold text-blue-900 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-2.5 w-2.5" /> מולא ע"י AI
                  </span>
                )}
              </label>
              <div className={`relative rounded-xl border transition-all ${
                scannedFields['category'] ? 'border-blue-900/50 bg-blue-50/5 ring-2 ring-blue-900/10' : 'border-slate-200'
              }`}>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Tag className="h-4 w-4" />
                </div>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setScannedFields({ ...scannedFields, category: false });
                  }}
                  className="block w-full pr-10 pl-3.5 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm font-semibold"
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  מחיר יחידה (₪)
                </label>
                <div className={`relative rounded-xl border transition-all ${
                  scannedFields['costPerItem'] ? 'border-blue-900/30 bg-blue-50/5' : 'border-slate-200'
                }`}>
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
                    className="block w-full px-3 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  כמות יח'
                </label>
                <div className={`relative rounded-xl border transition-all ${
                  scannedFields['quantity'] ? 'border-blue-900/30 bg-blue-50/5' : 'border-slate-200'
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
                    className="block w-full px-3 py-2.5 text-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-0 border-0 text-sm text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  סה״כ לתשלום
                </label>
                <div className={`relative rounded-xl border bg-slate-50 transition-all ${
                  scannedFields['totalCost'] ? 'border-blue-900 bg-blue-50 ring-2 ring-blue-900/10' : 'border-slate-200'
                }`}>
                  <input
                    id="expense-total"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={totalCost}
                    onChange={(e) => {
                      setTotalCost(parseFloat(e.target.value) || 0);
                      setScannedFields({ ...scannedFields, totalCost: true });
                    }}
                    className="block w-full px-3 py-2.5 text-slate-900 bg-transparent font-black rounded-xl focus:outline-none focus:ring-0 border-0 text-sm text-center"
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
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-150"
            >
              ביטול
            </button>
            <button
              id="save-expense-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-md shadow-blue-100 disabled:opacity-50 inline-flex items-center gap-1.5 transition-all duration-150"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4 text-blue-100" />
              )}
              <span>{initialExpense ? 'שמור שינויים' : 'תיעוד הוצאה'}</span>
            </button>
          </div>
        </form>

        {/* Left Side: Receipt Scanning Portal */}
        <div className="w-full md:w-1/2 p-6 bg-slate-50/40 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-blue-50 text-blue-900 rounded-lg border border-blue-100">
                <Sparkles className="h-4 w-4" />
              </span>
              <h4 className="font-bold text-slate-800">סריקה ופענוח קבלה חכם (AI)</h4>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              העלה תמונה ברורה, סריקה או מסמך קבלה (חשבונית). מנוע ה-AI של Gemini ינתח את המסמך ויזין את השדות (תאריך, פירוט, סכום וקטגוריה) אוטומטית!
            </p>

            {receiptBase64 ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-3 shadow-xs">
                  {receiptType?.startsWith('image/') ? (
                    <img 
                      src={receiptBase64} 
                      alt="Receipt Attachment" 
                      className="w-full h-48 object-contain rounded-xl bg-slate-50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <FileText className="h-12 w-12" />
                      <span className="text-xs font-semibold mt-2">{receiptName || 'PDF קבלה'}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="absolute top-5 left-5 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    מחק קובץ
                  </button>
                </div>
                <div className="bg-blue-50 text-blue-900 p-3.5 rounded-2xl border border-blue-100/50 text-xs flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-blue-900 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">הקובץ צורף בהצלחה למערכת</p>
                    <p className="text-blue-900/90 mt-0.5 text-[11px] font-mono select-all">שם קובץ: {receiptName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <ReceiptScanner onScanComplete={handleScanComplete} />
            )}
          </div>
          
          <div className="hidden md:block pt-6 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider block">
              מערכת ניהול תקציבית - שי עולמות
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
