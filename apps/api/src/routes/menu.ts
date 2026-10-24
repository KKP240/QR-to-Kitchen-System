import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { MenuItem } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { json, notImplemented } from "../lib/response";
import type { Route } from "../lib/types";
import { withAuth } from "../lib/auth";

export const menuRoutes: Route[] = [
  {
    method: "GET",
    path: "/menu",
    handler: async () => {
      const result = await db.send(new ScanCommand({ TableName: TABLES.menu }));
      const items = ((result.Items ?? []) as MenuItem[]).sort((a, b) => a.id.localeCompare(b.id));
      return json(200, { items });
    },
  },
  // TODO(admin team): ต้องมี auth ก่อนเปิดใช้
  { method: "POST", path: "/menu", handler: withAuth(async () => notImplemented("admin")) },
  { method: "PUT", path: "/menu/:id", handler: withAuth(async () => notImplemented("admin")) },
  { method: "DELETE", path: "/menu/:id", handler: withAuth(async () => notImplemented("admin")) },
];