"use client";

import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
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
import { Budget, Category, Transaction } from "@/types/finance";
import { CategoryIcon } from "./CategoryIcon";
import { formatThaiMonthYear } from "./Navbar";

interface DashboardViewProps {
  selectedMonth: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  onOpenAddModal: () => void;
  onGoToBudgets: () => void;
  onGoToTransactions: () => void;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function DashboardView({
  selectedMonth,
  transactions,
  categories,
  budgets,
  onOpenAddModal,
  onGoToBudgets,
  onGoToTransactions,
}: DashboardViewProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Summary metrics
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

  // Expense breakdown by category
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
        name: cat?.name || "ไม่ระบุหมวดหมู่",
        icon: cat?.icon || "Wallet",
        color: cat?.color || "#64748b",
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    });
    return list.sort((a, b) => b.amount - a.amount);
  }, [transactions, categoryMap, totalExpense]);

  // Daily cashflow chart data
  const dailyChartData = useMemo(() => {
    const dayMap = new Map<string, { day: string; รายรับ: number; รายจ่าย: number }>();
    const sorted = [...transactions].sort((a, b) =>
      a.transaction_date.localeCompare(b.transaction_date)
    );
    for (const tx of sorted) {
      const dayNum = tx.transaction_date.slice(8, 10);
      const label = `${ parseInt(dayNum, 10) }`;
      const existing = dayMap.get(label) || { day: `วันที่ ${label}`, รายรับ: 0, รายจ่าย: 0 };
      if (tx.type === "income") {
        existing.รายรับ += Number(tx.amount);
      } else {
        existing.รายจ่าย += Number(tx.amount);
      }
      dayMap.set(label, existing);
    }
    return Array.from(dayMap.values());
  }, [transactions]);

  // Budget alerts check
  const budgetAlerts = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = transactions
          .filter((t) => t.type === "expense" && t.category_id === b.category_id)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const pct = b.amount_limit > 0 ? (spent / b.amount_limit) * 100 : 0;
        const cat = categoryMap.get(b.category_id);
        return {
          ...b,
          categoryName: cat?.name || "หมวดหมู่",
          categoryColor: cat?.color || "#f59e0b",
          spent,
          pct,
          isOver: pct >= 100,
          isWarning: pct >= b.alert_threshold && pct < 100,
        };
      })
      .filter((b) => b.isOver || b.isWarning)
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions, categoryMap]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            สรุปภาพรวมการเงินประจำเดือน{formatThaiMonthYear(selectedMonth)}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            ติดตามกระแสเงินสด สัดส่วนค่าใช้จ่าย และการแจ้งเตือนงบประมาณแบบเรียลไทม์
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>เพิ่มรายการรับ-จ่าย</span>
        </button>
      </div>

      {/* Budget Alert Banner (if any budget is >= threshold) */}
      {budgetAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  แจ้งเตือนงบประมาณประจำเดือน ({budgetAlerts.length} หมวดหมู่)
                </h3>
                <p className="text-xs text-slate-300">
                  พบหมวดหมู่ที่มียอดใช้จ่ายแตะเกณฑ์แจ้งเตือนหรือเกินงบที่ตั้งไว้
                </p>
              </div>
            </div>
            <button
              onClick={onGoToBudgets}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline self-start sm:self-auto cursor-pointer"
            >
              จัดการงบประมาณทั้งหมด →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {budgetAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  alert.isOver
                    ? "bg-rose-950/40 border-rose-500/40"
                    : "bg-amber-950/30 border-amber-500/30"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{alert.categoryName}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        alert.isOver
                          ? "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                          : "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {alert.isOver ? "เกินงบ!" : "ใกล้เต็มงบ"} ({alert.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    ใช้ไป {formatCurrency(alert.spent)} จากงบ {formatCurrency(alert.amount_limit)}
                  </p>
                </div>
                <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      alert.isOver ? "bg-rose-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, alert.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Income */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">รายรับรวม (Income)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {transactions.filter((t) => t.type === "income").length} รายการรับในเดือนนี้
            </span>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">รายจ่ายรวม (Expense)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalExpense)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs text-rose-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>
              {transactions.filter((t) => t.type === "expense").length} รายการจ่ายในเดือนนี้
            </span>
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">คงเหลือสุทธิ (Net Cashflow)</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold ${
              netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {netBalance >= 0 ? "+" : ""}
            {formatCurrency(netBalance)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {netBalance >= 0
              ? "สภาพคล่องเป็นบวก มีเงินเหลือเก็บ"
              : "รายจ่ายสูงกว่ารายรับในเดือนนี้"}
          </div>
        </div>

        {/* Savings Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">
              สัดส่วนเงินคงเหลือ/ออม (Savings Rate)
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{savingsRate.toFixed(1)}%</div>
          <div className="mt-2 text-xs text-teal-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {savingsRate >= 20
                ? "ยอดเยี่ยม! สูงกว่าเกณฑ์แนะนำ (20%)"
                : "เป้าหมายแนะนำคือออมอย่างน้อย 20%"}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cashflow Bar Chart */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                แนวโน้มรายรับ-รายจ่ายรายวัน (Cashflow Trend)
              </h3>
              <p className="text-xs text-slate-400">
                เปรียบเทียบยอดรายรับและรายจ่ายในแต่ละวันของเดือน
              </p>
            </div>
          </div>

          {dailyChartData.length === 0 ? (
            <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center text-slate-500 text-sm">
              <p>ยังไม่มีรายการธุรกรรมในเดือนนี้</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                    formatter={(value: number) => [formatCurrency(value), ""]}
                  />
                  <Legend />
                  <Bar dataKey="รายรับ" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="รายจ่าย" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense Category Donut & Ranking */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">
              สัดส่วนค่าใช้จ่ายตามหมวดหมู่ (Expense Breakdown)
            </h3>
            <p className="text-xs text-slate-400">จัดอันดับหมวดหมู่ที่ใช้จ่ายสูงสุดในเดือนนี้</p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 min-h-[280px] flex items-center justify-center text-slate-500 text-sm">
              ยังไม่มีข้อมูลรายจ่ายในเดือนนี้
            </div>
          ) : (
            <>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        borderRadius: "12px",
                        color: "#f8fafc",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 mt-3 max-h-[210px] overflow-y-auto pr-1">
                {categoryBreakdown.map((item) => (
                  <div key={item.categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-200 font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400">{item.percentage.toFixed(1)}%</span>
                      <span className="text-white font-semibold w-24 text-right">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">รายการเคลื่อนไหวล่าสุด</h3>
            <p className="text-xs text-slate-400">5 รายการล่าสุดของเดือนนี้</p>
          </div>
          <button
            onClick={onGoToTransactions}
            className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
          >
            ดูทั้งหมด ({transactions.length} รายการ) →
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            ยังไม่มีรายการในเดือนนี้ กดปุ่ม &ldquo;เพิ่มรายการรับ-จ่าย&rdquo; เพื่อเริ่มบันทึก
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 5).map((tx) => {
              const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{
                        backgroundColor: `${cat?.color || "#10b981"}22`,
                        color: cat?.color || "#10b981",
                      }}
                    >
                      <CategoryIcon name={cat?.icon || "Wallet"} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {tx.note || cat?.name || "รายการทั่วไป"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {cat?.name || "ไม่ระบุหมวดหมู่"} • {tx.transaction_date}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold shrink-0 ${
                      tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(tx.amount))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
