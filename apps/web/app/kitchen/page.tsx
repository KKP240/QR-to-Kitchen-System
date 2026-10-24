"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Bell, CheckCheck, CookingPot, Inbox, ReceiptText, Search, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "cn";
import { AuthGate } from "@/components/auth-gate";
import {
  COLUMNS,
  POLL_MS,
  SERVED_PREVIEW,
  clock,
  isSameDay,
  orderNumber,
  pad2,
  summarize,
  tableLabel,
  toMs,
  type KitchenOrder,
} from "./kitchen";
import { useKitchenOrders, useNow } from "./useKitchenOrders";
import { KitchenNav } from "./KitchenNav";
import { OrderColumn } from "./OrderColumn";

export default function KitchenPage() {
  return (
    <AuthGate roles={["kitchen", "manager"]}>
      <KitchenBoard />
    </AuthGate>
  );
}

function KitchenBoard() {
  const { orders, menu, loading, connected, updatedAt, pendingIds, actionError, advance } = useKitchenOrders();
  const now = useNow(15000);

  const [table, setTable] = useState<string | null>("all");
  const [query, setQuery] = useState("");
  const [showAllServed, setShowAllServed] = useState(false);

  /* ---------- สถิติ (คิดจากทุกออเดอร์ ไม่ขึ้นกับตัวกรอง) ---------- */
  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "served");
    return {
      active: active.length,
      tables: new Set(active.map((o) => o.tableId)).size,
      pending: active.filter((o) => o.status === "pending").length,
      cooking: active.filter((o) => o.status === "cooking").length,
      cookingPieces: orders
        .filter((o) => o.status === "cooking")
        .reduce((n, o) => n + o.items.reduce((s, i) => s + i.quantity, 0), 0),
      servedToday: now
        ? orders.filter((o) => o.status === "served" && isSameDay(toMs(o.servedAt ?? o.createdAt), now)).length
        : 0,
    };
  }, [orders, now]);

  const tableOptions = useMemo(
    () =>
      Array.from(new Set(orders.map((o) => o.tableId))).sort((a, b) => a.localeCompare(b, "th", { numeric: true })),
    [orders],
  );

  /* ---------- กรอง + จัดกลุ่ม + เรียง ---------- */
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (o: KitchenOrder) => {
      if (table !== "all" && o.tableId !== table) return false;
      if (!q) return true;
      const haystack = [tableLabel(o.tableId), o.tableId, orderNumber(o), ...summarize(o, menu).lines.map((l) => l.name)];
      return haystack.join(" ").toLowerCase().includes(q);
    };
    const filtered = orders.filter(matches);
    return Object.fromEntries(
      COLUMNS.map(({ status }) => {
        const list = filtered.filter((o) => o.status === status);
        // ออเดอร์เก่าสุดขึ้นก่อน (ยกเว้น "เสิร์ฟแล้ว" เอาล่าสุดขึ้นก่อน)
        list.sort((a, b) =>
          status === "served"
            ? toMs(b.servedAt ?? b.createdAt) - toMs(a.servedAt ?? a.createdAt)
            : toMs(a.createdAt) - toMs(b.createdAt),
        );
        return [status, list];
      }),
    ) as Record<(typeof COLUMNS)[number]["status"], KitchenOrder[]>;
  }, [orders, menu, table, query]);

  return (
    <KitchenNav now={now}>
      {/* ---------- หัวข้อ ---------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium">ครัวใบกะเพรา</p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">ทุกออเดอร์ พร้อมส่งต่อความอร่อย</h1>
          <p className="mt-2 text-sm text-[var(--k-muted)]">
            จัดคิว ปรุง และเสิร์ฟจากหน้าจอเดียว • กะกลางวัน 11:00–15:00 น.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <Badge
            variant="secondary"
            className={cn(
              "w-fit gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
              connected ? "bg-[var(--k-green-soft)] text-[var(--k-green)]" : "bg-[var(--k-amber-soft)] text-[var(--k-danger)]",
            )}
          >
            <span className={cn("size-1.5 rounded-full", connected ? "bg-[var(--k-green)]" : "bg-[var(--k-danger)]")} />
            {connected ? "อัปเดตอัตโนมัติ" : "เชื่อมต่อไม่ได้ • กำลังลองใหม่"}
          </Badge>
          <p className="text-[11px] text-[var(--k-muted)]">
            ทุก {POLL_MS / 1000} วินาที{updatedAt ? ` • ล่าสุด ${clock(updatedAt, true)}` : ""}
          </p>
        </div>
      </div>

      {/* ---------- สถิติ ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="ออเดอร์ที่กำลังดูแล"
          value={stats.active}
          caption={`จาก ${stats.tables} โต๊ะ`}
          icon={ReceiptText}
          tone="text-[var(--k-gray)]"
        />
        <StatCard
          label="รอรับออเดอร์"
          value={stats.pending}
          caption="ใหม่ล่าสุดเมื่อสักครู่"
          icon={Inbox}
          tone="text-[var(--k-amber)]"
        />
        <StatCard
          label="กำลังปรุง"
          value={stats.cooking}
          caption={`${stats.cookingPieces} จาน / แก้ว`}
          icon={CookingPot}
          tone="text-[var(--k-blue)]"
        />
        <StatCard
          label="เสิร์ฟแล้ววันนี้"
          value={stats.servedToday}
          caption="ดูแลทุกจานด้วยใจ"
          icon={CheckCheck}
          tone="text-[var(--k-gray)]"
        />
      </div>

      {/* ---------- ตัวกรอง ---------- */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Select value={table} onValueChange={setTable}>
          <SelectTrigger
            aria-label="กรองตามโต๊ะ"
            className="h-10 w-[7.5rem] rounded-lg border-0 bg-[var(--k-green-soft)] text-sm font-semibold text-[var(--k-green)] shadow-none"
          >
            <SelectValue placeholder="ทุกโต๊ะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกโต๊ะ</SelectItem>
            {tableOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {tableLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative min-w-[12rem] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--k-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาโต๊ะ / เลขออเดอร์"
            aria-label="ค้นหาโต๊ะหรือเลขออเดอร์"
            className="h-10 rounded-lg border-[var(--k-line)] bg-[var(--k-surface)] pl-9 text-sm shadow-none"
          />
        </div>

        <p className="ml-auto hidden items-center gap-2 text-xs text-[var(--k-muted)] sm:flex">
          <ArrowDownWideNarrow className="size-4" />
          เก่าสุดก่อนในแต่ละสถานะ
        </p>
      </div>

      {/* ---------- บอร์ดสถานะ ---------- */}
      <div className="mt-6 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const all = grouped[column.status];
          const isServed = column.status === "served";
          const visible = isServed && !showAllServed ? all.slice(0, SERVED_PREVIEW) : all;

          return (
            <OrderColumn
              key={column.status}
              column={column}
              orders={visible}
              menu={menu}
              now={now}
              loading={loading}
              pendingIds={pendingIds}
              onAdvance={advance}
              footer={
                column.status === "ready" ? (
                  <div className="flex flex-col items-center gap-2 px-2 py-6 text-center text-xs text-[var(--k-muted)]">
                    <Bell className="size-6" strokeWidth={1.25} />
                    ตรวจเลขโต๊ะก่อนเสิร์ฟทุกครั้ง
                  </div>
                ) : isServed && all.length > SERVED_PREVIEW ? (
                  <Button
                    variant="link"
                    onClick={() => setShowAllServed((v) => !v)}
                    className="h-auto w-full p-2 text-xs font-medium text-[var(--k-green)]"
                  >
                    {showAllServed ? "แสดงเฉพาะล่าสุด" : `ดูเสิร์ฟแล้วทั้งหมด ${all.length} ออเดอร์ →`}
                  </Button>
                ) : null
              }
            />
          );
        })}
      </div>

      {/* ---------- ท้ายหน้า ---------- */}
      <footer className="mt-8 flex flex-col gap-1 text-[11px] text-[var(--k-muted)] sm:flex-row sm:justify-between">
        <p>{COLUMNS.map((c) => c.title).join(" → ")}</p>
        <p>สถานะที่เปลี่ยนจะแสดงบนหน้าจอลูกค้า</p>
      </footer>

      {actionError && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-[var(--k-danger)] px-4 py-2.5 text-sm text-white shadow-lg"
        >
          {actionError}
        </div>
      )}
    </KitchenNav>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="gap-0 rounded-2xl border-[var(--k-line)] bg-[var(--k-surface)] py-0 shadow-none">
      <CardContent className="flex items-start justify-between gap-2 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs text-[var(--k-muted)]">{label}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className="text-4xl font-semibold tabular-nums">{pad2(value)}</span>
            <span className="text-[11px] text-[var(--k-muted)]">{caption}</span>
          </p>
        </div>
        <Icon className={cn("size-6 shrink-0", tone)} strokeWidth={1.5} />
      </CardContent>
    </Card>
  );
}