import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";

const font = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = { title: "จอครัว | ใบกะเพรา" };

/** สีทั้งหมดของหน้าจอครัวอยู่ที่นี่ที่เดียว — เปลี่ยนธีมแก้ตรงนี้ */
const theme = {
  "--k-main": "#F8F7F1",
  "--k-surface": "#FDFCF8",
  "--k-column": "#F2F1E9",
  "--k-line": "#E8E6DB",
  "--k-chip": "#F1F0E8",
  "--k-ink": "#1E2B24",
  "--k-muted": "#7B837C",
  "--k-green": "#2D5A43",
  "--k-green-hover": "#244A37",
  "--k-green-soft": "#E3EEE5",
  "--k-amber": "#B4621A",
  "--k-amber-soft": "#FDEBD2",
  "--k-blue": "#3A6EA5",
  "--k-gray": "#7A7F7B",
  "--k-danger": "#B3392F",
} as CSSProperties;

export default function KitchenLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${font.className} min-h-screen bg-[var(--k-main)] text-[var(--k-ink)]`} style={theme}>
      {children}
    </div>
  );
}