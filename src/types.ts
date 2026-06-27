export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  costPerItem: number;
  quantity: number;
  totalCost: number;
  receiptBase64?: string; // Stored securely in Firestore
  receiptName?: string;
  receiptType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPeriod {
  id: string; // usually week starting date or custom ID, e.g. "2026-W26" or YYYY-MM-DD
  weekLabel: string; // e.g., "Week of June 21, 2026 - June 27, 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'archived';
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Office Supplies'
  | 'Travel & Transportation'
  | 'Operational Cost'
  | 'Events & Activities'
  | 'Salaries & Benefits'
  | 'Marketing & PR'
  | 'Food & Catering'
  | 'Maintenance & Repairs'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Office Supplies',
  'Travel & Transportation',
  'Operational Cost',
  'Events & Activities',
  'Salaries & Benefits',
  'Marketing & PR',
  'Food & Catering',
  'Maintenance & Repairs',
  'Other',
];

export interface AppUser {
  uid: string;
  email: string;
  role: 'admin' | 'viewer';
  displayName?: string;
}
