import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    date: string;
    description: string;
    category: string;
    costPerItem: number;
    quantity: number;
    totalCost: number;
    receiptBase64: string;
    receiptName: string;
    receiptType: string;
  }) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    // Check file size (limit base64 to ~3MB to be safe and responsive in Firestore)
    if (file.size > 3 * 1024 * 1024) {
      setError("גודל הקובץ גדול מדי. אנא העלה קובץ קטן מ-3MB לצורך שמירה יעילה.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const base64Data = await fileToBase64(file);
      
      // Extract file name without extension to use as a helpful default description
      const nameWithoutExt = file.name.split('.').slice(0, -1).join('.') || file.name;

      onScanComplete({
        date: new Date().toISOString().split('T')[0],
        description: nameWithoutExt,
        category: 'אחר',
        costPerItem: 0,
        quantity: 1,
        totalCost: 0,
        receiptBase64: base64Data,
        receiptName: file.name,
        receiptType: file.type,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Receipt loading error:", err);
      setError("אירעה שגיאה בטעינת הקובץ. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="receipt-scanner-root" className="space-y-4" dir="rtl">
      <div 
        id="drag-drop-area"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 ${
          isDragActive 
            ? 'border-blue-900 bg-blue-50/50' 
            : 'border-slate-200 hover:border-blue-900 hover:bg-slate-50'
        }`}
      >
        <input 
          id="receipt-file-input"
          ref={fileInputRef}
          type="file" 
          accept="image/*,application/pdf" 
          className="hidden" 
          onChange={handleFileChange}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3 animate-pulse">
            <UploadCloud className="h-10 w-10 text-blue-900 animate-bounce" />
            <div>
              <p className="text-sm font-bold text-slate-800">טוען ומצרף קובץ קבלה...</p>
              <p className="text-xs text-slate-400 mt-1">מכין את המסמך לשמירה מאובטחת במאגר</p>
            </div>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
            <p className="text-sm font-bold text-slate-800">הקובץ צורף בהצלחה!</p>
            <p className="text-xs text-slate-400">הקובץ נשמר ישירות במאגר הנתונים בעת שמירת ההוצאה</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="inline-flex p-3 bg-blue-50 text-blue-900 rounded-full border border-blue-100">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                לחץ כאן או גרור את קובץ הקבלה לכאן
              </p>
              <p className="text-xs text-slate-400 mt-1">
                תומך בתמונות (JPEG, PNG) ומסמכי PDF עד 3MB
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                שמירה ישירה במאגר
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div id="scanner-error-message" className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5 font-semibold">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">טעינת הקובץ נכשלה</p>
            <p className="text-rose-600 text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
