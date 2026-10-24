import type { MenuItem } from "@qr-kitchen/shared";
import type { KitchenOrder, KitchenStatus } from "./kitchen";

/**
 * ข้อมูลจำลอง — เปิดใช้โดยใส่ NEXT_PUBLIC_USE_MOCK=true ใน .env.local
 * (ใช้ตอน backend /orders ยังตอบ 501)
 */
export const MOCK_MENU = [
  { id: "m1", name: "ข้าวไก่กระเทียม", price: 74, available: true },
  { id: "m2", name: "ข้าวไข่เจียวหมูสับ", price: 74, available: true },
  { id: "m3", name: "ข้าวกะเพราหมูสับไข่ดาว", price: 99, available: true },
  { id: "m4", name: "ต้มยำกุ้งน้ำข้น", price: 149, available: true },
  { id: "m5", name: "ชาไทยเย็น", price: 35, available: true },
  { id: "m6", name: "มะนาวโซดา", price: 35, available: true },
] as MenuItem[];

export function createMockOrders(now = Date.now()): KitchenOrder[] {
  const ago = (min: number) => now - min * 60_000;
  const make = (
    id: string,
    orderNo: number,
    tableId: string,
    minutesAgo: number,
    status: KitchenStatus,
    items: [string, number][],
    extra: Partial<KitchenOrder> = {},
  ): KitchenOrder => ({
    id,
    orderNo,
    tableId,
    status,
    createdAt: ago(minutesAgo),
    items: items.map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
    ...extra,
  });

  return [
    make("o1043", 1043, "2", 1, "pending", [["m1", 1], ["m2", 1]], { note: "ไข่เจียวไม่ใส่ต้นหอม" }),
    make("o1044", 1044, "7", 0, "pending", [["m3", 1], ["m5", 1]]),
    make("o1042", 1042, "5", 2, "cooking", [["m3", 2], ["m4", 1], ["m5", 1]], { startedAt: ago(1) }),
    make("o1041", 1041, "3", 6, "cooking", [["m2", 2], ["m6", 2]]),
    make("o1040", 1040, "1", 9, "ready", [["m4", 1], ["m3", 1]]),
    make("o1039", 1039, "4", 13, "served", [["m1", 2], ["m5", 2]], { servedAt: ago(1) }),
  ];
}