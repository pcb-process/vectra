export type TransactionType = "income" | "expense";

export interface Category {
  id: number;
  user_id: string | null;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  created_at?: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  category_id: number | null;
  type: TransactionType;
  amount: number;
  note: string;
  transaction_date: string; // YYYY-MM-DD
  created_at?: string;
  category?: Category;
}

export interface Budget {
  id: number;
  user_id: string;
  category_id: number;
  month_year: string; // YYYY-MM
  amount_limit: number;
  alert_threshold: number; // default 80
  created_at?: string;
  category?: Category;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, user_id: null, name: "เงินเดือน", type: "income", icon: "Briefcase", color: "#00ff41" },
  { id: 6, user_id: null, name: "รายได้เสริม / ฟรีแลนซ์", type: "income", icon: "TrendingUp", color: "#00ffd5" },
  { id: 4, user_id: null, name: "โบนัส / เงินปันผล", type: "income", icon: "Gift", color: "#76ff03" },
  { id: 8, user_id: null, name: "อาหารและเครื่องดื่ม", type: "expense", icon: "Utensils", color: "#00ff88" },
  { id: 9, user_id: null, name: "การเดินทาง / น้ำมัน", type: "expense", icon: "Car", color: "#00e5ff" },
  { id: 3, user_id: null, name: "ที่อยู่อาศัย / ค่าน้ำ-ค่าไฟ", type: "expense", icon: "Home", color: "#39ff14" },
  { id: 5, user_id: null, name: "ช้อปปิ้ง / ของใช้ส่วนตัว", type: "expense", icon: "ShoppingBag", color: "#ff0055" },
  { id: 2, user_id: null, name: "สุขภาพ / การแพทย์", type: "expense", icon: "HeartPulse", color: "#ff4081" },
  { id: 10, user_id: null, name: "ความบันเทิง / สมาชิกรายเดือน", type: "expense", icon: "Film", color: "#ffc400" },
  { id: 7, user_id: null, name: "การออม / ลงทุน", type: "expense", icon: "PiggyBank", color: "#00ffa6" },
];

export function getInitialDemoTransactions(monthYear: string): Transaction[] {
  return [
    {
      id: 101,
      user_id: "demo-user",
      category_id: 1,
      type: "income",
      amount: 45000,
      note: "เงินเดือนประจำเดือน",
      transaction_date: `${monthYear}-01`,
    },
    {
      id: 102,
      user_id: "demo-user",
      category_id: 6,
      type: "income",
      amount: 8500,
      note: "รับงานออกแบบระบบ Freelance",
      transaction_date: `${monthYear}-05`,
    },
    {
      id: 103,
      user_id: "demo-user",
      category_id: 3,
      type: "expense",
      amount: 8500,
      note: "ค่าเช่าคอนโด + ค่าน้ำค่าไฟ",
      transaction_date: `${monthYear}-02`,
    },
    {
      id: 104,
      user_id: "demo-user",
      category_id: 7,
      type: "expense",
      amount: 10000,
      note: "DCA กองทุนดัชนี S&P500 และเงินออม",
      transaction_date: `${monthYear}-03`,
    },
    {
      id: 105,
      user_id: "demo-user",
      category_id: 8,
      type: "expense",
      amount: 2450,
      note: "ซื้อของสดเข้าตู้เย็นและกาแฟรายสัปดาห์",
      transaction_date: `${monthYear}-04`,
    },
    {
      id: 106,
      user_id: "demo-user",
      category_id: 8,
      type: "expense",
      amount: 3100,
      note: "สังสรรค์มื้อเย็นกับครอบครัวและอาหารกลางวัน",
      transaction_date: `${monthYear}-08`,
    },
    {
      id: 107,
      user_id: "demo-user",
      category_id: 9,
      type: "expense",
      amount: 1850,
      note: "เติมน้ำมันและบัตรรถไฟฟ้า BTS/MRT",
      transaction_date: `${monthYear}-09`,
    },
    {
      id: 108,
      user_id: "demo-user",
      category_id: 5,
      type: "expense",
      amount: 3200,
      note: "ซื้ออุปกรณ์ไอทีและของใช้ส่วนตัว",
      transaction_date: `${monthYear}-11`,
    },
    {
      id: 109,
      user_id: "demo-user",
      category_id: 10,
      type: "expense",
      amount: 699,
      note: "ค่าสมาชิก Netflix, YouTube Premium, Spotify",
      transaction_date: `${monthYear}-12`,
    },
  ];
}

export function getInitialDemoBudgets(monthYear: string): Budget[] {
  return [
    {
      id: 201,
      user_id: "demo-user",
      category_id: 8, // อาหารและเครื่องดื่ม (ใช้ไป 5,550 / 6,000 = 92.5% -> ใกล้เต็มงบ!)
      month_year: monthYear,
      amount_limit: 6000,
      alert_threshold: 80,
    },
    {
      id: 202,
      user_id: "demo-user",
      category_id: 5, // ช้อปปิ้ง (ใช้ไป 3,200 / 3,000 = 106.7% -> เกินงบ!)
      month_year: monthYear,
      amount_limit: 3000,
      alert_threshold: 80,
    },
    {
      id: 203,
      user_id: "demo-user",
      category_id: 9, // การเดินทาง (ใช้ไป 1,850 / 3,500 = 52.8% -> ปกติ)
      month_year: monthYear,
      amount_limit: 3500,
      alert_threshold: 80,
    },
    {
      id: 204,
      user_id: "demo-user",
      category_id: 3, // ที่อยู่อาศัย (ใช้ไป 8,500 / 9,000 = 94.4% -> ใกล้เต็มงบ)
      month_year: monthYear,
      amount_limit: 9000,
      alert_threshold: 85,
    },
    {
      id: 205,
      user_id: "demo-user",
      category_id: 10, // ความบันเทิง (ใช้ไป 699 / 1,500 = 46.6% -> ปกติ)
      month_year: monthYear,
      amount_limit: 1500,
      alert_threshold: 80,
    },
  ];
}
