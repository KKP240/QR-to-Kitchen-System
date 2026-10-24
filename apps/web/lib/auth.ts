export type UserRole = "customer" | "kitchen" | "manager";

export interface AuthUser {
  username: string;
  role: UserRole;
}

export const ROLE_HOME: Record<UserRole, string> = {
  customer: "/menu/",
  kitchen: "/kitchen/",
  manager: "/admin/",
};

export function canVisit(role: UserRole, pathname: string): boolean {
  if (pathname === "/") return true;
  if (role === "customer") return pathname.startsWith("/menu/");
  if (role === "kitchen") return pathname.startsWith("/kitchen/");
  return pathname.startsWith("/admin/") || pathname.startsWith("/kitchen/");
}