"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CookingPot, HeartHandshake, Settings2, Sprout } from "lucide-react";
import { SignOutButton, useAuthUser } from "@/components/auth-gate";
import { thaiDate } from "./kitchen";

const NAV = [{ href: "/kitchen/", label: "หน้าจอครัว", icon: CookingPot }];

export function KitchenNav({ now, children }: { now: number | null; children: ReactNode }) {
  const user = useAuthUser();
  const nav = user?.role === "manager"
    ? [...NAV, { href: "/admin/", label: "จัดการร้าน", icon: Settings2 }]
    : NAV;
  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--k-line)] bg-[var(--k-surface)] px-4 sm:h-20 sm:px-7">
        <Link href="/kitchen/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--k-green)] text-white sm:size-11">
            <Sprout className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-xl font-semibold">ใบกะเพรา</span>
            <span className="hidden text-xs text-[var(--k-muted)] sm:block">อาหารไทย • อิ่มอร่อยเหมือนอยู่บ้าน</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm text-[var(--k-muted)] sm:gap-5">
          <span className="hidden md:inline">{now ? thaiDate(new Date(now)) : ""}</span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--k-green)]" />
            ร้านเปิดอยู่
          </span>
          <span className="hidden h-9 w-px bg-[var(--k-line)] sm:block" />
          <span className="flex items-center gap-2.5 text-[var(--k-ink)]">
            <span className="grid size-9 place-items-center rounded-full bg-[var(--k-green-soft)] text-xs font-semibold text-[var(--k-green)]">
              บก
            </span>
            <span className="hidden sm:inline">{user?.username ?? "ทีมครัว"}</span>
          </span>
          <SignOutButton className="text-xs text-[var(--k-muted)] underline underline-offset-4" />
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-20 hidden min-h-100vh w-52 shrink-0 flex-col justify-between border-r border-[var(--k-line)] bg-[var(--k-surface)] p-3.5 lg:flex">
          <nav>
            <p className="px-1 pb-2 pt-4 text-xs text-[var(--k-muted)]">จัดการร้าน</p>
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current="page"
                className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold ${href === "/kitchen/" ? "bg-[var(--k-green-soft)] text-[var(--k-green)]" : "text-[var(--k-muted)] hover:bg-[var(--k-column)]"}`}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="space-y-2 rounded-2xl bg-[var(--k-column)] p-4 text-xs text-[var(--k-muted)]">
            <HeartHandshake className="size-5" strokeWidth={1.5} />
            <p className="pt-1 leading-relaxed">
              ทุกจาน
              <br />
              ใส่ใจเหมือนทำให้คนที่บ้าน
            </p>
            <p className="pt-2 text-[11px]">ใบกะเพรา • สาขาอารีย์</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </>
  );
}