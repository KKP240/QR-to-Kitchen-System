"use client";

import Link from "next/link";
import { CookingPot, Menu, Settings2 } from "lucide-react";
import { AuthGate, SignOutButton, useAuthUser } from "@/components/auth-gate";
import styles from "./page.module.css";

export default function Home() {
  return (
    <AuthGate roles={["customer", "kitchen", "manager"]}>
      <HomeDashboard />
    </AuthGate>
  );
}

function HomeDashboard() {
  const user = useAuthUser();
  const entries = user?.role === "customer"
    ? [{ href: "/menu/", label: "เปิดเมนู", detail: "เลือกอาหารและติดตามออเดอร์", icon: Menu }]
    : user?.role === "kitchen"
      ? [{ href: "/kitchen/", label: "จอครัว", detail: "รับคิวและอัปเดตสถานะอาหาร", icon: CookingPot }]
      : [
          { href: "/admin/", label: "จัดการร้าน", detail: "เมนู ราคา โต๊ะ และ QR Code", icon: Settings2 },
          { href: "/kitchen/", label: "จอครัว", detail: "ดูคิวและเปลี่ยนสถานะออเดอร์", icon: CookingPot },
        ];

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><span>ใบ</span> ใบกะเพรา</Link>
        <div className={styles.account}>
          <span>{user?.username} · {user?.role}</span>
          <SignOutButton className={styles.signOut} />
        </div>
      </header>
      <section className={styles.content}>
        <p className={styles.eyebrow}>ระบบร้านอาหาร</p>
        <h1>สวัสดี, {user?.username}</h1>
        <p className={styles.subtitle}>เลือกพื้นที่ทำงานของคุณ</p>
        <nav className={styles.entries} aria-label="พื้นที่ทำงาน">
          {entries.map(({ href, label, detail, icon: Icon }) => (
            <Link key={href} href={href} className={styles.entry}>
              <Icon size={22} />
              <span><strong>{label}</strong><small>{detail}</small></span>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </section>
      <footer className={styles.footer}>บัญชี {user?.role}</footer>
    </main>
  );
}