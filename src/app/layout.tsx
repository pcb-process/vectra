import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VECTRA Finance | ระบบจัดการการเงินส่วนบุคคลอัจฉริยะ",
  description:
    "VECTRA Finance — แอปวางแผนการเงินส่วนบุคคล บันทึกรายรับ-รายจ่าย ตั้งงบประมาณพร้อมแจ้งเตือน และวิเคราะห์กระแสเงินสดในหน้าเดียว",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
    apple: ["/icon.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
