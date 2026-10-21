import { notImplemented } from "../lib/response";
import type { Route } from "../lib/types";

export const tableRoutes: Route[] = [
  { method: "GET", path: "/tables", handler: async () => notImplemented("admin") },
  { method: "POST", path: "/tables", handler: async () => notImplemented("admin") },
  { method: "DELETE", path: "/tables/:id", handler: async () => notImplemented("admin") },
];