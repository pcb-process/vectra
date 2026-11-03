"use client";

import React, { useMemo, useState } from "react";
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  BellRing,
} from "lucide-react";
import { Budget, Category, Transaction } from "@/types/finance";
import { CategoryIcon } from "./CategoryIcon";
import { formatCurrency } from "./DashboardView";
import { formatThaiMonthYear } from "./Navbar";

interface BudgetManagerProps {
  selectedMonth: string;
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onSaveBudget: (payload: {
    category_id: number;
    month_year: string;
    amount_limit: number;
    alert_threshold: number;
  }) => Promise<void>;
  onDeleteBudget: (id: number) => Promise<void>;
}

export function BudgetManager({
  selectedMonth,
  budgets,
  categories,
  transactions,
  onSaveBudget,
  onDeleteBudget,
}: BudgetManagerProps) {
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );

  const [selectedCatId, setSelectedCatId] = useState<number>(
    expenseCategories[0]?.id || 8
  );
  const [amountLimit, setAmountLimit] = useState<string>("5000");
  const [alertThreshold, setAlertThreshold] = useState<string>("80");
  const [saving, setSaving] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Calculate spent per category in current month
  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>();
    for (const tx of transactions) {
      if (tx.type === "expense" && tx.category_id) {
        map.set(tx.category_id, (map.get(tx.category_id) || 0) + Number(tx.amount));
      }
    }
    return map;
  }, [transactions]);

  const enrichedBudgets = useMemo(() => {
    return budgets.map((b) => {
      const cat = categoryMap.get(b.category_id);
      const spent = spentByCategory.get(b.category_id) || 0;
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
    });
  }, [budgets, categoryMap, spentByCategory]);

  const totalBudgeted = useMemo(
    () => enrichedBudgets.reduce((sum, b) => sum + b.limit, 0),
    [enrichedBudgets]
  );
  const totalSpentInBudgeted = useMemo(
    () => enrichedBudgets.reduce((sum, b) => sum + b.spent, 0),
    [enrichedBudgets]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(amountLimit);
    const thresholdNum = parseFloat(alertThreshold);
    if (isNaN(limitNum) || limitNum <= 0) return;

    setSaving(true);
    try {
      await onSaveBudget({
        category_id: selectedCatId,
        month_year: selectedMonth,
        amount_limit: limitNum,
        alert_threshold: isNaN(thresholdNum) ? 80 : Math.min(100, Math.max(10, thresholdNum)),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          ตั้งงบประมาณและแจ้งเตือน ({formatThaiMonthYear(selectedMonth)})
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          กำหนดเพดานค่าใช้จ่ายรายหมวดหมู่ พร้อมระบบแจ้งเตือนอัตโนมัติเมื่อใกล้เต็มงบ
        </p>
      </div>

      {/* Overall Budget Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ภาพรวมการใช้งบประมาณทั้งหมดในเดือนนี้
              </h3>
              <p className="text-xs text-slate-400">
                ตั้งงบไว้ {enrichedBudgets.length} หมวดหมู่ • ใช้ไปแล้ว{" "}
                {formatCurrency(totalSpentInBudgeted)} จาก {formatCurrency(totalBudgeted)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">งบคงเหลือรวม</span>
            <span
              className={`text-xl font-bold ${
                totalBudgeted - totalSpentInBudgeted >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {formatCurrency(totalBudgeted - totalSpentInBudgeted)}
            </span>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              totalBudgeted > 0 && totalSpentInBudgeted / totalBudgeted >= 1
                ? "bg-rose-500"
                : totalBudgeted > 0 && totalSpentInBudgeted / totalBudgeted >= 0.8
                ? "bg-amber-400"
                : "bg-emerald-500"
            }`}
            style={{
              width: `${
                totalBudgeted > 0
                  ? Math.min(100, (totalSpentInBudgeted / totalBudgeted) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Add / Update Budget Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <BellRing className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            ตั้งค่าหรือปรับปรุงงบประมาณประจำเดือน
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              หมวดหมู่รายจ่าย
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              วงเงินงบประมาณ (บาท/เดือน)
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={amountLimit}
              onChange={(e) => setAmountLimit(e.target.value)}
              placeholder="เช่น 6000"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              เตือนเมื่อถึง (%)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              required
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>บันทึกงบ</span>
            </button>
          </div>
        </div>
      </form>

      {/* Budget Cards Grid */}
      {enrichedBudgets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-12 text-center text-sm text-slate-500">
          ยังไม่ได้ตั้งงบประมาณสำหรับเดือนนี้ เลือกหมวดหมู่ด้านบนเพื่อเริ่มกำหนดงบประมาณ
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrichedBudgets.map((item) => {
            const barColor =
              item.status === "over"
                ? "bg-rose-500"
                : item.status === "warning"
                ? "bg-amber-400"
                : "bg-emerald-500";

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                  item.status === "over"
                    ? "border-rose-500/40"
                    : item.status === "warning"
                    ? "border-amber-500/40"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${item.cat?.color || "#10b981"}20`,
                        color: item.cat?.color || "#10b981",
                      }}
                    >
                      <CategoryIcon name={item.cat?.icon || "Wallet"} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {item.cat?.name || "หมวดหมู่"}
                      </h4>
                      <span className="text-xs text-slate-400">
                        แจ้งเตือนที่ {item.alert_threshold}% ของงบ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "over" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> เกินงบ!
                      </span>
                    )}
                    {item.status === "warning" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> ใกล้เต็มงบ
                      </span>
                    )}
                    {item.status === "normal" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> ปกติ
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteBudget(item.id)}
                      title="ลบงบประมาณนี้"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">
                      ใช้จริง{" "}
                      <strong className="text-white">{formatCurrency(item.spent)}</strong>
                    </span>
                    <span className="text-slate-400">
                      งบ {formatCurrency(item.limit)} ({item.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                </div>

                {/* Footer Status */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  {item.remaining >= 0 ? (
                    <span className="text-emerald-400">
                      คงเหลือใช้ได้อีก {formatCurrency(item.remaining)}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold">
                      ใช้เกินงบไป {formatCurrency(Math.abs(item.remaining))}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatId(item.category_id);
                      setAmountLimit(String(item.limit));
                      setAlertThreshold(String(item.alert_threshold));
                    }}
                    className="text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                  >
                    ปรับวงเงิน
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
