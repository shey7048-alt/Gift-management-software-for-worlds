import { useState, useEffect } from 'react';
import { 
  isFirebaseAvailable, db, auth, onAuthStateChanged, signOut,
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, where 
} from './firebase';
import { WeeklyPeriod, Expense, BrandConfig } from './types';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import WeeklyPeriodModal from './components/WeeklyPeriodModal';
import ExpenseModal from './components/ExpenseModal';
import BrandSettingsModal from './components/BrandSettingsModal';
import Logo from './components/Logo';
import { Building, Sparkles } from 'lucide-react';

// Seed initial data in case local storage and Firebase are empty
const SEED_PERIODS: WeeklyPeriod[] = [
  {
    id: 'period-2026-w26',
    weekLabel: 'דיווח לתאריך 24.06.2026',
    date: '2026-06-24',
    startDate: '2026-06-24',
    endDate: '2026-06-24',
    status: 'active',
    notes: 'הוצאות שוטפות ורכישת ציוד משרדי.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'period-2026-w25',
    weekLabel: 'דיווח לתאריך 15.06.2026',
    date: '2026-06-15',
    startDate: '2026-06-15',
    endDate: '2026-06-15',
    status: 'archived',
    notes: 'אירוע הדרכה ואירוח מרצים.',
    createdAt: new Date().toISOString()
  }
];

const SEED_EXPENSES: { [periodId: string]: Expense[] } = {
  'period-2026-w26': [
    {
      id: 'exp-1',
      date: '2026-06-22',
      description: 'ניירות צילום משרדיים וקלסרי תיוק שוטפים',
      category: 'ציוד משרדי',
      costPerItem: 12.50,
      quantity: 4,
      totalCost: 50.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'exp-2',
      date: '2026-06-24',
      description: 'כיבוד ואירוח כשר לכנס מנהלים שנתי',
      category: 'מזון וכיבוד',
      costPerItem: 380.00,
      quantity: 1,
      totalCost: 380.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'exp-3',
      date: '2026-06-25',
      description: 'הדפסת פליירים, הזמנות וברושורים לאירוע',
      category: 'שיווק ויחסי ציבור',
      costPerItem: 1.20,
      quantity: 150,
      totalCost: 180.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  'period-2026-w25': [
    {
      id: 'exp-4',
      date: '2026-06-15',
      description: 'פיקדון להשכרת אולם קהילתי ועלויות ניקיון',
      category: 'עלויות תפעול',
      costPerItem: 500.00,
      quantity: 1,
      totalCost: 500.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'exp-5',
      date: '2026-06-16',
      description: 'החזר נסיעות למרצים אורחים ומנחים',
      category: 'נסיעות ותחבורה',
      costPerItem: 125.00,
      quantity: 2,
      totalCost: 250.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core records state (loaded instantly from cache with background Firestore sync)
  const [periods, setPeriods] = useState<WeeklyPeriod[]>(() => {
    const cached = localStorage.getItem('shai_olamot_periods');
    return cached ? JSON.parse(cached) : [];
  });
  const [expenses, setExpenses] = useState<{ [periodId: string]: Expense[] }>(() => {
    const cached = localStorage.getItem('shai_olamot_expenses');
    return cached ? JSON.parse(cached) : {};
  });
  const [dbLoading, setDbLoading] = useState(false);

  // Helper to dynamically calculate active vs archived status for all periods
  const getPeriodsWithCalculatedStatus = (allPeriods: WeeklyPeriod[]): WeeklyPeriod[] => {
    if (allPeriods.length === 0) return [];
    
    // Sort all periods by date descending (latest date first)
    const sorted = [...allPeriods].sort((a, b) => {
      const dateA = a.date || a.startDate || '';
      const dateB = b.date || b.startDate || '';
      return dateB.localeCompare(dateA);
    });
    
    const latestId = sorted[0].id;
    
    return allPeriods.map(p => ({
      ...p,
      status: p.id === latestId ? 'active' : 'archived' as 'active' | 'archived'
    }));
  };

  // Brand config state
  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    logoUrl: localStorage.getItem('shai_olamot_logo_url') || 'https://raw.githubusercontent.com/shey3132/-22/refs/heads/main/%D7%9C%D7%95%D7%92%D7%95%20%D7%A9%D7%99%20%D7%A2%D7%95%D7%9C%D7%9E%D7%95%D7%AA.png',
    orgName: localStorage.getItem('shai_olamot_org_name') || 'עולמות',
    adminEmail: 'shey7048@gmail.com',
    adminPassword: '1234'
  });
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Modals state
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<WeeklyPeriod | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedPeriodForExpense, setSelectedPeriodForExpense] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Load Brand Config on Mount (Available before and after login)
  useEffect(() => {
    const loadBrandConfig = async () => {
      if (isFirebaseAvailable && db) {
        try {
          const brandDoc = await getDoc(doc(db, 'settings', 'brand'));
          if (brandDoc.exists()) {
            const data = brandDoc.data() as BrandConfig;
            setBrandConfig(prev => ({ ...prev, ...data }));
            if (data.logoUrl) {
              localStorage.setItem('shai_olamot_logo_url', data.logoUrl);
            } else {
              localStorage.removeItem('shai_olamot_logo_url');
            }
            localStorage.setItem('shai_olamot_org_name', data.orgName || 'עולמות');
          } else {
            // Document does not exist yet. Seed/Initialize the brand settings document!
            const initialBrand: BrandConfig = {
              orgName: 'עולמות',
              logoUrl: 'https://raw.githubusercontent.com/shey3132/-22/refs/heads/main/%D7%9C%D7%95%D7%92%D7%95%20%D7%A9%D7%99%20%D7%A2%D7%95%D7%9C%D7%9E%D7%95%D7%AA.png',
              adminEmail: 'shey7048@gmail.com',
              adminPassword: '1234'
            };
            await setDoc(doc(db, 'settings', 'brand'), initialBrand);
            setBrandConfig(initialBrand);
            localStorage.setItem('shai_olamot_logo_url', initialBrand.logoUrl || '');
            localStorage.setItem('shai_olamot_org_name', initialBrand.orgName);
          }
        } catch (brandError) {
          console.error("Error loading brand config:", brandError);
        }
      }
    };
    loadBrandConfig();
  }, []);

  // Authenticate monitor
  useEffect(() => {
    const cachedUser = localStorage.getItem('shai_olamot_cached_user');
    const parsedCachedUser = cachedUser ? JSON.parse(cachedUser) : null;

    if (isFirebaseAvailable && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
          });
        } else {
          if (parsedCachedUser && parsedCachedUser.uid === 'admin-uid') {
            setUser(parsedCachedUser);
          } else {
            setUser(null);
          }
        }
        setAuthLoading(false);
      });
      return unsubscribe;
    } else {
      // Offline fallback checks
      if (parsedCachedUser) {
        setUser(parsedCachedUser);
      }
      setAuthLoading(false);
    }
  }, []);

  // Fetch Firestore or local records on login
  useEffect(() => {
    if (!user) {
      setPeriods([]);
      setExpenses({});
      return;
    }

    const loadAppData = async () => {
      setDbLoading(true);
      try {
        if (isFirebaseAvailable && db) {
          console.log("Loading live data from Firestore...");
          // Load Weekly Periods
          const periodsRef = collection(db, 'weeklyPeriods');
          const periodsSnap = await getDocs(periodsRef);
          
          let loadedPeriods: WeeklyPeriod[] = [];
          periodsSnap.forEach((docSnap) => {
            const data = docSnap.data();
            loadedPeriods.push({ 
              id: docSnap.id, 
              ...data,
              date: data.date || data.startDate || '2026-06-24'
            } as WeeklyPeriod);
          });

          // Load Expenses
          const expensesRef = collection(db, 'expenses');
          const expensesSnap = await getDocs(expensesRef);
          
          const loadedExpenses: { [periodId: string]: Expense[] } = {};
          expensesSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const exp = { id: docSnap.id, ...data } as Expense & { periodId: string };
            if (exp.periodId) {
              if (!loadedExpenses[exp.periodId]) {
                loadedExpenses[exp.periodId] = [];
              }
              loadedExpenses[exp.periodId].push(exp);
            }
          });

          // If Firestore is completely empty, seed it with initial values!
          if (loadedPeriods.length === 0) {
            console.log("Firestore database is empty. Seeding initial records...");
            
            const processedSeeds = getPeriodsWithCalculatedStatus(SEED_PERIODS);
            
            // Write seed periods
            for (const p of processedSeeds) {
              const cleaned = JSON.parse(JSON.stringify(p));
              await setDoc(doc(db, 'weeklyPeriods', p.id), cleaned);
            }

            // Write seed expenses
            for (const [periodId, expList] of Object.entries(SEED_EXPENSES)) {
              for (const e of expList) {
                const cleaned = JSON.parse(JSON.stringify({ ...e, periodId }));
                await setDoc(doc(db, 'expenses', e.id), cleaned);
              }
            }

            setPeriods(processedSeeds);
            setExpenses(SEED_EXPENSES);
            localStorage.setItem('shai_olamot_periods', JSON.stringify(processedSeeds));
            localStorage.setItem('shai_olamot_expenses', JSON.stringify(SEED_EXPENSES));
          } else {
            const processedPeriods = getPeriodsWithCalculatedStatus(loadedPeriods);
            setPeriods(processedPeriods);
            setExpenses(loadedExpenses);
            localStorage.setItem('shai_olamot_periods', JSON.stringify(processedPeriods));
            localStorage.setItem('shai_olamot_expenses', JSON.stringify(loadedExpenses));
          }

          // Load Brand Config
          try {
            const brandDoc = await getDoc(doc(db, 'settings', 'brand'));
            if (brandDoc.exists()) {
              const data = brandDoc.data() as BrandConfig;
              setBrandConfig(prev => ({ ...prev, ...data }));
              if (data.logoUrl) {
                localStorage.setItem('shai_olamot_logo_url', data.logoUrl);
              } else {
                localStorage.removeItem('shai_olamot_logo_url');
              }
              localStorage.setItem('shai_olamot_org_name', data.orgName || 'עולמות');
            }
          } catch (brandError) {
            console.error("Error loading brand config:", brandError);
          }
        } else {
          // Local storage fallback
          console.log("Loading data from local storage fallback...");
          const cachedPeriods = localStorage.getItem('shai_olamot_periods');
          const cachedExpenses = localStorage.getItem('shai_olamot_expenses');

          if (cachedPeriods && cachedExpenses) {
            const parsedPeriods = JSON.parse(cachedPeriods).map((p: any) => ({
              ...p,
              date: p.date || p.startDate || '2026-06-24'
            }));
            const processedPeriods = getPeriodsWithCalculatedStatus(parsedPeriods);
            setPeriods(processedPeriods);
            setExpenses(JSON.parse(cachedExpenses));
          } else {
            const processedSeeds = getPeriodsWithCalculatedStatus(SEED_PERIODS);
            localStorage.setItem('shai_olamot_periods', JSON.stringify(processedSeeds));
            localStorage.setItem('shai_olamot_expenses', JSON.stringify(SEED_EXPENSES));
            setPeriods(processedSeeds);
            setExpenses(SEED_EXPENSES);
          }
        }
      } catch (err) {
        console.error("Failed to load application data:", err);
      } finally {
        setDbLoading(false);
      }
    };

    loadAppData();
  }, [user]);

  const handleLoginSuccess = (loggedInUser: { uid: string; email: string; displayName?: string }) => {
    setUser(loggedInUser);
    localStorage.setItem('shai_olamot_cached_user', JSON.stringify(loggedInUser));
  };

  const handleSaveBrandConfig = async (newConfig: BrandConfig) => {
    setBrandConfig(newConfig);
    if (newConfig.logoUrl) {
      localStorage.setItem('shai_olamot_logo_url', newConfig.logoUrl);
    } else {
      localStorage.removeItem('shai_olamot_logo_url');
    }
    localStorage.setItem('shai_olamot_org_name', newConfig.orgName);

    if (isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, 'settings', 'brand'), newConfig);
      } catch (err) {
        console.error("Failed to save brand config to Firestore:", err);
      }
    }
  };

  const handleLogout = async () => {
    if (isFirebaseAvailable && auth) {
      await signOut(auth);
    }
    setUser(null);
    localStorage.removeItem('shai_olamot_cached_user');
  };

  // Weekly Periods triggers
  const handleSavePeriod = async (periodData: Omit<WeeklyPeriod, 'id' | 'createdAt'>) => {
    const id = editingPeriod ? editingPeriod.id : `period-${Date.now()}`;
    const newPeriod: WeeklyPeriod = {
      id,
      weekLabel: periodData.weekLabel,
      date: periodData.date,
      startDate: periodData.date,
      endDate: periodData.date,
      status: periodData.status,
      notes: periodData.notes,
      createdAt: editingPeriod ? editingPeriod.createdAt : new Date().toISOString()
    };

    const rawUpdatedPeriods = editingPeriod
      ? periods.map(p => p.id === id ? newPeriod : p)
      : [...periods, newPeriod];

    const processedPeriods = getPeriodsWithCalculatedStatus(rawUpdatedPeriods);
    setPeriods(processedPeriods);

    // Save to localStorage
    localStorage.setItem('shai_olamot_periods', JSON.stringify(processedPeriods));

    // Persist to Firestore
    if (isFirebaseAvailable && db) {
      try {
        for (const p of processedPeriods) {
          // Clean undefined fields to avoid Firestore errors
          const cleaned = JSON.parse(JSON.stringify(p));
          await setDoc(doc(db, 'weeklyPeriods', p.id), cleaned);
        }
      } catch (err) {
        console.error("Failed to save periods to Firestore:", err);
      }
    }

    setEditingPeriod(null);
  };

  const handleDeletePeriod = async (periodId: string) => {
    const rawUpdatedPeriods = periods.filter(p => p.id !== periodId);
    const processedPeriods = getPeriodsWithCalculatedStatus(rawUpdatedPeriods);
    setPeriods(processedPeriods);

    const updatedExpenses = { ...expenses };
    const expensesToDelete = updatedExpenses[periodId] || [];
    delete updatedExpenses[periodId];
    setExpenses(updatedExpenses);

    // Save to localStorage
    localStorage.setItem('shai_olamot_periods', JSON.stringify(processedPeriods));
    localStorage.setItem('shai_olamot_expenses', JSON.stringify(updatedExpenses));

    // Persist to Firestore
    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, 'weeklyPeriods', periodId));
        for (const exp of expensesToDelete) {
          await deleteDoc(doc(db, 'expenses', exp.id));
        }
        for (const p of processedPeriods) {
          const cleaned = JSON.parse(JSON.stringify(p));
          await setDoc(doc(db, 'weeklyPeriods', p.id), cleaned);
        }
      } catch (err) {
        console.error("Failed to delete period or update statuses in Firestore:", err);
      }
    }
  };

  const handleArchivePeriod = async (periodId: string, status: 'active' | 'archived') => {
    const updatedPeriods = periods.map(p => p.id === periodId ? { ...p, status } : p);
    const processedPeriods = getPeriodsWithCalculatedStatus(updatedPeriods);
    setPeriods(processedPeriods);

    localStorage.setItem('shai_olamot_periods', JSON.stringify(processedPeriods));

    if (isFirebaseAvailable && db) {
      try {
        for (const p of processedPeriods) {
          const cleaned = JSON.parse(JSON.stringify(p));
          await setDoc(doc(db, 'weeklyPeriods', p.id), cleaned);
        }
      } catch (err) {
        console.error("Failed to update periods status in Firestore:", err);
      }
    }
  };

  // Expenses operations
  const handleSaveExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedPeriodForExpense) return;

    const id = editingExpense ? editingExpense.id : `exp-${Date.now()}`;
    const newExpense: Expense = {
      id,
      date: expenseData.date,
      description: expenseData.description,
      category: expenseData.category,
      costPerItem: expenseData.costPerItem,
      quantity: expenseData.quantity,
      totalCost: expenseData.totalCost,
      receiptBase64: expenseData.receiptBase64,
      receiptName: expenseData.receiptName,
      receiptType: expenseData.receiptType,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentPeriodExpenses = expenses[selectedPeriodForExpense] || [];
    const updatedPeriodExpenses = editingExpense
      ? currentPeriodExpenses.map(e => e.id === id ? newExpense : e)
      : [...currentPeriodExpenses, newExpense];

    const updatedExpenses = {
      ...expenses,
      [selectedPeriodForExpense]: updatedPeriodExpenses
    };

    setExpenses(updatedExpenses);

    // Save to localStorage
    localStorage.setItem('shai_olamot_expenses', JSON.stringify(updatedExpenses));

    // Persist to Firestore
    if (isFirebaseAvailable && db) {
      try {
        const cleaned = JSON.parse(JSON.stringify({ 
          ...newExpense, 
          periodId: selectedPeriodForExpense 
        }));
        await setDoc(doc(db, 'expenses', id), cleaned);
      } catch (err) {
        console.error("Failed to save expense to Firestore:", err);
      }
    }

    setEditingExpense(null);
    setSelectedPeriodForExpense(null);
  };

  const handleDeleteExpense = async (periodId: string, expenseId: string) => {
    const currentPeriodExpenses = expenses[periodId] || [];
    const updatedPeriodExpenses = currentPeriodExpenses.filter(e => e.id !== expenseId);
    
    const updatedExpenses = {
      ...expenses,
      [periodId]: updatedPeriodExpenses
    };

    setExpenses(updatedExpenses);

    // Save to localStorage
    localStorage.setItem('shai_olamot_expenses', JSON.stringify(updatedExpenses));

    // Persist to Firestore
    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, 'expenses', expenseId));
      } catch (err) {
        console.error("Failed to delete expense from Firestore:", err);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Logo brandConfig={brandConfig} className="h-20 w-20 shadow-xl shadow-slate-100 animate-bounce" iconClassName="h-10 w-10" />
        <p className="text-sm font-semibold text-slate-700">Loading {brandConfig.orgName} Portal...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen brandConfig={brandConfig} onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedPeriodObj = periods.find(p => p.id === selectedPeriodForExpense);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
      <Navbar 
        user={user} 
        brandConfig={brandConfig} 
        onEditBrand={() => setIsBrandModalOpen(true)} 
        onLogout={handleLogout} 
      />

      {dbLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-500 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Synchronizing database logs...</p>
        </div>
      ) : (
        <main className="flex-1">
          <Dashboard
            periods={periods}
            expenses={expenses}
            onAddPeriod={() => {
              setEditingPeriod(null);
              setIsPeriodModalOpen(true);
            }}
            onEditPeriod={(period) => {
              setEditingPeriod(period);
              setIsPeriodModalOpen(true);
            }}
            onDeletePeriod={handleDeletePeriod}
            onArchivePeriod={handleArchivePeriod}
            onAddExpense={(periodId) => {
              setSelectedPeriodForExpense(periodId);
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(periodId, expense) => {
              setSelectedPeriodForExpense(periodId);
              setEditingExpense(expense);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        </main>
      )}

      {/* Modals */}
      <WeeklyPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => {
          setIsPeriodModalOpen(false);
          setEditingPeriod(null);
        }}
        onSave={handleSavePeriod}
        initialPeriod={editingPeriod || undefined}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedPeriodForExpense(null);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialExpense={editingExpense || undefined}
        weekLabel={selectedPeriodObj ? selectedPeriodObj.weekLabel : ''}
      />

      <BrandSettingsModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        brandConfig={brandConfig}
        onSave={handleSaveBrandConfig}
      />
    </div>
  );
}
