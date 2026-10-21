"use client";

import { useEffect, useState } from "react";
import type { MenuItem } from "@qr-kitchen/shared";
import { api } from "@/lib/api";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTable(new URLSearchParams(window.location.search).get("table"));
    api<{ items: MenuItem[] }>("/menu")
      .then((data) => setItems(data.items ?? []))
      .catch((e) => setError(`โหลดเมนูไม่สำเร็จ: ${e.message}`))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <h1>เมนูอาหาร</h1>
      <p>โต๊ะ: {table ?? "ไม่ระบุ"}</p>
      {loading && <p>กำลังโหลด...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} - {item.price} บาท
          </li>
        ))}
      </ul>
    </main>
  );
}