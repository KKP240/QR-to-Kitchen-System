import type { Route } from "../lib/types";
import { json } from "../lib/response";

export const healthRoutes: Route[] = [
  {
    method: "GET",
    path: "/health",
    handler: async () =>
      json(200, { status: "ok", service: "qr-kitchen-api", time: new Date().toISOString() }),
  },
];