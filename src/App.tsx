import { useState, useEffect } from 'react';
import { 
  isFirebaseAvailable, db, auth, onAuthStateChanged, signOut,
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, where 
} from './firebase';
import { WeeklyPeriod, Expense } from './types';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import WeeklyPeriodModal from './components/WeeklyPeriodModal';
import ExpenseModal from './components/ExpenseModal';
import { Building, Sparkles } from 'lucide-react';

// Seed initial data in case local storage and Firebase are empty
const SEED_PERIODS: WeeklyPeriod[] = [
  {
    id: 'period-2026-w26',
    weekLabel: 'Week of Jun 21 - Jun 27, 2026',
    startDate: '2026-06-21',
    endDate: '2026-06-27',
    status: 'active',
    notes: 'Summertime operational log and community setup expenses.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'period-2026-w25',
    weekLabel: 'Week of Jun 14 - Jun 20, 2026',
    startDate: '2026-06-14',
    endDate: '2026-06-20',
    status: 'archived',
    notes: 'Organizational training weekend expenses.',
    createdAt: new Date().toISOString()
  }
];

const SEED_EXPENSES: { [periodId: string]: Expense[] } = {
  'period-2026-w26': [
    {
      id: 'exp-1',
      date: '2026-06-22',
      description: 'Office printing papers and operational folders',
      category: 'Office Supplies',
      costPerItem: 12.50,
      quantity: 4,
      totalCost: 50.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'exp-2',
      date: '2026-06-24',
      description: 'Summit setup refreshments & kosher catering',
      category: 'Food & Catering',
      costPerItem: 380.00,
      quantity: 1,
      totalCost: 380.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'exp-3',
      date: '2026-06-25',
      description: 'Event invitation brochures & printing',
      category: 'Marketing & PR',
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
      description: 'Community venue deposit & operational cleanup',
      category: 'Operational Cost',
      costPerItem: 500.00,
      quantity: 1,
      totalCost: 500.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'exp-5',
      date: '2026-06-16',
      description: 'Public speakers travel reimbursements',
      category: 'Travel & Transportation',
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

  // Core records state
  const [periods, setPeriods] = useState<WeeklyPeriod[]>([]);
  const [expenses, setExpenses] = useState<{ [periodId: string]: Expense[] }>({});
  const [dbLoading, setDbLoading] = useState(false);

  // Modals state
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<WeeklyPeriod | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedPeriodForExpense, setSelectedPeriodForExpense] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Authenticate monitor
  useEffect(() => {
    if (isFirebaseAvailable && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
          });
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      });
      return unsubscribe;
    } else {
      // Offline / sandbox mode checks
      const cachedUser = localStorage.getItem('shai_olamot_cached_user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
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
            loadedPeriods.push({ id: docSnap.id, ...docSnap.data() } as WeeklyPeriod);
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
            
            // Write seed periods
            for (const p of SEED_PERIODS) {
              await setDoc(doc(db, 'weeklyPeriods', p.id), p);
            }

            // Write seed expenses
            for (const [periodId, expList] of Object.entries(SEED_EXPENSES)) {
              for (const e of expList) {
                await setDoc(doc(db, 'expenses', e.id), { ...e, periodId });
              }
            }

            setPeriods(SEED_PERIODS);
            setExpenses(SEED_EXPENSES);
          } else {
            setPeriods(loadedPeriods);
            setExpenses(loadedExpenses);
          }
        } else {
          // Local storage fallback
          console.log("Loading data from local storage fallback...");
          const cachedPeriods = localStorage.getItem('shai_olamot_periods');
          const cachedExpenses = localStorage.getItem('shai_olamot_expenses');

          if (cachedPeriods && cachedExpenses) {
            setPeriods(JSON.parse(cachedPeriods));
            setExpenses(JSON.parse(cachedExpenses));
          } else {
            // Seed localStorage
            localStorage.setItem('shai_olamot_periods', JSON.stringify(SEED_PERIODS));
            localStorage.setItem('shai_olamot_expenses', JSON.stringify(SEED_EXPENSES));
            setPeriods(SEED_PERIODS);
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
      startDate: periodData.startDate,
      endDate: periodData.endDate,
      status: periodData.status,
      notes: periodData.notes,
      createdAt: editingPeriod ? editingPeriod.createdAt : new Date().toISOString()
    };

    const updatedPeriods = editingPeriod
      ? periods.map(p => p.id === id ? newPeriod : p)
      : [...periods, newPeriod];

    setPeriods(updatedPeriods);

    // Persist
    if (isFirebaseAvailable && db) {
      await setDoc(doc(db, 'weeklyPeriods', id), newPeriod);
    } else {
      localStorage.setItem('shai_olamot_periods', JSON.stringify(updatedPeriods));
    }

    setEditingPeriod(null);
  };

  const handleDeletePeriod = async (periodId: string) => {
    const updatedPeriods = periods.filter(p => p.id !== periodId);
    setPeriods(updatedPeriods);

    const updatedExpenses = { ...expenses };
    const expensesToDelete = updatedExpenses[periodId] || [];
    delete updatedExpenses[periodId];
    setExpenses(updatedExpenses);

    // Persist
    if (isFirebaseAvailable && db) {
      await deleteDoc(doc(db, 'weeklyPeriods', periodId));
      for (const exp of expensesToDelete) {
        await deleteDoc(doc(db, 'expenses', exp.id));
      }
    } else {
      localStorage.setItem('shai_olamot_periods', JSON.stringify(updatedPeriods));
      localStorage.setItem('shai_olamot_expenses', JSON.stringify(updatedExpenses));
    }
  };

  const handleArchivePeriod = async (periodId: string, status: 'active' | 'archived') => {
    const updatedPeriods = periods.map(p => p.id === periodId ? { ...p, status } : p);
    setPeriods(updatedPeriods);

    // Persist
    if (isFirebaseAvailable && db) {
      await updateDoc(doc(db, 'weeklyPeriods', periodId), { status });
    } else {
      localStorage.setItem('shai_olamot_periods', JSON.stringify(updatedPeriods));
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

    // Persist
    if (isFirebaseAvailable && db) {
      await setDoc(doc(db, 'expenses', id), { 
        ...newExpense, 
        periodId: selectedPeriodForExpense 
      });
    } else {
      localStorage.setItem('shai_olamot_expenses', JSON.stringify(updatedExpenses));
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

    // Persist
    if (isFirebaseAvailable && db) {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } else {
      localStorage.setItem('shai_olamot_expenses', JSON.stringify(updatedExpenses));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="bg-emerald-600 text-white p-4 rounded-3xl shadow-lg animate-bounce">
          <Building className="h-10 w-10" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Loading Shai Olamot Portal...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedPeriodObj = periods.find(p => p.id === selectedPeriodForExpense);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
      <Navbar user={user} onLogout={handleLogout} />

      {dbLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
    </div>
  );
}
