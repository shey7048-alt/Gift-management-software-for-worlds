import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';

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
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    // Check file size (limit base64 to ~3MB to be safe and responsive)
    if (file.size > 3 * 1024 * 1024) {
      setError("גודל הקובץ גדול מדי. אנא העלה תמונה או מסמך קטן מ-3MB.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    try {
      setLoadingStep("מכין את קובץ הקבלה לפענוח...");
      const base64Data = await fileToBase64(file);

      setLoadingStep("מעלה בצורה מאובטחת...");
      setLoadingStep("בינה מלאכותית (Gemini) מפענחת את הקבלה...");
      
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: file.type || 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errResult = await response.json().catch(() => ({}));
        throw new Error(errResult.error || "לא ניתן לפענח את קובץ הקבלה כעת.");
      }

      setLoadingStep("מעבד ומחלץ את נתוני התשלום...");
      const result = await response.json();

      if (result.success && result.data) {
        setLoadingStep("משלים פענוח פיננסי...");
        setTimeout(() => {
          onScanComplete({
            date: result.data.date || new Date().toISOString().split('T')[0],
            description: result.data.description || file.name.split('.')[0],
            category: result.data.category || 'אחר',
            costPerItem: parseFloat(result.data.costPerItem) || 0,
            quantity: parseInt(result.data.quantity) || 1,
            totalCost: parseFloat(result.data.totalCost) || parseFloat(result.data.costPerItem) || 0,
            receiptBase64: base64Data,
            receiptName: file.name,
            receiptType: file.type,
          });
          setSuccess(true);
          setLoading(false);
        }, 500);
      } else {
        throw new Error("קובץ לא קריא או שלא נמצאו נתונים מתאימים.");
      }

    } catch (err: any) {
      console.error("Receipt Scanning Error:", err);
      setError(err.message || "פענוח הקבלה נכשל. ודא שהתמונה ברורה ומלא את הפרטים ידנית.");
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
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 ${
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
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="relative">
              <Loader2 className="animate-spin h-10 w-10 text-blue-900" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-500 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{loadingStep}</p>
              <p className="text-xs text-slate-400 mt-1">מנוע הבינה המלאכותית מפענח פריטים, מחירים ותאריכים</p>
            </div>
            
            {/* Visual Laser Scan Effect */}
            {preview && (
              <div className="relative mt-4 w-32 h-32 mx-auto overflow-hidden rounded-lg border border-slate-200">
                <img src={preview} alt="Scanning preview" className="w-full h-full object-cover filter blur-[0.5px]" referrerPolicy="no-referrer" />
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-900 shadow-md shadow-blue-400 animate-[bounce_2s_infinite]"></div>
              </div>
            )}
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <CheckCircle className="h-10 w-10 text-blue-900" />
            <p className="text-sm font-bold text-slate-800">הפענוח הושלם בהצלחה!</p>
            <p className="text-xs text-slate-400">כל השדות בטופס מולאו אוטומטית מתוך מסמך הקבלה</p>
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
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md">
                <Sparkles className="h-3 w-3 text-blue-900" />
                סורק Gemini מופעל
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div id="scanner-error-message" className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5 font-semibold">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">הסריקה נכשלה</p>
            <p className="text-rose-600 text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
