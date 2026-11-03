"use client";

import React, { useEffect, useState } from "react";
import { X, Target, Coins, BellRing, Layers, Check } from "lucide-react";
import { Category } from "@/types/finance";
import { CategoryIcon } from "./CategoryIcon";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: Category[];
  initialCategoryId?: number;
  initialLimit?: number;
  initialThreshold?: number;
  onSave: (payload: {
    category_id: number;
    amount_limit: number;
    alert_threshold: number;
  }) => Promise<void>;
}

export function BudgetModal({
  isOpen,
  onClose,
  expenseCategories,
  initialCategoryId,
  initialLimit,
  initialThreshold,
  onSave,
}: BudgetModalProps) {
  const [categoryId, setCategoryId] = useState<number>(8);
  const [amountLimit, setAmountLimit] = useState<string>("6000");
  const [alertThreshold, setAlertThreshold] = useState<string>("80");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialCategoryId) {
      setCategoryId(initialCategoryId);
    } else if (expenseCategories[0]) {
      setCategoryId(expenseCategories[0].id);
    }
    setAmountLimit(initialLimit ? String(initialLimit) : "6000");
    setAlertThreshold(initialThreshold ? String(initialThreshold) : "80");
  }, [initialCategoryId, initialLimit, initialThreshold, expenseCategories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(amountLimit);
    const thresholdNum = parseFloat(alertThreshold);
    if (isNaN(limitNum) || limitNum <= 0) return;

    setSaving(true);
    try {
      await onSave({
        category_id: categoryId,
        amount_limit: limitNum,
        alert_threshold: isNaN(thresholdNum)
          ? 80
          : Math.min(100, Math.max(10, thresholdNum)),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3">
      <div className="matrix-card-intense w-full max-w-md p-4 sm:p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-9 h-9 flex items-center justify-center text-[#00ff41]/80 hover:text-[#00ff41] hover:bg-[#00ff41]/15 border border-[#00ff41]/30 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pr-10">
          <div className="w-8 h-8 bg-[#00ff41]/15 border border-[#00ff41]/60 flex items-center justify-center text-[#00ff41] shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold matrix-text-glow-lg truncate">
              ตั้งงบประมาณรายเดือน
            </h2>
            <p className="text-[11px] text-[#80ff9e]/70">
              กำหนดวงเงินและเปอร์เซ็นต์แจ้งเตือนตามหมวดหมู่
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection Grid */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#80ff9e] mb-2">
              <Layers className="w-3.5 h-3.5 text-[#00ff41]" />
              <span>หมวดหมู่รายจ่าย</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[210px] overflow-y-auto pr-1">
              {expenseCategories.map((cat) => {
                const selected = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2.5 min-h-[44px] border text-left transition-all cursor-pointer ${
                      selected
                        ? "bg-[#00ff41]/20 border-[#00ff41] text-white"
                        : "bg-black/60 border-[#00ff41]/25 text-[#b9ffce]/80 hover:border-[#00ff41]/60"
                    }`}
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                        border: `1px solid ${cat.color}66`,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#80ff9e] mb-1.5">
                <Coins className="w-3.5 h-3.5 text-[#00ff41]" />
                <span>วงเงินงบ (บาท)</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amountLimit}
                onChange={(e) => setAmountLimit(e.target.value)}
                className="w-full h-10 px-3 matrix-input text-sm font-bold"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#80ff9e] mb-1.5">
                <BellRing className="w-3.5 h-3.5 text-[#00ff41]" />
                <span>แจ้งเตือนที่ (%)</span>
              </label>
              <input
                type="number"
                min="10"
                max="100"
                required
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full h-10 px-3 matrix-input text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 matrix-btn-outline text-xs font-bold flex items-center justify-center cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 matrix-btn-glow text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>บันทึกงบประมาณ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
