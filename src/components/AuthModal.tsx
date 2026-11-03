"use client";

import React, { useState } from "react";
import { X, Mail, Lock, Cloud, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="matrix-card-intense w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#00ff41]/70 hover:text-[#00ff41] hover:bg-[#00ff41]/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#00ff41]/15 border border-[#00ff41] flex items-center justify-center text-[#00ff41]">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold matrix-text-glow-lg">
              {mode === "login" ? "เข้าสู่ระบบ (Supabase Cloud)" : "สมัครสมาชิกใหม่"}
            </h2>
            <p className="text-xs text-[#80ff9e]/80">
              ซิงค์ข้อมูลรายรับ-รายจ่ายและงบประมาณข้ามอุปกรณ์อย่างปลอดภัย
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/85 border border-[#00ff41]/40 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 text-xs font-extrabold transition-all cursor-pointer ${
              mode === "login"
                ? "matrix-btn-glow"
                : "text-[#80ff9e]/70 hover:text-[#00ff41]"
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 text-xs font-extrabold transition-all cursor-pointer ${
              mode === "register"
                ? "matrix-btn-glow"
                : "text-[#80ff9e]/70 hover:text-[#00ff41]"
            }`}
          >
            สมัครสมาชิก (Sign Up)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 matrix-card-danger flex items-start gap-2.5 text-xs text-[#ff80ab]">
            <AlertCircle className="w-4 h-4 text-[#ff0055] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 matrix-card flex items-start gap-2.5 text-xs text-[#b9ffce]">
            <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#80ff9e] mb-1.5">
              อีเมล (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#00ff41] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 matrix-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#80ff9e] mb-1.5">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#00ff41] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 matrix-input text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 matrix-btn-glow text-sm cursor-pointer disabled:opacity-50"
          >
            {loading
              ? "กำลังดำเนินการ..."
              : mode === "login"
              ? "เข้าสู่ระบบ"
              : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#00ff41]/30 flex items-center justify-between text-xs text-[#80ff9e]/80">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
            <span>หรือใช้งานต่อในโหมดตัวอย่าง</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="matrix-text-glow hover:underline font-bold cursor-pointer"
          >
            ใช้โหมดทดลองต่อ →
          </button>
        </div>
      </div>
    </div>
  );
}
