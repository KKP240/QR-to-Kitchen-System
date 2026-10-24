import type { MenuItem, Order, OrderStatus } from "@qr-kitchen/shared";

export type CartLine = {
  item: MenuItem;
  quantity: number;
};

export const DEFAULT_TABLE = "05";
export const SERVICE_FEE = 0;

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const categoryImages: Record<string, string> = {
  จานเดียว: photo("photo-1631515243349-e0cb75fb8d3a"),
  กับข้าว: photo("photo-1455619452474-d2be8b1e70cd"),
  เครื่องดื่ม: photo("photo-1461023058943-07fcbe16d735"),
  ของหวาน: photo("photo-1567620905732-2d1ec7ab7445"),
};

const categoryDescriptions: Record<string, string> = {
  จานเดียว: "จานเดียวอิ่มกำลังดี ปรุงสดใหม่ทุกจาน",
  กับข้าว: "กับข้าวรสกลมกล่อม เสิร์ฟพร้อมข้าวสวยร้อน ๆ",
  เครื่องดื่ม: "เครื่องดื่มเย็นชื่นใจ หวานกำลังดี",
  ของหวาน: "ของหวานหอมหวาน ปิดท้ายมื้ออาหาร",
};

const drinkHints = ["ชา", "กาแฟ", "น้ำ", "โซดา", "นม", "โกโก้", "สมูทตี้", "เบียร์", "ไวน์", "ค็อกเทล", "มะนาว"];
const sharedDishHints = ["ต้ม", "แกง", "ยำ", "ทอด", "เกี๊ยว", "ปีก", "หมูกรอบ", "ย่าง"];

export function inferCategory(name: string): string {
  const normalized = name.trim();
  if (drinkHints.some((hint) => normalized.includes(hint))) return "เครื่องดื่ม";
  if (normalized.startsWith("ข้าว") || normalized.startsWith("ผัด")) return "จานเดียว";
  if (sharedDishHints.some((hint) => normalized.includes(hint))) return "กับข้าว";
  return "จานเดียว";
}

export function decorateItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    const category = item.category?.trim() || inferCategory(item.name);
    return {
      ...item,
      category,
      description: item.description?.trim() || categoryDescriptions[category] || categoryDescriptions["จานเดียว"],
      imageUrl: item.imageUrl?.trim() || categoryImages[category] || categoryImages["จานเดียว"],
      price: Number(item.price) || 0,
    };
  });
}

export function buildCategories(items: MenuItem[]): string[] {
  const preferred = ["จานเดียว", "เครื่องดื่ม", "กับข้าว", "ของหวาน"];
  const found = Array.from(new Set(items.map((item) => item.category).filter(Boolean))) as string[];
  found.sort((a, b) => {
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return ["ทั้งหมด", "แนะนำ", ...found];
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH").format(Math.round(value));
}

export function formatClock(value?: string): string {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatWaitRange(createdAt: string): string {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "ประมาณ 15 นาที";
  const end = new Date(start.getTime() + 10 * 60 * 1000);
  const finish = new Date(start.getTime() + 20 * 60 * 1000);
  return `${formatClock(end.toISOString())}–${formatClock(finish.toISOString())} น.`;
}

export function remainingMinutes(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 15;
  const elapsed = (Date.now() - created) / 60000;
  return Math.max(1, Math.round(15 - elapsed));
}

export function orderDisplayNo(id: string): string {
  let hash = 7;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  return String(1000 + hash);
}

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
}

export function orderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export type OrderStep = {
  label: string;
  time: string;
  state: "done" | "current" | "todo";
};

const stepLabels = ["สั่งแล้ว", "ครัวรับออเดอร์", "กำลังปรุง", "เสิร์ฟแล้ว"];

export function buildOrderSteps(order: Order): OrderStep[] {
  const history = new Map((order.statusHistory ?? []).map((entry) => [entry.status, entry.timestamp]));
  const cookingAt = history.get("cooking");
  const readyAt = history.get("ready");
  const servedAt = history.get("served");
  const times = [
    order.createdAt,
    cookingAt,
    cookingAt ?? readyAt,
    servedAt,
  ];
  const activeIndex: Record<OrderStatus, number> = {
    pending: 1,
    cooking: 2,
    ready: 3,
    served: 4,
  };
  const active = activeIndex[order.status] ?? 0;
  return stepLabels.map((label, index) => {
    const state = index < active ? "done" : index === active ? "current" : "todo";
    return {
      label,
      time: state === "done" ? formatClock(times[index]) : "--:--",
      state,
    };
  });
}

export type StatusView = {
  tone: "pending" | "cooking" | "ready" | "served";
  label: string;
  heading: string;
  description: string;
  wait: string;
  line: string;
  icon: "bag" | "cloche" | "bell" | "check";
};

export function statusView(order: Order): StatusView {
  const remaining = remainingMinutes(order.createdAt);
  const views: Record<OrderStatus, StatusView> = {
    pending: {
      tone: "pending",
      label: "รอครัวยืนยัน",
      heading: "ครัวกำลังยืนยันออเดอร์",
      description: "ส่งออเดอร์ถึงครัวแล้ว ขอสักครู่ให้พ่อครัวรับออเดอร์ของคุณ",
      wait: `ประมาณ ${formatWaitRange(order.createdAt)}`,
      line: `ยังไม่เริ่มทำอาหาร · รออีกประมาณ ${remaining} นาที`,
      icon: "bag",
    },
    cooking: {
      tone: "cooking",
      label: "กำลังปรุง",
      heading: "ครัวกำลังปรุงความอร่อย",
      description: "พ่อครัวกำลังปรุงอาหารของคุณด้วยความตั้งใจ ระหว่างนี้รอสักครู่นะ",
      wait: `ประมาณ ${formatWaitRange(order.createdAt)}`,
      line: `ครัวกำลังปรุง · อีกประมาณ ${remaining} นาที`,
      icon: "cloche",
    },
    ready: {
      tone: "ready",
      label: "อาหารพร้อมเสิร์ฟ",
      heading: "อาหารพร้อมเสิร์ฟแล้ว",
      description: "ครัวทำอาหารเสร็จแล้ว พนักงานกำลังนำไปเสิร์ฟที่โต๊ะของคุณ",
      wait: "พร้อมเสิร์ฟแล้ว",
      line: "อาหารพร้อมแล้ว · รอพนักงานเสิร์ฟ",
      icon: "bell",
    },
    served: {
      tone: "served",
      label: "เสิร์ฟแล้ว",
      heading: "อร่อยกับมื้อนี้เลย",
      description: "เสิร์ฟครบทุกจานแล้ว ขอบคุณที่ใช้บริการ หวังว่าจะถูกใจนะ",
      wait: "เสิร์ฟครบแล้ว",
      line: "เสิร์ฟครบแล้ว · ขอบคุณที่ใช้บริการ",
      icon: "check",
    },
  };
  return views[order.status] ?? views.pending;
}
