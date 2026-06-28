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
  id: string; // custom ID, e.g. "period-12345" or YYYY-MM-DD
  weekLabel: string; // e.g., "דיווח לתאריך DD/MM/YYYY"
  date: string; // YYYY-MM-DD - the single date of the report
  startDate?: string; // backwards compatibility
  endDate?: string; // backwards compatibility
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

export interface BrandConfig {
  logoUrl?: string;
  orgName: string;
  adminEmail?: string;
  adminPassword?: string;
}

