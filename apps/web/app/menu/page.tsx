"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MenuItem, Order } from "@qr-kitchen/shared";
import { api } from "@/lib/api";
import { AuthGate, SignOutButton, useAuthUser } from "@/components/auth-gate";
import styles from "./menu.module.css";
import { MenuView } from "./menu-view";
import { CartView } from "./cart-view";
import { TrackingView } from "./tracking-view";
import {
  DEFAULT_TABLE,
  decorateItems,
  formatNumber,
  type CartLine,
} from "./menu-data";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChairIcon,
  CloseIcon,
  LogoIcon,
} from "./icons";

type Screen = "menu" | "cart" | "tracking";

export default function MenuPage() {
  return (
    <AuthGate roles={["customer"]}>
      <Suspense fallback={<MenuPageFallback />}>
        <MenuPageContent />
      </Suspense>
    </AuthGate>
  );
}

function MenuPageFallback() {
  return (
    <main className={styles.page}>
      <div className={styles.app}>
        <MenuTopBar table={DEFAULT_TABLE} />
        <div className={styles.screen}>
          <MenuView
            items={[]}
            cart={{}}
            loading
            error={null}
            table={DEFAULT_TABLE}
            onAdd={() => {}}
            onRemove={() => {}}
            onRetry={() => {}}
          />
        </div>
      </div>
    </main>
  );
}

function MenuPageContent() {
  const searchParams = useSearchParams();
  const tableFromUrl = (searchParams.get("table") ?? "").trim();
  const orderIdFromUrl = (searchParams.get("order") ?? "").trim();
  const table = tableFromUrl || DEFAULT_TABLE;

  const [screen, setScreen] = useState<Screen>("menu");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOrder, setCartOrder] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchMenu = useCallback(() => api<{ items: MenuItem[] }>("/menu"), []);

  const applyMenu = useCallback((data: { items: MenuItem[] }) => {
    setItems(decorateItems(data.items ?? []));
    setError(null);
  }, []);

  const applyMenuError = useCallback((requestError: unknown) => {
    setItems([]);
    const detail = requestError instanceof Error ? requestError.message : "เชื่อมต่อไม่สำเร็จ";
    setError(`กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง (${detail})`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMenu()
      .then((data) => {
        if (!cancelled) applyMenu(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) applyMenuError(requestError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyMenu, applyMenuError, fetchMenu]);

  const retryMenu = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMenu()
      .then(applyMenu)
      .catch(applyMenuError)
      .finally(() => setLoading(false));
  }, [applyMenu, applyMenuError, fetchMenu]);

  useEffect(() => {
    if (!orderIdFromUrl) return;
    let cancelled = false;
    api<Order>(`/orders/${encodeURIComponent(orderIdFromUrl)}`)
      .then((found) => {
        if (cancelled) return;
        setOrder(found);
        setScreen("tracking");
      })
      .catch(() => {
        if (!cancelled) setToast("ไม่พบออเดอร์ล่าสุด เลือกเมนูใหม่ได้เลย");
      });
    return () => {
      cancelled = true;
    };
  }, [orderIdFromUrl]);

  useEffect(() => {
    const titles: Record<Screen, string> = {
      menu: "เมนูอาหาร · ใบกะเพรา",
      cart: "ตะกร้าของคุณ · ใบกะเพรา",
      tracking: "ติดตามออเดอร์ · ใบกะเพรา",
    };
    document.title = titles[screen];
  }, [screen]);

  const lines = useMemo<CartLine[]>(
    () =>
      cartOrder
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is MenuItem => Boolean(item))
        .map((item) => ({ item, quantity: cart[item.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [cart, cartOrder, items]
  );

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

  const addItem = useCallback((item: MenuItem) => {
    if (!item.available) return;
    setCart((previous) => ({
      ...previous,
      [item.id]: Math.min(99, (previous[item.id] ?? 0) + 1),
    }));
    setCartOrder((previous) => (previous.includes(item.id) ? previous : [...previous, item.id]));
  }, []);

  const removeOne = useCallback((id: string) => {
    setCart((previous) => {
      const next = { ...previous };
      const quantity = (next[id] ?? 0) - 1;
      if (quantity > 0) next[id] = quantity;
      else delete next[id];
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    setCartOrder([]);
    setNote("");
    setSubmitError(null);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goTo = useCallback(
    (next: Screen) => {
      setScreen(next);
      scrollToTop();
    },
    [scrollToTop]
  );

  const syncUrl = useCallback((nextTable: string, orderId?: string) => {
    const params = new URLSearchParams();
    params.set("table", nextTable);
    if (orderId) params.set("order", orderId);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  const backToMenu = useCallback(() => {
    setScreen("menu");
    setOrder(null);
    setSubmitError(null);
    syncUrl(table);
    scrollToTop();
  }, [scrollToTop, syncUrl, table]);

  const checkout = useCallback(async () => {
    if (lines.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const payloadItems = lines.map(({ item, quantity }) => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
    }));

    try {
      const created = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          tableId: table,
          items: payloadItems,
          note: note.trim() || undefined,
        }),
      });

      const normalizedOrder: Order = {
        ...created,
        items: created.items?.length ? created.items : payloadItems,
        note: created.note ?? (note.trim() || undefined),
      };

      setOrder(normalizedOrder);
      setCart({});
      setCartOrder([]);
      setNote("");
      setScreen("tracking");
      syncUrl(table, created.id);
      scrollToTop();
    } catch (requestError) {
      const detail = requestError instanceof Error ? requestError.message : "เชื่อมต่อไม่สำเร็จ";
      setSubmitError(`ส่งออเดอร์ไม่สำเร็จ (${detail}) กรุณาลองอีกครั้ง`);
    } finally {
      setSubmitting(false);
    }
  }, [lines, note, scrollToTop, submitting, syncUrl, table]);

  const orderId = order?.id;
  const orderStatus = order?.status;

  useEffect(() => {
    if (screen !== "tracking" || !orderId || orderStatus === "served") return;

    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const next = await api<Order>(`/orders/${encodeURIComponent(orderId)}`);
        if (!cancelled) {
          setOrder((previous) => (previous && previous.id === orderId ? { ...previous, ...next } : previous));
        }
      } catch {
        // Keep the last known status and try again on the next tick.
      }
    };

    const timer = window.setInterval(poll, 6000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [orderId, orderStatus, screen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <main className={styles.page}>
      <div className={styles.app}>
        {screen === "menu" ? (
          <MenuTopBar table={table} />
        ) : (
          <SubTopBar
            title={screen === "cart" ? "ตะกร้าของคุณ" : "ติดตามออเดอร์"}
            table={table}
            onBack={screen === "cart" ? goTo.bind(null, "menu") : backToMenu}
          />
        )}

        <div className={styles.screen} key={screen}>
          {screen === "menu" && (
            <MenuView
              items={items}
              cart={cart}
              loading={loading}
              error={error}
              table={table}
              onAdd={addItem}
              onRemove={removeOne}
              onRetry={retryMenu}
            />
          )}

          {screen === "cart" && (
            <CartView
              lines={lines}
              note={note}
              onNoteChange={setNote}
              onDecrease={removeOne}
              onIncrease={addItem}
              onRemove={removeItem}
              onClear={clearCart}
              onBack={() => goTo("menu")}
              onCheckout={() => void checkout()}
              submitting={submitting}
              submitError={submitError}
            />
          )}

          {screen === "tracking" && order && (
            <TrackingView
              order={order}
              table={table}
              onOrderMore={() => goTo("menu")}
            />
          )}
        </div>

        {screen === "menu" && itemCount > 0 && (
          <div className={styles.dock}>
            <button type="button" className={styles.cartBar} onClick={() => goTo("cart")}>
              <span className={styles.cartBadge}>{itemCount}</span>
              <span className={styles.cartLabel}>รายการ</span>
              <span className={styles.cartTotal}>฿{formatNumber(cartTotal)}</span>
              <span className={styles.cartArrow}>
                <ArrowRightIcon size={16} strokeWidth={2.1} />
              </span>
            </button>
          </div>
        )}

        {toast && (
          <div className={styles.toast} role="status">
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="ปิดข้อความ">
              <CloseIcon size={15} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function MenuTopBar({ table }: { table: string }) {
  const user = useAuthUser();
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <LogoIcon size={21} />
        </span>
        <div className={styles.brandText}>
          <strong className={styles.brandName}>ใบกะเพรา</strong>
          <small className={styles.brandMeta}>{user?.username}</small>
        </div>
      </div>
      <span className={styles.tableChip}>
        <ChairIcon size={12} />
        โต๊ะ {table}
      </span>
      <SignOutButton className={styles.logoutButton} />
    </header>
  );
}

function SubTopBar({
  title,
  table,
  onBack,
}: {
  title: string;
  table: string;
  onBack: () => void;
}) {
  return (
    <header className={styles.subTopbar}>
      <button type="button" className={styles.backButton} onClick={onBack} aria-label="ย้อนกลับ">
        <ArrowLeftIcon size={18} />
      </button>
      <span className={styles.subTitle}>{title}</span>
      <span className={styles.tableChip}>
        <ChairIcon size={12} />
        โต๊ะ {table}
      </span>
      <SignOutButton className={styles.logoutButton} />
    </header>
  );
}
