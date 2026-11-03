"use client";

import React from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Plus,
  Calendar,
  Cloud,
  Sparkles,
  LogOut,
  LogIn,
  Wallet,
} from "lucide-react";

export type ActiveTab = "dashboard" | "transactions" | "budgets";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  userEmail: string | null;
  isDemoMode: boolean;
  onSignOut: () => void;
  alertCount: number;
}

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

export function formatThaiMonthYear(monthYear: string): string {
  const [yearStr, monthStr] = monthYear.split("-");
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (isNaN(year) || monthIdx < 0 || monthIdx > 11) return monthYear;
  return `${THAI_MONTHS[monthIdx]} ${year + 543}`;
}

export function Navbar({
  activeTab,
  setActiveTab,
  selectedMonth,
  setSelectedMonth,
  onOpenAddModal,
  onOpenAuthModal,
  userEmail,
  isDemoMode,
  onSignOut,
  alertCount,
}: NavbarProps) {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "dashboard",
      label: "ภาพรวม (Dashboard)",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "transactions",
      label: "รายรับ-รายจ่าย",
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
    {
      id: "budgets",
      label: "งบประมาณ & แจ้งเตือน",
      icon: <Target className="w-5 h-5" />,
      badge: alertCount > 0 ? alertCount : undefined,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800 min-h-screen p-6 shrink-0 select-none">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Smart Finance</h1>
            <p className="text-xs text-slate-400">วางแผนการเงินส่วนบุคคลอัจฉริยะ</p>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onOpenAddModal}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mb-6"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>บันทึกรายการใหม่</span>
        </button>

        {/* Month Selector */}
        <div className="mb-6 bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>รอบเดือนที่แสดงผล</span>
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-900 text-white text-sm font-medium px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
          />
          <div className="mt-1.5 text-xs text-emerald-400 font-medium">
            {formatThaiMonthYear(selectedMonth)}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Connection / User Footer */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          {isDemoMode ? (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>โหมดทดลองใช้งาน (Demo Mode)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                ข้อมูลถูกเก็บไว้ในเบราว์เซอร์ชั่วคราว ล็อกอินเพื่อซิงค์ขึ้น Supabase Cloud
              </p>
              <button
                onClick={onOpenAuthModal}
                className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <Cloud className="w-4 h-4" />
                <span>เชื่อมต่อ Supabase Cloud แล้ว</span>
              </div>
              <p className="text-xs text-slate-300 truncate mb-3" title={userEmail || ""}>
                {userEmail}
              </p>
              <button
                onClick={onSignOut}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Smart Finance</h1>
            <p className="text-[11px] text-emerald-400 font-medium">
              {formatThaiMonthYear(selectedMonth)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
          />
          {isDemoMode ? (
            <button
              onClick={onOpenAuthModal}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-amber-300 font-medium flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Cloud</span>
            </button>
          ) : (
            <button
              onClick={onSignOut}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center gap-1"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>ออก</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-medium ${
                isActive ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              {item.icon}
              <span className="text-[11px]">{item.label.split(" ")[0]}</span>
              {item.badge !== undefined && (
                <span className="absolute top-0.5 right-2 w-4 h-4 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[11px]">จดรายการ</span>
        </button>
      </nav>
    </>
  );
}
