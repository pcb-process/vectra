"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  PlusCircle,
  Save,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Layers,
  Calendar,
  FileText,
} from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3">
      <div className="matrix-card-intense w-full max-w-md p-3.5 sm:p-5 relative max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-[#00ff41]/80 hover:text-[#00ff41] hover:bg-[#00ff41]/15 border border-[#00ff41]/30 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3 pr-10">
          <Wallet className="w-4 h-4 text-[#00ff41] shrink-0" />
          <h2 className="text-sm sm:text-base font-bold matrix-text-glow-lg truncate">
            {editingTransaction ? "แก้ไขรายการรับ-จ่าย" : "บันทึกรายการรับ-จ่าย"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type Toggle (Single-Line) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/90 border border-[#00ff41]/40">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`h-9 px-2 text-xs font-extrabold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === "expense"
                  ? "bg-[#ff0055] text-white"
                  : "text-[#80ff9e]/60 hover:text-[#00ff41]"
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5 shrink-0" />
              <span>รายจ่าย</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`h-9 px-2 text-xs font-extrabold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === "income"
                  ? "bg-[#00ff41] text-black"
                  : "text-[#80ff9e]/60 hover:text-[#00ff41]"
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>รายรับ</span>
            </button>
          </div>

          {/* Amount + Date Side-by-Side (Saves Vertical Height) */}
          <div className="grid grid-cols-12 gap-2.5">
            <div className="col-span-6 min-w-0">
              <label className="flex items-center gap-1 text-xs font-semibold text-[#80ff9e] mb-1 truncate">
                <Banknote className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
                <span className="truncate">จำนวนเงิน (฿) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 px-2.5 matrix-input text-sm font-extrabold matrix-text-glow-lg"
              />
            </div>

            <div className="col-span-6 min-w-0">
              <label className="flex items-center gap-1 text-xs font-semibold text-[#80ff9e] mb-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
                <span className="truncate">วันที่ *</span>
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full h-9 px-2 matrix-input text-xs font-semibold"
              />
            </div>
          </div>

          {/* Category Grid (Single-Line Pills, No Multi-Line Wrapping) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#80ff9e] mb-1.5">
              <Layers className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
              <span>เลือกหมวดหมู่ *</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {filteredCategories.map((cat) => {
                const selected = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 px-2.5 h-9 border text-left transition-all cursor-pointer min-w-0 ${
                      selected
                        ? "bg-[#00ff41]/20 border-[#00ff41] text-white shadow-[0_0_8px_rgba(0,255,65,0.35)]"
                        : "bg-black/60 border-[#00ff41]/25 text-[#b9ffce]/80 hover:border-[#00ff41]/60"
                    }`}
                  >
                    <div
                      className="w-5 h-5 flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                        border: `1px solid ${cat.color}66`,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold truncate whitespace-nowrap">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#80ff9e] mb-1">
              <FileText className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
              <span>บันทึกช่วยจำ</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ค่ากาแฟ, เงินเดือน..."
              className="w-full h-9 px-3 matrix-input text-xs"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 matrix-btn-outline text-xs font-bold flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 matrix-btn-glow text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {editingTransaction ? (
                <>
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>บันทึก</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
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
