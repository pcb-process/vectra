"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Category, Transaction } from "@/types/finance";
import { CategoryIcon } from "./CategoryIcon";
import { formatCurrency } from "./DashboardView";
import { formatThaiMonthYear } from "./Navbar";

interface TransactionListProps {
  selectedMonth: string;
  transactions: Transaction[];
  categories: Category[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: number) => Promise<void>;
}

export function TransactionList({
  selectedMonth,
  transactions,
  categories,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

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

  const summary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of filteredTransactions) {
      if (t.type === "income") inc += Number(t.amount);
      else exp += Number(t.amount);
    }
    return { inc, exp, net: inc - exp };
  }, [filteredTransactions]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDeleteTransaction(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            รายการรายรับ-รายจ่าย ({formatThaiMonthYear(selectedMonth)})
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            ค้นหา กรองตามหมวดหมู่ แก้ไข หรือลบธุรกรรมได้อย่างรวดเร็ว
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>เพิ่มรายการใหม่</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาจากบันทึกช่วยจำ หรือชื่อหมวดหมู่..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Type Filter */}
        <div className="md:col-span-3 flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
          {(
            [
              { id: "all", label: "ทั้งหมด" },
              { id: "income", label: "รายรับ" },
              { id: "expense", label: "รายจ่าย" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? "bg-slate-800 text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="md:col-span-4 relative flex items-center">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">ทุกหมวดหมู่ ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.type === "income" ? "[รายรับ]" : "[รายจ่าย]"} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtered Summary Bar */}
      <div className="grid grid-cols-3 gap-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 text-center">
        <div>
          <span className="text-[11px] text-slate-400 block">รายรับ (ที่แสดง)</span>
          <span className="text-sm sm:text-base font-bold text-emerald-400">
            +{formatCurrency(summary.inc)}
          </span>
        </div>
        <div className="border-x border-slate-800">
          <span className="text-[11px] text-slate-400 block">รายจ่าย (ที่แสดง)</span>
          <span className="text-sm sm:text-base font-bold text-rose-400">
            -{formatCurrency(summary.exp)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">สุทธิ ({filteredTransactions.length} รายการ)</span>
          <span
            className={`text-sm sm:text-base font-bold ${
              summary.net >= 0 ? "text-sky-400" : "text-rose-400"
            }`}
          >
            {summary.net >= 0 ? "+" : ""}
            {formatCurrency(summary.net)}
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-sm">
            ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหาในเดือนนี้
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredTransactions.map((tx) => {
              const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
              return (
                <div
                  key={tx.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/35 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || "#10b981"}20`,
                        color: cat?.color || "#10b981",
                      }}
                    >
                      <CategoryIcon name={cat?.icon || "Wallet"} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {tx.note || cat?.name || "รายการทั่วไป"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.type === "income"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> รายรับ
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3" /> รายจ่าย
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        หมวดหมู่: <span className="text-slate-300">{cat?.name || "-"}</span> • วันที่{" "}
                        {tx.transaction_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0">
                    <span
                      className={`text-base font-bold ${
                        tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(Number(tx.amount))}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        title="แก้ไขรายการ"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        title="ลบรายการ"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
