"use client";

import { useState } from "react";
import { BellRing, Check, Clock, FileText, Flame, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import {
  LATE_AFTER_MIN,
  NEXT_ACTION,
  clock,
  elapsedLabel,
  elapsedMinutes,
  formatBaht,
  orderNumber,
  summarize,
  tableLabel,
  toMs,
  type KitchenOrder,
  type KitchenStatus,
  type MenuMap,
} from "./kitchen";

const ACTION_ICON = { pending: Flame, cooking: BellRing, ready: Check } as const;

interface OrderCardProps {
  order: KitchenOrder;
  menu: MenuMap;
  now: number;
  busy: boolean;
  onAdvance: (id: string, next: KitchenStatus) => void;
}

export function OrderCard({ order, menu, now, busy, onAdvance }: OrderCardProps) {
  const [open, setOpen] = useState(false);
  const { lines, pieces, total } = summarize(order, menu);
  const minutes = elapsedMinutes(order.createdAt, now);
  const late = minutes >= LATE_AFTER_MIN[order.status];

  const action = order.status === "served" ? null : NEXT_ACTION[order.status];
  const ActionIcon = order.status === "served" ? null : ACTION_ICON[order.status];

  const started = toMs(order.startedAt);
  const showEta = order.status === "cooking" && !Number.isNaN(started);

  return (
    <Card className="gap-0 rounded-xl border-[var(--k-line)] bg-white py-0 shadow-none">
      <CardContent className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-semibold leading-tight">{tableLabel(order.tableId)}</h3>
            <span
              className={cn(
                "mt-1 flex shrink-0 items-center gap-1 text-xs",
                late ? "font-medium text-[var(--k-amber)]" : "text-[var(--k-muted)]",
              )}
            >
              <Clock className="size-3.5" />
              {elapsedLabel(minutes)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-b border-[var(--k-line)] pb-3">
            <span className="text-sm font-medium">{orderNumber(order)}</span>
            <span className="text-xs text-[var(--k-muted)]">{clock(order.createdAt)} น.</span>
          </div>
        </div>

        <ul className="space-y-2.5">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-3 text-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--k-chip)] text-xs font-medium">
                {l.quantity}
              </span>
              <span className="min-w-0 break-words">{l.name}</span>
            </li>
          ))}
        </ul>

        {order.note && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--k-amber-soft)] px-3 py-2 text-xs text-[var(--k-amber)]">
            <MessageSquare className="size-3.5 shrink-0" />
            <span>{order.note}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[var(--k-muted)]">
          <span>
            {pieces} ชิ้น • {lines.length} รายการ
          </span>
          <span className="tabular-nums">{formatBaht(total)}</span>
        </div>

        {action && ActionIcon ? (
          <Button
            disabled={busy}
            onClick={() => onAdvance(order.id, action.next)}
            className="h-10 w-full gap-2 bg-[var(--k-green)] text-white hover:bg-[var(--k-green-hover)] cursor-pointer"
          >
            <ActionIcon className="size-4" />
            {action.label}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="h-10 w-full gap-2 bg-[var(--k-chip)] text-[var(--k-muted)] hover:bg-[var(--k-line)] cursor-pointer"
            >
              <FileText className="size-4" />
              ดูรายละเอียด
            </Button>
            {open && (
              <ul className="space-y-1.5 rounded-lg bg-[var(--k-main)] p-3 text-xs">
                {lines.map((l) => (
                  <li key={l.key} className="flex justify-between gap-3">
                    <span>
                      {l.name} × {l.quantity}
                    </span>
                    <span className="tabular-nums text-[var(--k-muted)]">{formatBaht(l.unitPrice * l.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {showEta && (
          <p className="text-center text-[11px] text-[var(--k-green)]">
            เริ่มปรุง {clock(started)} • คาดว่าเสร็จ {clock(started + 10 * 60_000)}–{clock(started + 15 * 60_000)}
          </p>
        )}
        {order.status === "served" && order.servedAt && (
          <p className="text-[11px] text-[var(--k-muted)]">เสิร์ฟแล้วเมื่อ {clock(order.servedAt)} น.</p>
        )}
      </CardContent>
    </Card>
  );
}