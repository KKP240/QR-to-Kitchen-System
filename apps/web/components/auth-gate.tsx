"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, api, getToken, setToken } from "@/lib/api";
import { ROLE_HOME, type AuthUser, type UserRole } from "@/lib/auth";

const AuthContext = createContext<AuthUser | null>(null);

export function useAuthUser(): AuthUser | null {
  return useContext(AuthContext);
}

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setToken(null);
        window.location.assign("/login/");
      }}
    >
      ออกจากระบบ
    </button>
  );
}

export function AuthGate({
  roles,
  children,
}: {
  roles: readonly UserRole[];
  children: ReactNode;
}) {
  const roleKey = roles.join(",");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const token = getToken();
    if (!token) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login/?next=${encodeURIComponent(next)}`);
      return () => {
        active = false;
      };
    }

    api<AuthUser>("/auth/me")
      .then((currentUser) => {
        if (!active) return;
        if (!roleKey.split(",").includes(currentUser.role)) {
          window.location.replace(ROLE_HOME[currentUser.role]);
          return;
        }
        setUser(currentUser);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          setToken(null);
          const next = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/login/?next=${encodeURIComponent(next)}`);
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "เชื่อมต่อ API ไม่สำเร็จ");
      });

    return () => {
      active = false;
    };
  }, [roleKey]);

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f3ed] px-5 text-[#334438]">
        <div className="w-full max-w-sm text-center" role={error ? "alert" : "status"}>
          {error ? (
            <>
              <p className="font-semibold">ตรวจสอบการเชื่อมต่อไม่สำเร็จ</p>
              <p className="mt-2 text-sm text-[#747a70]">{error}</p>
              <button className="mt-5 underline" onClick={() => window.location.reload()}>
                ลองอีกครั้ง
              </button>
            </>
          ) : (
            <p className="text-sm text-[#747a70]">กำลังตรวจสอบบัญชี...</p>
          )}
        </div>
      </main>
    );
  }

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}