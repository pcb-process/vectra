"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Budget,
  Category,
  DEFAULT_CATEGORIES,
  getInitialDemoBudgets,
  getInitialDemoTransactions,
  Transaction,
  TransactionType,
} from "@/types/finance";
import { CategoryIcon } from "@/components/CategoryIcon";
import { TransactionModal } from "@/components/TransactionModal";
import { AuthModal } from "@/components/AuthModal";
import { MatrixRainBackground } from "@/components/MatrixRainBackground";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Plus,
  Search,
  Pencil,
  Trash2,
  Cloud,
  Sparkles,
  LogIn,
  LogOut,
  RefreshCw,
  Database,
  Target,
  CheckCircle2,
  Calendar,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote,
  FileText,
  Tag,
  BellRing,
  BarChart3,
  PieChart as PieChartIcon,
  Receipt,
  Layers,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Coins,
  PlusCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatThaiMonthYear(monthYear: string): string {
  const [yearStr, monthStr] = monthYear.split("-");
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (isNaN(year) || monthIdx < 0 || monthIdx > 11) return monthYear;
  return `${THAI_MONTHS[monthIdx]} ${year + 543}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMonthDateRange(monthYear: string): { start: string; end: string } {
  const [yStr, mStr] = monthYear.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${monthYear}-01`,
    end: `${monthYear}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default function SmartFinanceOnePageApp() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 1-Page Quick Add inline state
  const [quickType, setQuickType] = useState<TransactionType>("expense");
  const [quickCategoryId, setQuickCategoryId] = useState<number>(8);
  const [quickAmount, setQuickAmount] = useState<string>("");
  const [quickNote, setQuickNote] = useState<string>("");
  const [quickDate, setQuickDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [quickSaving, setQuickSaving] = useState<boolean>(false);

  // 1-Page Inline Budget state
  const [budgetCatId, setBudgetCatId] = useState<number>(8);
  const [budgetLimit, setBudgetLimit] = useState<string>("6000");
  const [budgetThreshold, setBudgetThreshold] = useState<string>("80");
  const [budgetSaving, setBudgetSaving] = useState<boolean>(false);

  // 1-Page Transaction Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const isDemoMode = !userId;

  // Sync quickDate when month changes
  useEffect(() => {
    const currentYM = getCurrentYearMonth();
    if (selectedMonth === currentYM) {
      setQuickDate(new Date().toISOString().slice(0, 10));
    } else {
      setQuickDate(`${selectedMonth}-01`);
    }
  }, [selectedMonth]);

  // Check Supabase auth session
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load categories, transactions, and budgets
  const loadFinanceData = useCallback(async () => {
    setLoadingData(true);
    try {
      const supabase = createClient();

      const { data: catData } = await supabase
        .from("finance_categories")
        .select("*")
        .order("id", { ascending: true });

      if (catData && catData.length > 0) {
        const neonMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.name, c.color]));
        const enhanced = (catData as Category[]).map((c) => ({
          ...c,
          color: neonMap.get(c.name) || c.color || "#00ff41",
        }));
        setCategories(enhanced);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      if (userId) {
        const { start, end } = getMonthDateRange(selectedMonth);

        const [txRes, budgetRes] = await Promise.all([
          supabase
            .from("finance_transactions")
            .select("*")
            .eq("user_id", userId)
            .gte("transaction_date", start)
            .lte("transaction_date", end)
            .order("transaction_date", { ascending: false })
            .order("id", { ascending: false }),
          supabase
            .from("finance_budgets")
            .select("*")
            .eq("user_id", userId)
            .eq("month_year", selectedMonth)
            .order("id", { ascending: true }),
        ]);

        setTransactions((txRes.data as Transaction[]) || []);
        setBudgets((budgetRes.data as Budget[]) || []);
      } else {
        const txKey = `spf_demo_tx_${selectedMonth}`;
        const bgKey = `spf_demo_bg_${selectedMonth}`;
        const savedTx = localStorage.getItem(txKey);
        const savedBg = localStorage.getItem(bgKey);

        if (savedTx) {
          setTransactions(JSON.parse(savedTx));
        } else {
          const initialTx = getInitialDemoTransactions(selectedMonth);
          localStorage.setItem(txKey, JSON.stringify(initialTx));
          setTransactions(initialTx);
        }

        if (savedBg) {
          setBudgets(JSON.parse(savedBg));
        } else {
          const initialBg = getInitialDemoBudgets(selectedMonth);
          localStorage.setItem(bgKey, JSON.stringify(initialBg));
          setBudgets(initialBg);
        }
      }
    } finally {
      setLoadingData(false);
    }
  }, [userId, selectedMonth]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Save or update transaction
  const handleSaveTransaction = async (payload: {
    id?: number;
    type: TransactionType;
    category_id: number;
    amount: number;
    note: string;
    transaction_date: string;
  }) => {
    if (userId) {
      const supabase = createClient();
      if (payload.id) {
        await supabase
          .from("finance_transactions")
          .update({
            type: payload.type,
            category_id: payload.category_id,
            amount: payload.amount,
            note: payload.note,
            transaction_date: payload.transaction_date,
          })
          .eq("id", payload.id)
          .eq("user_id", userId);
      } else {
        await supabase.from("finance_transactions").insert({
          user_id: userId,
          type: payload.type,
          category_id: payload.category_id,
          amount: payload.amount,
          note: payload.note,
          transaction_date: payload.transaction_date,
        });
      }
      await loadFinanceData();
    } else {
      const txKey = `spf_demo_tx_${selectedMonth}`;
      let updated: Transaction[];
      if (payload.id) {
        updated = transactions.map((t) =>
          t.id === payload.id
            ? {
                ...t,
                type: payload.type,
                category_id: payload.category_id,
                amount: payload.amount,
                note: payload.note,
                transaction_date: payload.transaction_date,
              }
            : t
        );
      } else {
        const newTx: Transaction = {
          id: Date.now(),
          user_id: "demo-user",
          type: payload.type,
          category_id: payload.category_id,
          amount: payload.amount,
          note: payload.note,
          transaction_date: payload.transaction_date,
        };
        updated = [newTx, ...transactions];
      }
      localStorage.setItem(txKey, JSON.stringify(updated));
      setTransactions(updated);
    }
  };

  // Inline Quick Add submit
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(quickAmount);
    if (isNaN(num) || num <= 0) return;
    setQuickSaving(true);
    try {
      await handleSaveTransaction({
        type: quickType,
        category_id: quickCategoryId,
        amount: num,
        note: quickNote.trim(),
        transaction_date: quickDate,
      });
      setQuickAmount("");
      setQuickNote("");
    } finally {
      setQuickSaving(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: number) => {
    if (userId) {
      const supabase = createClient();
      await supabase
        .from("finance_transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      await loadFinanceData();
    } else {
      const txKey = `spf_demo_tx_${selectedMonth}`;
      const updated = transactions.filter((t) => t.id !== id);
      localStorage.setItem(txKey, JSON.stringify(updated));
      setTransactions(updated);
    }
  };

  // Upsert budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(budgetLimit);
    const thresholdNum = parseFloat(budgetThreshold);
    if (isNaN(limitNum) || limitNum <= 0) return;

    setBudgetSaving(true);
    try {
      const cleanThreshold = isNaN(thresholdNum)
        ? 80
        : Math.min(100, Math.max(10, thresholdNum));

      if (userId) {
        const supabase = createClient();
        await supabase.from("finance_budgets").upsert(
          {
            user_id: userId,
            category_id: budgetCatId,
            month_year: selectedMonth,
            amount_limit: limitNum,
            alert_threshold: cleanThreshold,
          },
          { onConflict: "user_id,category_id,month_year" }
        );
        await loadFinanceData();
      } else {
        const bgKey = `spf_demo_bg_${selectedMonth}`;
        const existingIdx = budgets.findIndex(
          (b) => b.category_id === budgetCatId && b.month_year === selectedMonth
        );
        let updated: Budget[];
        if (existingIdx >= 0) {
          updated = budgets.map((b, i) =>
            i === existingIdx
              ? { ...b, amount_limit: limitNum, alert_threshold: cleanThreshold }
              : b
          );
        } else {
          updated = [
            ...budgets,
            {
              id: Date.now(),
              user_id: "demo-user",
              category_id: budgetCatId,
              month_year: selectedMonth,
              amount_limit: limitNum,
              alert_threshold: cleanThreshold,
            },
          ];
        }
        localStorage.setItem(bgKey, JSON.stringify(updated));
        setBudgets(updated);
      }
    } finally {
      setBudgetSaving(false);
    }
  };

  // Delete budget
  const handleDeleteBudget = async (id: number) => {
    if (userId) {
      const supabase = createClient();
      await supabase.from("finance_budgets").delete().eq("id", id).eq("user_id", userId);
      await loadFinanceData();
    } else {
      const bgKey = `spf_demo_bg_${selectedMonth}`;
      const updated = budgets.filter((b) => b.id !== id);
      localStorage.setItem(bgKey, JSON.stringify(updated));
      setBudgets(updated);
    }
  };

  // Seed sample data to Supabase Cloud
  const handleSeedCloudSampleData = async () => {
    if (!userId) return;
    setLoadingData(true);
    try {
      const supabase = createClient();
      const sampleTx = getInitialDemoTransactions(selectedMonth).map((t) => ({
        user_id: userId,
        category_id: t.category_id,
        type: t.type,
        amount: t.amount,
        note: t.note,
        transaction_date: t.transaction_date,
      }));
      const sampleBg = getInitialDemoBudgets(selectedMonth).map((b) => ({
        user_id: userId,
        category_id: b.category_id,
        month_year: b.month_year,
        amount_limit: b.amount_limit,
        alert_threshold: b.alert_threshold,
      }));

      await supabase.from("finance_transactions").insert(sampleTx);
      await supabase
        .from("finance_budgets")
        .upsert(sampleBg, { onConflict: "user_id,category_id,month_year" });
      await loadFinanceData();
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserId(null);
    setUserEmail(null);
  };

  // Maps & Aggregations
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const { totalIncome, totalExpense, netBalance, savingsRate } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === "income") income += Number(tx.amount);
      else expense += Number(tx.amount);
    }
    const net = income - expense;
    const rate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: net,
      savingsRate: rate,
    };
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<number, number>();
    for (const tx of transactions) {
      if (tx.type === "expense" && tx.category_id) {
        totals.set(tx.category_id, (totals.get(tx.category_id) || 0) + Number(tx.amount));
      }
    }
    const list = Array.from(totals.entries()).map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      return {
        categoryId: catId,
        name: cat?.name || "ไม่ระบุ",
        icon: cat?.icon || "Wallet",
        color: cat?.color || "#00ff41",
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    });
    return list.sort((a, b) => b.amount - a.amount);
  }, [transactions, categoryMap, totalExpense]);

  const dailyChartData = useMemo(() => {
    const dayMap = new Map<string, { day: string; รายรับ: number; รายจ่าย: number }>();
    const sorted = [...transactions].sort((a, b) =>
      a.transaction_date.localeCompare(b.transaction_date)
    );
    for (const tx of sorted) {
      const dayNum = tx.transaction_date.slice(8, 10);
      const label = `${parseInt(dayNum, 10)}`;
      const existing = dayMap.get(label) || { day: `${label}`, รายรับ: 0, รายจ่าย: 0 };
      if (tx.type === "income") {
        existing.รายรับ += Number(tx.amount);
      } else {
        existing.รายจ่าย += Number(tx.amount);
      }
      dayMap.set(label, existing);
    }
    return Array.from(dayMap.values());
  }, [transactions]);

  const enrichedBudgets = useMemo(() => {
    return budgets
      .map((b) => {
        const cat = categoryMap.get(b.category_id);
        const spent = transactions
          .filter((t) => t.type === "expense" && t.category_id === b.category_id)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const limit = Number(b.amount_limit);
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        const remaining = limit - spent;
        const status: "normal" | "warning" | "over" =
          pct >= 100 ? "over" : pct >= Number(b.alert_threshold) ? "warning" : "normal";

        return {
          ...b,
          cat,
          spent,
          limit,
          pct,
          remaining,
          status,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, categoryMap, transactions]);

  const budgetAlerts = useMemo(
    () => enrichedBudgets.filter((b) => b.status === "over" || b.status === "warning"),
    [enrichedBudgets]
  );

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (typeFilter !== "all" && tx.type !== typeFilter) return false;
        if (categoryFilter !== "all" && String(tx.category_id) !== categoryFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const catName = tx.category_id
            ? categoryMap.get(tx.category_id)?.name.toLowerCase() || ""
            : "";
          const noteMatch = (tx.note || "").toLowerCase().includes(q);
          const catMatch = catName.includes(q);
          if (!noteMatch && !catMatch) return false;
        }
        return true;
      })
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  }, [transactions, typeFilter, categoryFilter, searchQuery, categoryMap]);

  const quickFilteredCategories = useMemo(
    () => categories.filter((c) => c.type === quickType),
    [categories, quickType]
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );

  return (
    <div className="relative min-h-screen pb-10">
      {/* Animated Matrix Code Rain Canvas */}
      <MatrixRainBackground />

      {/* Main 1-Page Container optimized for iPhone (Desktop/Mobile viewport) & Desktop */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-2.5 sm:px-5 pt-3 space-y-3.5">
        {/* ==================== TOP HEADER BAR ==================== */}
        <header className="matrix-card-intense px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#00ff41]/15 border border-[#00ff41] flex items-center justify-center shadow-[0_0_8px_rgba(0,255,65,0.4)]">
              <Wallet className="w-5 h-5 text-[#00ff41]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-wide matrix-text-glow-lg">
                  Smart Personal Finance
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/60">
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Dashboard</span>
                </span>
              </div>
              <p className="text-[11px] text-[#80ff9e]/75 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00ff41]" />
                <span>ภาพรวมการเงินประจำเดือน{formatThaiMonthYear(selectedMonth)}</span>
              </p>
            </div>
          </div>

          {/* Controls: Month Picker + Cloud Status + Modal Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 matrix-input px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-[#e2ffe9] focus:outline-none min-w-0"
              />
            </div>

            {/* Cloud / Demo Status Button */}
            {isDemoMode ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="matrix-btn-outline px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
                <span className="hidden sm:inline">โหมดทดลอง (เข้าสู่ระบบ)</span>
                <LogIn className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1.5 bg-[#00ff41]/10 border border-[#00ff41]/50 text-[11px] font-bold text-[#00ff41] flex items-center gap-1.5 max-w-[150px] truncate">
                  <Cloud className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </span>
                {transactions.length === 0 && (
                  <button
                    onClick={handleSeedCloudSampleData}
                    className="matrix-btn-outline px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    title="นำเข้าข้อมูลตัวอย่างเข้า Cloud"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>ข้อมูลตัวอย่าง</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  title="ออกจากระบบ"
                  className="p-1.5 bg-[#ff0055]/15 border border-[#ff0055]/50 text-[#ff2a6d] hover:bg-[#ff0055]/30 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={loadFinanceData}
              title="รีเฟรชข้อมูล"
              className="p-1.5 matrix-btn-outline cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin" : ""}`} />
            </button>

            {/* Open Full Modal Add */}
            <button
              onClick={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              className="matrix-btn-glow px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>จดรายการ</span>
            </button>
          </div>
        </header>

        {/* ==================== ROW 1: 4 SUMMARY KPI CARDS ==================== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Income */}
          <div className="matrix-card p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#80ff9e]/85 flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 text-[#00ff41]" />
                <span>รายรับรวม (Income)</span>
              </span>
              <div className="w-7 h-7 bg-[#00ff41]/15 border border-[#00ff41]/60 flex items-center justify-center text-[#00ff41]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black matrix-text-glow-lg truncate">
              +{formatCurrency(totalIncome)}
            </div>
            <div className="mt-1 text-[11px] text-[#00ff41]/90 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span>{transactions.filter((t) => t.type === "income").length} รายการรับในเดือนนี้</span>
            </div>
          </div>

          {/* Card 2: Expense */}
          <div className="matrix-card p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#80ff9e]/85 flex items-center gap-1.5">
                <ArrowDownCircle className="w-3.5 h-3.5 text-[#ff2a6d]" />
                <span>รายจ่ายรวม (Expense)</span>
              </span>
              <div className="w-7 h-7 bg-[#ff0055]/15 border border-[#ff0055]/60 flex items-center justify-center text-[#ff2a6d]">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black matrix-text-danger-glow truncate">
              -{formatCurrency(totalExpense)}
            </div>
            <div className="mt-1 text-[11px] text-[#ff80ab] font-semibold flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
              <span>{transactions.filter((t) => t.type === "expense").length} รายการจ่ายในเดือนนี้</span>
            </div>
          </div>

          {/* Card 3: Net Cashflow */}
          <div className="matrix-card p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#80ff9e]/85 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#00ffd5]" />
                <span>คงเหลือสุทธิ (Net Balance)</span>
              </span>
              <div className="w-7 h-7 bg-[#00ffd5]/15 border border-[#00ffd5]/60 flex items-center justify-center text-[#00ffd5]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-lg sm:text-2xl font-black truncate ${
                netBalance >= 0 ? "matrix-text-cyan-glow" : "matrix-text-danger-glow"
              }`}
            >
              {netBalance >= 0 ? "+" : ""}
              {formatCurrency(netBalance)}
            </div>
            <div className="mt-1 text-[11px] text-[#80ff9e]/75 font-semibold flex items-center gap-1">
              {netBalance >= 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffd5] shrink-0" />
                  <span>สภาพคล่องเป็นบวก</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ff2a6d] shrink-0" />
                  <span>รายจ่ายสูงกว่ารายรับ</span>
                </>
              )}
            </div>
          </div>

          {/* Card 4: Savings Rate */}
          <div className="matrix-card p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#80ff9e]/85 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#39ff14]" />
                <span>สัดส่วนเงินออม (Savings Rate)</span>
              </span>
              <div className="w-7 h-7 bg-[#39ff14]/15 border border-[#39ff14]/60 flex items-center justify-center text-[#39ff14]">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black matrix-text-glow-lg">
              {savingsRate.toFixed(1)}%
            </div>
            <div className="mt-1 text-[11px] text-[#00ff41]/90 font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span>{savingsRate >= 20 ? "อยู่ในเกณฑ์ดีมาก (≥ 20%)" : "แนะนำออมอย่างน้อย 20%"}</span>
            </div>
          </div>
        </section>

        {/* ==================== ROW 2: INLINE QUICK ENTRY + BUDGET ALERTS ==================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Quick-Add Inline Bar */}
          <form
            onSubmit={handleQuickAddSubmit}
            className={`${
              budgetAlerts.length > 0 ? "lg:col-span-7" : "lg:col-span-12"
            } matrix-card-intense p-3.5`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#00ff41]" />
                <span className="text-xs font-bold matrix-text-glow">
                  บันทึกรายการด่วน (Quick Add)
                </span>
              </div>
              <div className="flex items-center gap-1 bg-black/90 border border-[#00ff41]/40 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setQuickType("expense");
                    const firstExp = categories.find((c) => c.type === "expense");
                    if (firstExp) setQuickCategoryId(firstExp.id);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    quickType === "expense"
                      ? "bg-[#ff0055] text-white"
                      : "text-[#80ff9e]/70 hover:text-white"
                  }`}
                >
                  <ArrowDownCircle className="w-3 h-3" />
                  <span>รายจ่าย</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickType("income");
                    const firstInc = categories.find((c) => c.type === "income");
                    if (firstInc) setQuickCategoryId(firstInc.id);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    quickType === "income"
                      ? "bg-[#00ff41] text-black"
                      : "text-[#80ff9e]/70 hover:text-white"
                  }`}
                >
                  <ArrowUpCircle className="w-3 h-3" />
                  <span>รายรับ</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
              <div className="col-span-2 sm:col-span-3 min-w-0 relative">
                <Tag className="w-3.5 h-3.5 text-[#00ff41] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={quickCategoryId}
                  onChange={(e) => setQuickCategoryId(Number(e.target.value))}
                  className="w-full pl-8 py-2 matrix-select text-xs font-bold"
                >
                  {quickFilteredCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#010802] text-[#00ff41]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2 min-w-0 relative">
                <Banknote className="w-3.5 h-3.5 text-[#00ff41] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  placeholder="จำนวนเงิน"
                  className="w-full pl-8 pr-2 py-2 matrix-input text-xs font-extrabold"
                />
              </div>

              <div className="col-span-1 sm:col-span-3 min-w-0 relative">
                <FileText className="w-3.5 h-3.5 text-[#00ff41] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="บันทึกช่วยจำ..."
                  className="w-full pl-8 pr-2.5 py-2 matrix-input text-xs"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 min-w-0">
                <input
                  type="date"
                  required
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full px-2 py-2 matrix-input text-xs"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <button
                  type="submit"
                  disabled={quickSaving}
                  className="w-full h-full py-2 px-3 matrix-btn-glow text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>บันทึก</span>
                </button>
              </div>
            </div>
          </form>

          {/* Active Budget Alert Strip */}
          {budgetAlerts.length > 0 && (
            <div className="lg:col-span-5 matrix-card-warning p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-[#ffc400]" />
                  <span className="text-xs font-bold matrix-text-warning-glow">
                    แจ้งเตือนงบประมาณ ({budgetAlerts.length} หมวดหมู่)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {budgetAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className={`px-3 py-2 border ${
                      alert.status === "over"
                        ? "bg-[#ff0055]/15 border-[#ff0055]/80"
                        : "bg-[#ffc400]/10 border-[#ffc400]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-white truncate flex items-center gap-1.5">
                        <CategoryIcon
                          name={alert.cat?.icon || "Wallet"}
                          className="w-3.5 h-3.5 text-[#ffc400] shrink-0"
                        />
                        <span className="truncate">{alert.cat?.name}</span>
                      </span>
                      <span
                        className={`flex items-center gap-0.5 shrink-0 ${
                          alert.status === "over"
                            ? "matrix-text-danger-glow"
                            : "matrix-text-warning-glow"
                        }`}
                      >
                        {alert.status === "over" ? (
                          <Flame className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {alert.pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-[#e2ffe9]/80 mt-0.5">
                      {formatCurrency(alert.spent)} / {formatCurrency(alert.limit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ==================== ROW 3: ANALYTICS CHARTS (SIDE-BY-SIDE) ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Left Chart: Daily Cashflow */}
          <div className="md:col-span-7 matrix-card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#00ff41]/15 border border-[#00ff41]/50 flex items-center justify-center text-[#00ff41] shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold matrix-text-glow">
                    แนวโน้มรายรับ-รายจ่ายรายวัน (Daily Cashflow)
                  </h2>
                  <p className="text-[11px] text-[#80ff9e]/70">
                    เปรียบเทียบยอดรายรับและรายจ่ายในแต่ละวันของเดือน
                  </p>
                </div>
              </div>
            </div>

            {dailyChartData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-[#80ff9e]/50">
                ยังไม่มีข้อมูลธุรกรรมในเดือนนี้
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyChartData}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.14)" />
                    <XAxis dataKey="day" stroke="#80ff9e" fontSize={11} />
                    <YAxis
                      stroke="#80ff9e"
                      fontSize={11}
                      tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(1, 12, 4, 0.96)",
                        borderColor: "#00ff41",
                        borderRadius: "2px",
                        boxShadow: "0 0 10px rgba(0, 255, 65, 0.35)",
                        color: "#e2ffe9",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="รายรับ" fill="#00ff41" radius={[1, 1, 0, 0]} />
                    <Bar dataKey="รายจ่าย" fill="#ff0055" radius={[1, 1, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right Chart: Category Donut + Breakdown */}
          <div className="md:col-span-5 matrix-card p-4 flex flex-col">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-[#00ff41]/15 border border-[#00ff41]/50 flex items-center justify-center text-[#00ff41] shrink-0">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold matrix-text-glow">
                  สัดส่วนค่าใช้จ่ายตามหมวดหมู่ (Category Breakdown)
                </h2>
                <p className="text-[11px] text-[#80ff9e]/70">
                  จัดอันดับหมวดหมู่ที่ใช้จ่ายสูงสุดในเดือนนี้
                </p>
              </div>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-[#80ff9e]/50">
                ยังไม่มีรายจ่ายในเดือนนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center flex-1">
                <div className="sm:col-span-6 h-[185px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={70}
                        paddingAngle={2}
                        stroke="rgba(0,255,65,0.35)"
                      >
                        {categoryBreakdown.map((entry) => (
                          <Cell key={entry.categoryId} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(1, 12, 4, 0.96)",
                          borderColor: "#00ff41",
                          borderRadius: "2px",
                          boxShadow: "0 0 10px rgba(0, 255, 65, 0.35)",
                          color: "#e2ffe9",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-6 space-y-1.5 max-h-[185px] overflow-y-auto pr-1">
                  {categoryBreakdown.map((item) => (
                    <div
                      key={item.categoryId}
                      className="flex items-center justify-between text-[11px] bg-black/60 border border-[#00ff41]/25 px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-5 h-5 flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${item.color}20`,
                            color: item.color,
                            border: `1px solid ${item.color}66`,
                          }}
                        >
                          <CategoryIcon name={item.icon} className="w-3 h-3" />
                        </span>
                        <span className="text-[#e2ffe9] font-bold truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[#00ff41] font-extrabold">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================== ROW 4: BUDGETING + TRANSACTION LIST ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* LEFT PANEL (5 COLS): BUDGET & ALERTS */}
          <div className="md:col-span-5 matrix-card p-4 flex flex-col space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#00ff41]/15 border border-[#00ff41]/50 flex items-center justify-center text-[#00ff41] shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold matrix-text-glow">
                    ตั้งงบประมาณและแจ้งเตือน (Monthly Budget)
                  </h2>
                  <p className="text-[11px] text-[#80ff9e]/70">
                    กำหนดวงเงินรายจ่ายและเปอร์เซ็นต์แจ้งเตือนรายหมวดหมู่
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Budget Setter Form */}
            <form
              onSubmit={handleSaveBudget}
              className="bg-black/75 border border-[#00ff41]/35 p-3 space-y-2.5"
            >
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-5 min-w-0">
                  <label className="flex items-center gap-1 text-[10px] font-bold text-[#80ff9e] mb-1">
                    <Tag className="w-3 h-3 text-[#00ff41]" />
                    <span>หมวดหมู่รายจ่าย</span>
                  </label>
                  <select
                    value={budgetCatId}
                    onChange={(e) => setBudgetCatId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 matrix-select text-xs font-bold"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#010802] text-[#00ff41]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-4 min-w-0">
                  <label className="flex items-center gap-1 text-[10px] font-bold text-[#80ff9e] mb-1">
                    <Coins className="w-3 h-3 text-[#00ff41]" />
                    <span>วงเงินงบ (฿)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    className="w-full px-2.5 py-1.5 matrix-input text-xs font-bold"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3 min-w-0">
                  <label className="flex items-center gap-1 text-[10px] font-bold text-[#80ff9e] mb-1">
                    <BellRing className="w-3 h-3 text-[#00ff41]" />
                    <span>เตือนที่ (%)</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={budgetThreshold}
                    onChange={(e) => setBudgetThreshold(e.target.value)}
                    className="w-full px-2 py-1.5 matrix-input text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={budgetSaving}
                className="w-full py-2 matrix-btn-glow text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>บันทึกงบประมาณ</span>
              </button>
            </form>

            {/* Budget Progress List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {enrichedBudgets.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#80ff9e]/50">
                  ยังไม่ได้ตั้งงบในเดือนนี้
                </div>
              ) : (
                enrichedBudgets.map((item) => {
                  const barClass =
                    item.status === "over"
                      ? "matrix-bar-danger"
                      : item.status === "warning"
                      ? "matrix-bar-warning"
                      : "matrix-bar-green";

                  return (
                    <div
                      key={item.id}
                      className={`p-3 border transition-all ${
                        item.status === "over"
                          ? "matrix-card-danger"
                          : item.status === "warning"
                          ? "matrix-card-warning"
                          : "bg-black/65 border-[#00ff41]/35"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-7 h-7 flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${item.cat?.color || "#00ff41"}20`,
                              color: item.cat?.color || "#00ff41",
                              border: `1px solid ${item.cat?.color || "#00ff41"}66`,
                            }}
                          >
                            <CategoryIcon name={item.cat?.icon || "Wallet"} className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-extrabold text-white truncate">
                            {item.cat?.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status === "over" && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-[#ff0055]/25 text-[#ff5c8d] border border-[#ff0055] flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              <span>เกินงบ! {item.pct.toFixed(0)}%</span>
                            </span>
                          )}
                          {item.status === "warning" && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-[#ffc400]/20 text-[#ffe57f] border border-[#ffc400] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>ใกล้เต็ม {item.pct.toFixed(0)}%</span>
                            </span>
                          )}
                          {item.status === "normal" && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/50 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {item.pct.toFixed(0)}%
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteBudget(item.id)}
                            title="ลบงบประมาณ"
                            className="p-1 text-[#80ff9e]/50 hover:text-[#ff2a6d] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-black/90 overflow-hidden border border-[#00ff41]/25 mb-1.5">
                        <div
                          className={`h-full ${barClass}`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#b9ffce] flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-[#00ff41]" />
                          <span>
                            ใช้จริง <strong>{formatCurrency(item.spent)}</strong> /{" "}
                            {formatCurrency(item.limit)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetCatId(item.category_id);
                            setBudgetLimit(String(item.limit));
                            setBudgetThreshold(String(item.alert_threshold));
                          }}
                          className="text-[#00ff41] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>แก้ไขงบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL (7 COLS): TRANSACTIONS LIST */}
          <div className="md:col-span-7 matrix-card p-4 flex flex-col space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#00ff41]/15 border border-[#00ff41]/50 flex items-center justify-center text-[#00ff41] shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold matrix-text-glow">
                    รายการรายรับ-รายจ่าย ({filteredTransactions.length} รายการ)
                  </h2>
                  <p className="text-[11px] text-[#80ff9e]/70">
                    ค้นหา กรองตามหมวดหมู่ แก้ไข หรือลบรายการได้ทันที
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
                className="matrix-btn-outline px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการละเอียด</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5 relative min-w-0">
                <Search className="w-3.5 h-3.5 text-[#00ff41] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาบันทึก หรือหมวดหมู่..."
                  className="w-full pl-8 pr-3 py-1.5 matrix-input text-xs"
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-1 bg-black/85 border border-[#00ff41]/35 p-0.5">
                {(
                  [
                    { id: "all", label: "ทั้งหมด", icon: <Layers className="w-3 h-3" /> },
                    { id: "income", label: "รายรับ", icon: <ArrowUpCircle className="w-3 h-3" /> },
                    { id: "expense", label: "รายจ่าย", icon: <ArrowDownCircle className="w-3 h-3" /> },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTypeFilter(tab.id)}
                    className={`flex-1 py-1 text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      typeFilter === tab.id
                        ? "bg-[#00ff41] text-black"
                        : "text-[#80ff9e]/70 hover:text-[#00ff41]"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="sm:col-span-3 min-w-0">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 matrix-select text-xs font-bold"
                >
                  <option value="all" className="bg-[#010802] text-[#00ff41]">
                    ทุกหมวดหมู่
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)} className="bg-[#010802] text-[#00ff41]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable Transaction Feed */}
            <div className="space-y-2 max-h-[455px] overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#80ff9e]/50">
                  ไม่พบรายการธุรกรรมที่ตรงกับเงื่อนไข
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-black/70 border border-[#00ff41]/30 hover:border-[#00ff41]/80 transition-all flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat?.color || "#00ff41"}18`,
                            color: cat?.color || "#00ff41",
                            border: `1px solid ${cat?.color || "#00ff41"}66`,
                          }}
                        >
                          <CategoryIcon name={cat?.icon || "Wallet"} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                              {tx.note || cat?.name || "รายการทั่วไป"}
                            </p>
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${
                                tx.type === "income"
                                  ? "bg-[#00ff41]/15 text-[#00ff41] border-[#00ff41]/40"
                                  : "bg-[#ff0055]/15 text-[#ff80ab] border-[#ff0055]/40"
                              }`}
                            >
                              {tx.type === "income" ? (
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              ) : (
                                <ArrowDownRight className="w-2.5 h-2.5" />
                              )}
                              <span>{tx.type === "income" ? "รับ" : "จ่าย"}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-[#80ff9e]/75 truncate flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1 truncate">
                              <Tag className="w-3 h-3 text-[#00ff41] shrink-0" />
                              <span className="truncate">{cat?.name || "ไม่ระบุ"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 shrink-0">
                              <Calendar className="w-3 h-3 text-[#00ff41]" />
                              <span>{tx.transaction_date}</span>
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black ${
                            tx.type === "income"
                              ? "matrix-text-glow"
                              : "matrix-text-danger-glow"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(Number(tx.amount))}
                        </span>

                        <button
                          onClick={() => {
                            setEditingTx(tx);
                            setIsTxModalOpen(true);
                          }}
                          title="แก้ไข"
                          className="p-1.5 bg-[#00ff41]/10 hover:bg-[#00ff41]/25 text-[#00ff41] border border-[#00ff41]/40 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="ลบ"
                          className="p-1.5 bg-[#ff0055]/10 hover:bg-[#ff0055]/30 text-[#ff2a6d] border border-[#ff0055]/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        categories={categories}
        defaultDate={quickDate}
        editingTransaction={editingTx}
        onSave={handleSaveTransaction}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loadFinanceData}
      />
    </div>
  );
}
