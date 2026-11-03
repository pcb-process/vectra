import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Personal Finance | แอปวางแผนการเงินส่วนบุคคลอัจฉริยะ",
  description:
    "บันทึกรายรับ-รายจ่าย ตั้งงบประมาณรายเดือนพร้อมระบบแจ้งเตือน และวิเคราะห์สุขภาพทางการเงินด้วย Dashboard อัจฉริยะ (Next.js + Supabase)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
