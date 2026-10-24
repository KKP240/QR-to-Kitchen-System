"use client";

import { useEffect, useState } from "react";
import { api, getToken, setToken } from "@/lib/api";

type Me = { username: string; role: string };

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    api<Me>("/auth/me")
      .then(setMe)
      .catch(() => setToken(null)); // token หมดอายุหรือไม่ถูกต้อง
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api<{ token: string; user: Me }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setToken(r.token);
      setMe(r.user);
      setPassword("");
    } catch {
      setError("เข้าสู่ระบบไม่สำเร็จ ตรวจสอบชื่อผู้ใช้และรหัสผ่าน");
    }
  }

  function logout() {
    setToken(null);
    setMe(null);
  }

  if (me) {
    return (
      <main>
        <h1>หลังบ้านเจ้าของร้าน (Admin)</h1>
        <p>เข้าสู่ระบบแล้ว: {me.username} ({me.role})</p>
        <button onClick={logout}>ออกจากระบบ</button>
        {/* TODO(admin team): จัดการเมนู / โต๊ะ / QR Code */}
      </main>
    );
  }

  return (
    <main>
      <h1>เข้าสู่ระบบเจ้าของร้าน</h1>
      <form onSubmit={login}>
        <p>
          <input placeholder="ชื่อผู้ใช้" value={username} onChange={(e) => setUsername(e.target.value)} />
        </p>
        <p>
          <input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} />
        </p>
        <button type="submit">เข้าสู่ระบบ</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}