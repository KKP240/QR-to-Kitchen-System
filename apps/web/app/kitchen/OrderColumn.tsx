"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import { OrderCard } from "./OrderCard";
import type { COLUMNS, KitchenOrder, KitchenStatus, MenuMap } from "./kitchen";

interface OrderColumnProps {
  column: (typeof COLUMNS)[number];
  orders: KitchenOrder[];
  menu: MenuMap;
  now: number | null;
  loading: boolean;
  pendingIds: string[];
  onAdvance: (id: string, next: KitchenStatus) => void;
  /** เนื้อหาใต้การ์ด เช่น ลิงก์ "ดูทั้งหมด" */
  footer?: ReactNode;
}

export function OrderColumn({ column, orders, menu, now, loading, pendingIds, onAdvance, footer }: OrderColumnProps) {
  return (
    <section
      aria-label={column.title}
      className="rounded-2xl bg-[var(--k-column)] p-3 sm:p-4"
    >
      <header className="px-1 pb-4 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <span className={cn("size-2 rounded-full", column.dot)} />
            {column.title}
          </h2>
          <span className={cn("text-sm font-semibold tabular-nums", column.count)}>{loading ? "–" : orders.length}</span>
        </div>
        <p className="mt-1.5 text-xs text-[var(--k-muted)]">{column.hint}</p>
      </header>

      <div className="space-y-3">
        {loading || now === null ? (
          <>
            <Skeleton className="h-64 rounded-xl bg-white" />
            <Skeleton className="h-40 rounded-xl bg-white" />
          </>
        ) : orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--k-line)] py-8 text-center text-xs text-[var(--k-muted)]">
            ยังไม่มีออเดอร์
          </p>
        ) : (
          orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              menu={menu}
              now={now}
              busy={pendingIds.includes(o.id)}
              onAdvance={onAdvance}
            />
          ))
        )}
        {footer}
      </div>
    </section>
  );
}