"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuItem } from "@qr-kitchen/shared";
import { api } from "@/lib/api";
import { KitchenOrder, KitchenStatus, MenuMap, POLL_MS, STATUS_FLOW } from "./kitchen";
import { createMockOrders, MOCK_MENU } from "./kitchenMock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const toMenuMap = (items: MenuItem[]): MenuMap => Object.fromEntries(items.map((i) => [i.id, i]));

/** เวลาปัจจุบัน (ms) อัปเดตทุก intervalMs — เป็น null ก่อน mount เพื่อเลี่ยง hydration mismatch */
export function useNow(intervalMs = 15000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useKitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [menu, setMenu] = useState<MenuMap>({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const ordersRef = useRef<KitchenOrder[]>([]);
  ordersRef.current = orders;
  /** ออเดอร์ที่กำลังรอ PATCH — กัน polling เขียนทับสถานะที่เพิ่งกด */
  const inflight = useRef(new Map<string, KitchenStatus>());
  const menuLoaded = useRef(false);

  /* ---------- Polling ---------- */
  useEffect(() => {
    if (USE_MOCK) {
      setMenu(toMenuMap(MOCK_MENU));
      setOrders(createMockOrders());
      setUpdatedAt(Date.now());
      setLoading(false);
      const t = setInterval(() => setUpdatedAt(Date.now()), POLL_MS);
      return () => clearInterval(t);
    }

    let stop = false;

    async function load() {
      if (document.hidden) return; // แท็บไม่ได้เปิดอยู่ ไม่ต้องยิง API

      if (!menuLoaded.current) {
        try {
          const { items } = await api<{ items: MenuItem[] }>("/menu");
          if (!stop) {
            setMenu(toMenuMap(items));
            menuLoaded.current = true;
          }
        } catch {
          /* ลองใหม่รอบถัดไป */
        }
      }

      try {
        const data = await api<{ orders: KitchenOrder[] }>(`/orders?status=${STATUS_FLOW.join(",")}`);
        if (stop) return;
        setOrders(
          data.orders.map((o) => {
            const local = inflight.current.get(o.id);
            return local ? { ...o, status: local } : o;
          }),
        );
        setConnected(true);
        setUpdatedAt(Date.now());
      } catch {
        // แสดงสถานะ "เชื่อมต่อไม่ได้" แต่ไม่หยุด polling
        if (!stop) setConnected(false);
      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, POLL_MS);
    const onVisible = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  /* ---------- เปลี่ยนสถานะ (optimistic update) ---------- */
  const advance = useCallback(async (id: string, status: KitchenStatus) => {
    const previous = ordersRef.current.find((o) => o.id === id)?.status;
    const stamp = new Date().toISOString();

    inflight.current.set(id, status);
    setPendingIds((ids) => [...ids, id]);
    setOrders((list) =>
      list.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              ...(status === "cooking" ? { startedAt: stamp } : {}),
              ...(status === "served" ? { servedAt: stamp } : {}),
            }
          : o,
      ),
    );

    try {
      if (!USE_MOCK) {
        const updated = await api<Partial<KitchenOrder>>(`/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...updated, status } : o)));
      }
    } catch {
      if (previous) setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: previous } : o)));
      setActionError("อัปเดตสถานะไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      inflight.current.delete(id);
      setPendingIds((ids) => ids.filter((x) => x !== id));
    }
  }, []);

  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 4000);
    return () => clearTimeout(t);
  }, [actionError]);

  return { orders, menu, loading, connected, updatedAt, pendingIds, actionError, advance };
}