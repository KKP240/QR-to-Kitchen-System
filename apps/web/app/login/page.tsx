"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Sprout } from "lucide-react";
import { ApiError, api, setToken } from "@/lib/api";
import { canVisit, ROLE_HOME, type AuthUser } from "@/lib/auth";
import styles from "./login.module.css";

type LoginResponse = { token: string; user: AuthUser };

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const result = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      setToken(result.token);

      const requestedPath = new URLSearchParams(window.location.search).get("next") ?? "";
      let destination = ROLE_HOME[result.user.role];
      if (requestedPath.startsWith("/") && !requestedPath.startsWith("//")) {
        const requestedUrl = new URL(requestedPath, window.location.origin);
        if (requestedUrl.origin === window.location.origin && canVisit(result.user.role, requestedUrl.pathname)) {
          destination = `${requestedUrl.pathname}${requestedUrl.search}${requestedUrl.hash}`;
        }
      }
      window.location.assign(destination);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.status === 401
          ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
          : requestError instanceof Error
            ? requestError.message
            : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.login} aria-labelledby="login-title">
        <div className={styles.brand}>
          <span className={styles.mark}><Sprout size={21} strokeWidth={1.8} /></span>
          <span>ใบกะเพรา <small>ระบบจัดการร้านอาหาร</small></span>
        </div>

        <div className={styles.heading}>
          <p>ยินดีต้อนรับกลับ</p>
          <h1 id="login-title">เข้าสู่ระบบ</h1>
          <span>ใช้บัญชีลูกค้า ครัว หรือผู้จัดการที่ได้รับจากร้าน</span>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <label>
            ชื่อผู้ใช้
            <input
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="กรอกชื่อผู้ใช้"
            />
          </label>
          <label>
            รหัสผ่าน
            <span className={styles.password}>
              <input
                autoComplete="current-password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="กรอกรหัสผ่าน"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            {!submitting && <ArrowRight size={17} />}
          </button>
        </form>

        <footer className={styles.footer}>บัญชีเข้าใช้งานโดยร้านอาหารเป็นผู้กำหนด</footer>
      </section>
      <aside className={styles.side} aria-hidden="true">
        <div className={styles.sideRule} />
        <p>บริการที่ดี<br />เริ่มจากความใส่ใจ</p>
        <span>BAI KRAPAO · KITCHEN SYSTEM</span>
      </aside>
    </main>
  );
}