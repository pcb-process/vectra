"use client";

import React, { useState } from "react";
import { X, Mail, Lock, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "./BrandLogo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          onAuthSuccess();
          onClose();
        } else {
          setInfoMsg(
            "สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน หรือเข้าสู่ระบบได้ทันที"
          );
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase Auth";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3">
      <div className="matrix-card-intense w-full max-w-sm p-4 sm:p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center text-[#00ff41]/80 hover:text-[#00ff41] hover:bg-[#00ff41]/15 border border-[#00ff41]/30 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pr-10">
          <BrandLogo size="sm" />
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold matrix-text-glow-lg truncate">
              {mode === "login" ? "เข้าสู่ระบบ VECTRA" : "สร้างบัญชี VECTRA"}
            </h2>
            <p className="text-[11px] text-[#80ff9e]/75 truncate">
              ซิงค์ข้อมูลข้ามอุปกรณ์ผ่านระบบ Cloud
            </p>
          </div>
        </div>

        {/* Mode Switcher (Strictly Single-Line) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/85 border border-[#00ff41]/40 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`h-9 px-2 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              mode === "login"
                ? "matrix-btn-glow"
                : "text-[#80ff9e]/70 hover:text-[#00ff41]"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`h-9 px-2 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              mode === "register"
                ? "matrix-btn-glow"
                : "text-[#80ff9e]/70 hover:text-[#00ff41]"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 matrix-card-danger flex items-start gap-2 text-xs text-[#ff80ab]">
            <AlertCircle className="w-4 h-4 text-[#ff0055] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-3 p-2.5 matrix-card flex items-start gap-2 text-xs text-[#b9ffce]">
            <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#80ff9e] mb-1">
              อีเมล
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#00ff41] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-9 pl-9 pr-3 matrix-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#80ff9e] mb-1">
              รหัสผ่าน (6 ตัวอักษรขึ้นไป)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#00ff41] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 pl-9 pr-3 matrix-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 matrix-btn-glow text-xs cursor-pointer disabled:opacity-50"
          >
            {loading
              ? "กำลังดำเนินการ..."
              : mode === "login"
              ? "เข้าสู่ระบบ"
              : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#00ff41]/30 flex items-center justify-between gap-2 text-xs text-[#80ff9e]/80">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
            <span className="truncate">ใช้งานโหมดตัวอย่าง</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="matrix-text-glow hover:underline font-bold cursor-pointer whitespace-nowrap shrink-0"
          >
            ทดลองต่อ →
          </button>
        </div>
      </div>
    </div>
  );
}
