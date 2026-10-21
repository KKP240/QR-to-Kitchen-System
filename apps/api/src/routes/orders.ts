import { json, notImplemented } from "../lib/response";
import type { Route } from "../lib/types";

export const orderRoutes: Route[] = [
  // ลูกค้าสั่งอาหาร
  { method: "POST", path: "/orders", handler: async () => notImplemented("orders") },
  // จอครัว polling ดึงออเดอร์ (รองรับ ?status=pending,cooking)
  { method: "GET", path: "/orders", handler: async () => notImplemented("orders") },
  // ครัวเปลี่ยนสถานะ pending -> cooking -> ready -> served
  { method: "PATCH", path: "/orders/:id/status", handler: async () => notImplemented("orders") },
];