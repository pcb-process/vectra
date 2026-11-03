import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MATRIX FINANCE OS // Smart Personal Finance",
  description:
    "1-Page Cyber-Matrix Personal Finance Command Center — บันทึกรายรับ-รายจ่าย ตั้งงบประมาณพร้อมแจ้งเตือน และวิเคราะห์สุขภาพการเงิน (Next.js + Supabase)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#010802",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className="antialiased matrix-bg matrix-scanlines text-[#d4ffe0] min-h-screen selection:bg-[#00ff41] selection:text-black">
        {children}
      </body>
    </html>
  );
}
