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
import { ActiveTab, Navbar } from "@/components/Navbar";
import { DashboardView } from "@/components/DashboardView";
import { TransactionList } from "@/components/TransactionList";
import { BudgetManager } from "@/components/BudgetManager";
import { TransactionModal } from "@/components/TransactionModal";
import { AuthModal } from "@/components/AuthModal";
import { Cloud, Database, RefreshCw, Sparkles } from "lucide-react";

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

export default function SmartFinancePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isDemoMode = !userId;

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

      // Fetch categories from Supabase (available to anon + authenticated)
      const { data: catData } = await supabase
        .from("finance_categories")
        .select("*")
        .order("id", { ascending: true });

      if (catData && catData.length > 0) {
        setCategories(catData as Category[]);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      if (userId) {
        // Cloud mode: load user's transactions & budgets from Supabase
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
        // Demo Mode: load from localStorage or seed initial demo data for the selectedMonth
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
  const handleSaveBudget = async (payload: {
    category_id: number;
    month_year: string;
    amount_limit: number;
    alert_threshold: number;
  }) => {
    if (userId) {
      const supabase = createClient();
      await supabase.from("finance_budgets").upsert(
        {
          user_id: userId,
          category_id: payload.category_id,
          month_year: payload.month_year,
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
          b.category_id === payload.category_id && b.month_year === payload.month_year
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
            month_year: payload.month_year,
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

  // Seed sample data to Supabase Cloud for signed-in user
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

  // Count how many budgets are in warning/over state
  const alertCount = useMemo(() => {
    return budgets.filter((b) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.category_id === b.category_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const pct = b.amount_limit > 0 ? (spent / b.amount_limit) * 100 : 0;
      return pct >= b.alert_threshold;
    }).length;
  }, [budgets, transactions]);

  const defaultDateForModal = useMemo(() => {
    const currentYM = getCurrentYearMonth();
    if (selectedMonth === currentYM) {
      return new Date().toISOString().slice(0, 10);
    }
    return `${selectedMonth}-01`;
  }, [selectedMonth]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* Sidebar / Mobile Bars */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        onOpenAddModal={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        userEmail={userEmail}
        isDemoMode={isDemoMode}
        onSignOut={handleSignOut}
        alertCount={alertCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
        {/* Top Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs">
            {isDemoMode ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Demo Mode (ข้อมูลตัวอย่างพร้อมทดสอบ)
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  คุณสามารถเพิ่ม/ลบรายการ หรือล็อกอินเพื่อซิงค์กับฐานข้อมูล Supabase จริงได้ทันที
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  <Cloud className="w-3.5 h-3.5" />
                  Supabase Cloud Sync ({userEmail})
                </span>
                {transactions.length === 0 && (
                  <button
                    onClick={handleSeedCloudSampleData}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>นำเข้าข้อมูลตัวอย่างเข้าบัญชีนี้</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFinanceData}
              title="รีเฟรชข้อมูล"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Active View */}
        {activeTab === "dashboard" && (
          <DashboardView
            selectedMonth={selectedMonth}
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            onGoToBudgets={() => setActiveTab("budgets")}
            onGoToTransactions={() => setActiveTab("transactions")}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionList
            selectedMonth={selectedMonth}
            transactions={transactions}
            categories={categories}
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === "budgets" && (
          <BudgetManager
            selectedMonth={selectedMonth}
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        categories={categories}
        defaultDate={defaultDateForModal}
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
