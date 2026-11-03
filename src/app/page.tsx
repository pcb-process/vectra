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
import { BudgetModal } from "@/components/BudgetModal";
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
  BarChart3,
  PieChart as PieChartIcon,
  Receipt,
  SlidersHorizontal,
  Flame,
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
} from "recharts";

const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
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

  // Modal states (All actions via clean Modals)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    categoryId?: number;
    limit?: number;
    threshold?: number;
  }>({});

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Minimal Transaction Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  const isDemoMode = !userId;

  const defaultDate = useMemo(() => {
    const currentYM = getCurrentYearMonth();
    if (selectedMonth === currentYM) {
      return new Date().toISOString().slice(0, 10);
    }
    return `${selectedMonth}-01`;
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

  // Save or update transaction via Modal
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

  // Save or update budget via Modal
  const handleSaveBudget = async (payload: {
    category_id: number;
    amount_limit: number;
    alert_threshold: number;
  }) => {
    if (userId) {
      const supabase = createClient();
      await supabase.from("finance_budgets").upsert(
        {
          user_id: userId,
          category_id: payload.category_id,
          month_year: selectedMonth,
          amount_limit: payload.amount_limit,
          alert_threshold: payload.alert_threshold,
        },
        { onConflict: "user_id,category_id,month_year" }
      );
      await loadFinanceData();
    } else {
      const bgKey = `spf_demo_bg_${selectedMonth}`;
      const existingIdx = budgets.findIndex(
        (b) =>
          b.category_id === payload.category_id && b.month_year === selectedMonth
      );
      let updated: Budget[];
      if (existingIdx >= 0) {
        updated = budgets.map((b, i) =>
          i === existingIdx
            ? {
                ...b,
                amount_limit: payload.amount_limit,
                alert_threshold: payload.alert_threshold,
              }
            : b
        );
      } else {
        updated = [
          ...budgets,
          {
            id: Date.now(),
            user_id: "demo-user",
            category_id: payload.category_id,
            month_year: selectedMonth,
            amount_limit: payload.amount_limit,
            alert_threshold: payload.alert_threshold,
          },
        ];
      }
      localStorage.setItem(bgKey, JSON.stringify(updated));
      setBudgets(updated);
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
        const status: "normal" | "warning" | "over" =
          pct >= 100 ? "over" : pct >= Number(b.alert_threshold) ? "warning" : "normal";

        return {
          ...b,
          cat,
          spent,
          limit,
          pct,
          status,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, categoryMap, transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (typeFilter !== "all" && tx.type !== typeFilter) return false;
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
  }, [transactions, typeFilter, searchQuery, categoryMap]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );

  return (
    <div className="relative min-h-screen pb-8 overflow-x-hidden">
      <MatrixRainBackground />

      {/* Minimal 1-Page Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-5 pt-3 space-y-3.5">
        {/* ==================== MINIMAL RESPONSIVE HEADER ==================== */}
        <header className="matrix-card p-3 sm:px-4 sm:py-3 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
          {/* Top Row on Mobile: Brand + Utility Icons (Auth & Refresh) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 bg-[#00ff41]/15 border border-[#00ff41] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-[#00ff41]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold matrix-text-glow-lg truncate">
                  Smart Personal Finance
                </h1>
                <p className="text-[11px] text-[#80ff9e]/75">
                  รอบเดือน {formatThaiMonthYear(selectedMonth)}
                </p>
              </div>
            </div>

            {/* Mobile-only Auth & Refresh utility buttons */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              {isDemoMode ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="matrix-btn-outline h-9 px-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="เข้าสู่ระบบ Cloud"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
                  <span>Login</span>
                </button>
              ) : (
                <>
                  {transactions.length === 0 && (
                    <button
                      onClick={handleSeedCloudSampleData}
                      className="matrix-btn-outline w-9 h-9 flex items-center justify-center cursor-pointer"
                      title="นำเข้าข้อมูลตัวอย่าง"
                    >
                      <Database className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    title="ออกจากระบบ"
                    className="w-9 h-9 bg-[#ff0055]/15 border border-[#ff0055]/50 text-[#ff2a6d] flex items-center justify-center cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={loadFinanceData}
                title="รีเฟรช"
                className="w-9 h-9 matrix-btn-outline flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Action Row: Month Selector + Primary Modal Triggers (Fits 100% cleanly on 375px mobile & desktop) */}
          <div className="grid grid-cols-12 sm:flex items-center gap-2">
            {/* Month Picker (No duplicate icon) */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="col-span-5 sm:w-auto h-9 px-2.5 matrix-input text-xs font-bold text-[#e2ffe9] focus:outline-none"
            />

            {/* Desktop-only Auth & Refresh buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {isDemoMode ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="matrix-btn-outline h-9 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
                  <span>โหมดทดลอง</span>
                  <LogIn className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="h-9 px-2.5 bg-[#00ff41]/10 border border-[#00ff41]/40 text-xs font-bold text-[#00ff41] flex items-center gap-1.5 max-w-[150px] truncate">
                    <Cloud className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{userEmail}</span>
                  </span>
                  {transactions.length === 0 && (
                    <button
                      onClick={handleSeedCloudSampleData}
                      className="matrix-btn-outline h-9 px-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="นำเข้าข้อมูลตัวอย่าง"
                    >
                      <Database className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    title="ออกจากระบบ"
                    className="w-9 h-9 bg-[#ff0055]/15 border border-[#ff0055]/50 text-[#ff2a6d] hover:bg-[#ff0055]/30 flex items-center justify-center cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={loadFinanceData}
                title="รีเฟรช"
                className="w-9 h-9 matrix-btn-outline flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Modal Trigger: Set Budget */}
            <button
              onClick={() => {
                setEditingBudget({});
                setIsBudgetModalOpen(true);
              }}
              className="col-span-3 sm:w-auto h-9 px-2.5 sm:px-3 matrix-btn-outline text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span>ตั้งงบ</span>
            </button>

            {/* Modal Trigger: Add Transaction */}
            <button
              onClick={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              className="col-span-4 sm:w-auto h-9 px-2.5 sm:px-3.5 matrix-btn-glow text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="truncate">จดรายการ</span>
            </button>
          </div>
        </header>

        {/* ==================== 4 MINIMAL KPI CARDS ==================== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="matrix-card p-3 sm:p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] text-[#80ff9e]/75 block truncate">รายรับรวม</span>
              <span className="text-sm sm:text-xl font-black matrix-text-glow-lg truncate block mt-0.5">
                +{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#00ff41]/15 border border-[#00ff41]/50 flex items-center justify-center text-[#00ff41] shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="matrix-card p-3 sm:p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] text-[#80ff9e]/75 block truncate">รายจ่ายรวม</span>
              <span className="text-sm sm:text-xl font-black matrix-text-danger-glow truncate block mt-0.5">
                -{formatCurrency(totalExpense)}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#ff0055]/15 border border-[#ff0055]/50 flex items-center justify-center text-[#ff2a6d] shrink-0">
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="matrix-card p-3 sm:p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] text-[#80ff9e]/75 block truncate">คงเหลือสุทธิ</span>
              <span
                className={`text-sm sm:text-xl font-black truncate block mt-0.5 ${
                  netBalance >= 0 ? "matrix-text-cyan-glow" : "matrix-text-danger-glow"
                }`}
              >
                {netBalance >= 0 ? "+" : ""}
                {formatCurrency(netBalance)}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#00ffd5]/15 border border-[#00ffd5]/50 flex items-center justify-center text-[#00ffd5] shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="matrix-card p-3 sm:p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] text-[#80ff9e]/75 block truncate">อัตราการออม</span>
              <span className="text-sm sm:text-xl font-black matrix-text-glow-lg block mt-0.5">
                {savingsRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#39ff14]/15 border border-[#39ff14]/50 flex items-center justify-center text-[#39ff14] shrink-0">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </section>

        {/* ==================== CHARTS ROW (MINIMAL) ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Daily Cashflow BarChart */}
          <div className="md:col-span-7 matrix-card p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <BarChart3 className="w-4 h-4 text-[#00ff41] shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold matrix-text-glow truncate">
                  แนวโน้มรายรับ-รายจ่ายรายวัน
                </h2>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] shrink-0">
                <span className="flex items-center gap-1 text-[#00ff41]">
                  <span className="w-2 h-2 bg-[#00ff41]" /> รายรับ
                </span>
                <span className="flex items-center gap-1 text-[#ff2a6d]">
                  <span className="w-2 h-2 bg-[#ff0055]" /> รายจ่าย
                </span>
              </div>
            </div>

            {dailyChartData.length === 0 ? (
              <div className="h-[190px] flex items-center justify-center text-xs text-[#80ff9e]/50">
                ยังไม่มีข้อมูลในเดือนนี้
              </div>
            ) : (
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyChartData}
                    margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.12)" />
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
                        color: "#e2ffe9",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Bar dataKey="รายรับ" fill="#00ff41" radius={[1, 1, 0, 0]} />
                    <Bar dataKey="รายจ่าย" fill="#ff0055" radius={[1, 1, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Breakdown Donut (Stacks cleanly on narrow mobile, side-by-side on larger screens) */}
          <div className="md:col-span-5 matrix-card p-3.5 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-[#00ff41] shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold matrix-text-glow truncate">
                สัดส่วนค่าใช้จ่ายตามหมวดหมู่
              </h2>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="h-[190px] flex items-center justify-center text-xs text-[#80ff9e]/50">
                ยังไม่มีรายจ่ายในเดือนนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5 h-[150px] sm:h-[170px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={58}
                        paddingAngle={2}
                        stroke="rgba(0,255,65,0.3)"
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
                          color: "#e2ffe9",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-7 space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                  {categoryBreakdown.map((item) => (
                    <div
                      key={item.categoryId}
                      className="flex items-center justify-between text-xs bg-black/50 border border-[#00ff41]/20 px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-4 h-4 flex items-center justify-center shrink-0"
                          style={{ color: item.color }}
                        >
                          <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[#e2ffe9] truncate">{item.name}</span>
                      </div>
                      <span className="text-[#00ff41] font-bold shrink-0 ml-2">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================== BOTTOM ROW: BUDGETS + TRANSACTIONS ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* LEFT (5 COLS): BUDGET STATUS */}
          <div className="md:col-span-5 matrix-card p-3.5 sm:p-4 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-4 h-4 text-[#00ff41] shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold matrix-text-glow truncate">
                  งบประมาณประจำเดือน
                </h2>
              </div>
              <button
                onClick={() => {
                  setEditingBudget({});
                  setIsBudgetModalOpen(true);
                }}
                className="matrix-btn-outline h-8 px-3 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ตั้งงบ</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {enrichedBudgets.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#80ff9e]/50">
                  ยังไม่ได้ตั้งงบ กดปุ่ม &ldquo;+ ตั้งงบ&rdquo; เพื่อกำหนดวงเงิน
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
                          : "bg-black/60 border-[#00ff41]/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-7 h-7 flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${item.cat?.color || "#00ff41"}18`,
                              color: item.cat?.color || "#00ff41",
                              border: `1px solid ${item.cat?.color || "#00ff41"}55`,
                            }}
                          >
                            <CategoryIcon name={item.cat?.icon || "Wallet"} className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white truncate block">
                              {item.cat?.name}
                            </span>
                            <span className="text-[11px] text-[#b9ffce]/75 block">
                              {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                            </span>
                          </div>
                        </div>

                        {/* Mobile-friendly Touch Action Buttons (32x32px) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status === "over" && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#ff0055]/25 text-[#ff5c8d] border border-[#ff0055] flex items-center gap-0.5">
                              <Flame className="w-3 h-3" /> {item.pct.toFixed(0)}%
                            </span>
                          )}
                          {item.status === "warning" && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#ffc400]/20 text-[#ffe57f] border border-[#ffc400] flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> {item.pct.toFixed(0)}%
                            </span>
                          )}
                          {item.status === "normal" && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/40 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> {item.pct.toFixed(0)}%
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setEditingBudget({
                                categoryId: item.category_id,
                                limit: item.limit,
                                threshold: item.alert_threshold,
                              });
                              setIsBudgetModalOpen(true);
                            }}
                            title="แก้ไขงบ"
                            className="w-8 h-8 bg-[#00ff41]/10 hover:bg-[#00ff41]/25 border border-[#00ff41]/40 text-[#00ff41] flex items-center justify-center cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(item.id)}
                            title="ลบงบ"
                            className="w-8 h-8 bg-[#ff0055]/10 hover:bg-[#ff0055]/25 border border-[#ff0055]/40 text-[#ff2a6d] flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-black/90 overflow-hidden border border-[#00ff41]/20">
                        <div
                          className={`h-full ${barClass}`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT (7 COLS): TRANSACTIONS */}
          <div className="md:col-span-7 matrix-card p-3.5 sm:p-4 flex flex-col">
            {/* Row 1: Title + Add Button (Never overflows on 375px screen) */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Receipt className="w-4 h-4 text-[#00ff41] shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold matrix-text-glow truncate">
                  รายการรับ-จ่าย ({filteredTransactions.length})
                </h2>
              </div>

              <button
                onClick={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
                className="matrix-btn-glow h-8 px-3 text-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>เพิ่มรายการ</span>
              </button>
            </div>

            {/* Row 2: Clean Full-Width Search + Filter Grid */}
            <div className="grid grid-cols-12 gap-2 mb-3">
              <div className="col-span-7 sm:col-span-8 relative min-w-0">
                <Search className="w-3.5 h-3.5 text-[#00ff41] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหารายการ..."
                  className="w-full h-9 pl-8 pr-2.5 matrix-input text-xs"
                />
              </div>

              <div className="col-span-5 sm:col-span-4 min-w-0">
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "all" | "income" | "expense")
                  }
                  className="w-full h-9 px-2.5 matrix-select text-xs font-bold"
                >
                  <option value="all" className="bg-[#010802] text-[#00ff41]">
                    ทั้งหมด
                  </option>
                  <option value="income" className="bg-[#010802] text-[#00ff41]">
                    รายรับ
                  </option>
                  <option value="expense" className="bg-[#010802] text-[#00ff41]">
                    รายจ่าย
                  </option>
                </select>
              </div>
            </div>

            {/* Transaction Rows with 32x32px Mobile Touch Targets */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#80ff9e]/50">
                  ไม่มีรายการธุรกรรม
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 sm:px-3 sm:py-2.5 bg-black/65 border border-[#00ff41]/25 hover:border-[#00ff41]/70 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat?.color || "#00ff41"}18`,
                            color: cat?.color || "#00ff41",
                            border: `1px solid ${cat?.color || "#00ff41"}55`,
                          }}
                        >
                          <CategoryIcon name={cat?.icon || "Wallet"} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {tx.note || cat?.name || "รายการทั่วไป"}
                          </p>
                          <p className="text-[11px] text-[#80ff9e]/65 truncate">
                            {cat?.name || "ไม่ระบุ"} • {tx.transaction_date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-bold mr-0.5 ${
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
                          className="w-8 h-8 bg-[#00ff41]/10 hover:bg-[#00ff41]/25 border border-[#00ff41]/40 text-[#00ff41] flex items-center justify-center cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="ลบ"
                          className="w-8 h-8 bg-[#ff0055]/10 hover:bg-[#ff0055]/25 border border-[#ff0055]/40 text-[#ff2a6d] flex items-center justify-center cursor-pointer"
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

      {/* Modals for All Actions */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        categories={categories}
        defaultDate={defaultDate}
        editingTransaction={editingTx}
        onSave={handleSaveTransaction}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        expenseCategories={expenseCategories}
        initialCategoryId={editingBudget.categoryId}
        initialLimit={editingBudget.limit}
        initialThreshold={editingBudget.threshold}
        onSave={handleSaveBudget}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loadFinanceData}
      />
    </div>
  );
}
