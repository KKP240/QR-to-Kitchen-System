import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { RestaurantTable } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { withRoleAuth } from "../lib/auth";
import { json } from "../lib/response";
import type { Route } from "../lib/types";

export const tableRoutes: Route[] = [
  {
    method: "GET",
    path: "/tables",
    handler: withRoleAuth(["manager"], async () => {
      const result = await db.send(new ScanCommand({ TableName: TABLES.tables }));
      const tables = ((result.Items ?? []) as RestaurantTable[]).sort((a, b) => a.name.localeCompare(b.name, "th", { numeric: true }));
      return json(200, { tables });
    }),
  },
  {
    method: "POST",
    path: "/tables",
    handler: withRoleAuth(["manager"], async ({ event }) => {
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(event.body ?? "{}");
      } catch {
        return json(400, { message: "Invalid JSON" });
      }
      if (typeof body.name !== "string" || !body.name.trim() || typeof body.seats !== "number" || !Number.isInteger(body.seats) || body.seats < 1) {
        return json(400, { message: "name and a positive integer seats value are required" });
      }
      const table: RestaurantTable = {
        id: crypto.randomUUID(),
        name: body.name.trim(),
        seats: body.seats,
        active: typeof body.active === "boolean" ? body.active : true,
      };
      await db.send(new PutCommand({ TableName: TABLES.tables, Item: table }));
      return json(201, table);
    }),
  },
  {
    method: "PUT",
    path: "/tables/:id",
    handler: withRoleAuth(["manager"], async ({ event, params }) => {
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(event.body ?? "{}");
      } catch {
        return json(400, { message: "Invalid JSON" });
      }
      const current = await db.send(new GetCommand({ TableName: TABLES.tables, Key: { id: params.id } }));
      if (!current.Item) return json(404, { message: "Table not found" });
      if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
        return json(400, { message: "name must be a non-empty string" });
      }
      if (body.seats !== undefined && (typeof body.seats !== "number" || !Number.isInteger(body.seats) || body.seats < 1)) {
        return json(400, { message: "seats must be a positive integer" });
      }
      if (body.active !== undefined && typeof body.active !== "boolean") {
        return json(400, { message: "active must be a boolean" });
      }
      const table: RestaurantTable = {
        ...(current.Item as RestaurantTable),
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(typeof body.seats === "number" ? { seats: body.seats } : {}),
        ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      };
      const result = await db.send(new UpdateCommand({
        TableName: TABLES.tables,
        Key: { id: params.id },
        UpdateExpression: "SET #name = :name, #seats = :seats, #active = :active",
        ExpressionAttributeNames: { "#name": "name", "#seats": "seats", "#active": "active" },
        ExpressionAttributeValues: { ":name": table.name, ":seats": table.seats, ":active": table.active },
        ReturnValues: "ALL_NEW",
      }));
      return json(200, result.Attributes as RestaurantTable);
    }),
  },
  {
    method: "DELETE",
    path: "/tables/:id",
    handler: withRoleAuth(["manager"], async ({ params }) => {
      const current = await db.send(new GetCommand({ TableName: TABLES.tables, Key: { id: params.id } }));
      if (!current.Item) return json(404, { message: "Table not found" });
      await db.send(new DeleteCommand({ TableName: TABLES.tables, Key: { id: params.id } }));
      return json(200, { deleted: true, id: params.id });
    }),
  },
];