import { withRoleAuth } from "../lib/auth";
import { notImplemented } from "../lib/response";
import type { Route } from "../lib/types";

export const tableRoutes: Route[] = [
  { method: "GET", path: "/tables", handler: withRoleAuth(["manager"], async () => notImplemented("manager")) },
  { method: "POST", path: "/tables", handler: withRoleAuth(["manager"], async () => notImplemented("manager")) },
  { method: "DELETE", path: "/tables/:id", handler: withRoleAuth(["manager"], async () => notImplemented("manager")) },
];