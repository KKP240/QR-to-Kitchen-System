import type { MenuItem } from "@qr-kitchen/shared";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/**
 * สถานะที่หน้าจอครัวใช้ — ถ้า OrderStatus ใน packages/shared ใช้ชื่ออื่น
 * ให้แก้ที่ type นี้ + COLUMNS + NEXT_ACTION เพียง 3 จุดนี้
 */
export type KitchenStatus = "pending" | "cooking" | "ready" | "served";

export type MenuMap = Record<string, MenuItem>;

export interface KitchenOrderItem {
  menuItemId: string;
  quantity: number;
  /** ถ้า backend ส่งชื่อ/ราคามาให้ จะใช้ค่านี้ก่อน ไม่งั้นไปหาจาก GET /menu */
  name?: string;
  price?: number;
}

/** โครงสร้างเข้ากันได้กับ Order ใน @qr-kitchen/shared — field ที่มี ? คือ optional */
export interface KitchenOrder {
  id: string;
  tableId: string;
  status: KitchenStatus;
  createdAt: string | number;
  items: KitchenOrderItem[];
  orderNo?: number | string;
  note?: string;
  startedAt?: string | number;
  servedAt?: string | number;
  total?: number;
}

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

export const POLL_MS = 3000;
export const SERVED_PREVIEW = 1;

export const STATUS_FLOW: KitchenStatus[] = ["pending", "cooking", "ready", "served"];

export const COLUMNS = [
  {
    status: "pending",
    title: "รอรับออเดอร์",
    hint: "รับออเดอร์ใหม่เพื่อเริ่มปรุง",
    dot: "bg-[var(--k-amber)]",
    count: "text-[var(--k-amber)]",
  },
  {
    status: "cooking",
    title: "กำลังปรุง",
    hint: "ใส่ใจทุกจานจากครัว",
    dot: "bg-[var(--k-blue)]",
    count: "text-[var(--k-blue)]",
  },
  {
    status: "ready",
    title: "พร้อมเสิร์ฟ",
    hint: "เรียกพนักงานนำส่งที่โต๊ะ",
    dot: "bg-[var(--k-green)]",
    count: "text-[var(--k-green)]",
  },
  {
    status: "served",
    title: "เสิร์ฟแล้ว",
    hint: "แสดงออเดอร์ที่เสิร์ฟล่าสุด",
    dot: "bg-[var(--k-gray)]",
    count: "text-[var(--k-gray)]",
  },
] as const;

/** ปุ่มหลักของการ์ดในแต่ละสถานะ → สถานะถัดไป */
export const NEXT_ACTION = {
  pending: { next: "cooking", label: "เริ่มปรุง" },
  cooking: { next: "ready", label: "พร้อมเสิร์ฟ" },
  ready: { next: "served", label: "ยืนยันเสิร์ฟแล้ว" },
} as const;

/** เกินกี่นาทีถึงเริ่มเตือนสีส้มที่เวลาบนการ์ด */
export const LATE_AFTER_MIN: Record<KitchenStatus, number> = {
  pending: 5,
  cooking: 20,
  ready: 5,
  served: Infinity,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

export const pad2 = pad;

export function toMs(v: string | number | undefined): number {
  return v === undefined ? NaN : new Date(v).getTime();
}

/** 12:35  (ใส่ " น." เองตอนแสดงผล) */
export function clock(v: string | number | undefined, withSeconds = false): string {
  const d = new Date(v ?? NaN);
  if (Number.isNaN(d.getTime())) return "-";
  const base = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
}

export function elapsedMinutes(createdAt: string | number, now: number): number {
  return Math.max(0, Math.floor((now - toMs(createdAt)) / 60000));
}

export function elapsedLabel(minutes: number): string {
  if (minutes < 1) return "เพิ่งเข้า";
  if (minutes < 60) return `${minutes} นาที`;
  return `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`;
}

export const tableLabel = (tableId: string) => `โต๊ะ ${tableId.padStart(2, "0")}`;

export const orderNumber = (o: KitchenOrder) =>
  `#${o.orderNo ?? o.id.replace(/[^0-9a-z]/gi, "").slice(-4).toUpperCase()}`;

export const formatBaht = (n: number) => `฿${n.toLocaleString("th-TH")}`;

export function thaiDate(d: Date): string {
  const weekday = new Intl.DateTimeFormat("th-TH", { weekday: "long" }).format(d).replace("วัน", "");
  const rest = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(d);
  return `${weekday} ${rest}`;
}

export function isSameDay(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/** รวมรายการอาหาร + ราคา โดยจับคู่กับเมนูจาก GET /menu */
export function summarize(order: KitchenOrder, menu: MenuMap) {
  const lines = order.items.map((i) => {
    const m = menu[i.menuItemId];
    return {
      key: i.menuItemId,
      name: i.name ?? m?.name ?? "ไม่พบเมนู",
      quantity: i.quantity,
      unitPrice: i.price ?? m?.price ?? 0,
    };
  });
  const pieces = lines.reduce((n, l) => n + l.quantity, 0);
  const total = order.total ?? lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  return { lines, pieces, total };
}