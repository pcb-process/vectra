"use client";

import React, { useEffect, useState } from "react";
import { X, PlusCircle, Save } from "lucide-react";
import { Category, Transaction, TransactionType } from "@/types/finance";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  defaultDate: string;
  editingTransaction: Transaction | null;
  onSave: (payload: {
    id?: number;
    type: TransactionType;
    category_id: number;
    amount: number;
    note: string;
    transaction_date: string;
  }) => Promise<void>;
}

export function TransactionModal({
  isOpen,
  onClose,
  categories,
  defaultDate,
  editingTransaction,
  onSave,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<number>(8);
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(defaultDate);
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategoryId(
        editingTransaction.category_id ||
          categories.find((c) => c.type === editingTransaction.type)?.id ||
          1
      );
      setAmount(String(editingTransaction.amount));
      setNote(editingTransaction.note);
      setTransactionDate(editingTransaction.transaction_date);
    } else {
      setType("expense");
      const firstExpenseCat = categories.find((c) => c.type === "expense");
      if (firstExpenseCat) setCategoryId(firstExpenseCat.id);
      setAmount("");
      setNote("");
      setTransactionDate(defaultDate);
    }
  }, [editingTransaction, categories, defaultDate, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) setCategoryId(firstCat.id);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setSubmitting(true);
    try {
      await onSave({
        id: editingTransaction?.id,
        type,
        category_id: categoryId,
        amount: numericAmount,
        note: note.trim(),
        transaction_date: transactionDate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-white mb-1">
          {editingTransaction ? "แก้ไขรายการธุรกรรม" : "บันทึกรายการรับ-จ่ายใหม่"}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          เลือกประเภทรายการ หมวดหมู่ และจำนวนเงินเพื่ออัปเดตสรุปผลทันที
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === "income"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              รายรับ (Income)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              จำนวนเงิน (บาท) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xl font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Grid */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              เลือกหมวดหมู่ *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredCategories.map((cat) => {
                const selected = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? "bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/50"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}25`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                วันที่ทำรายการ *
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                บันทึกช่วยจำ (Note)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ค่าอาหารกลางวัน, ค่าน้ำมัน..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {editingTransaction ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>เพิ่มรายการ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
