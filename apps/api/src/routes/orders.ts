import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { MenuItem, Order, OrderItem, OrderStatus, RestaurantTable } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { json } from "../lib/response";
import type { Route } from "../lib/types";
import { verifyToken, withRoleAuth } from "../lib/auth";

const VALID_STATUSES: OrderStatus[] = ["pending", "cooking", "ready", "served"];

export const orderRoutes: Route[] = [
  // 1. ลูกค้าสั่งอาหาร
  {
    method: "POST",
    path: "/orders",
    handler: async (ctx: any) => {
      let body: any;
      try {
        body = JSON.parse(ctx.event.body ?? "{}");
      } catch {
        return json(400, { error: "Invalid JSON" });
      }

      if (typeof body.tableId !== "string" || !body.tableId.trim() || !Array.isArray(body.items) || body.items.length === 0) {
        return json(400, { error: "Invalid input: 'tableId' and 'items' (with at least 1 item) are required" });
      }

      const tableResult = await db.send(new ScanCommand({ TableName: TABLES.tables }));
      const table = ((tableResult.Items ?? []) as RestaurantTable[]).find(
        (item) => item.id === body.tableId.trim() || item.name === body.tableId.trim(),
      );
      if (!table || !table.active) {
        return json(400, { error: "Table not found or inactive" });
      }

      const orderItems: OrderItem[] = [];
      for (const item of body.items) {
        if (typeof item.menuItemId !== "string" || !item.menuItemId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
          return json(400, { error: "Invalid item format: menuItemId and a positive integer quantity are required" });
        }
        const menuResult = await db.send(new GetCommand({ TableName: TABLES.menu, Key: { id: item.menuItemId } }));
        const menuItem = menuResult.Item as MenuItem | undefined;
        if (!menuItem || !menuItem.available) {
          return json(400, { error: `Menu item '${item.menuItemId}' is unavailable` });
        }
        orderItems.push({ menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: item.quantity });
      }

      const createdAt = new Date().toISOString();
      const trackingToken = randomBytes(32).toString("base64url");
      const newOrder: Order = {
        id: crypto.randomUUID(),
        tableId: table.name,
        items: orderItems,
        status: "pending",
        createdAt,
        note: typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 500) : undefined,
        statusHistory: [{ status: "pending", timestamp: createdAt }],
      };

      await db.send(new PutCommand({
        TableName: TABLES.orders,
        Item: {
          ...newOrder,
          trackingTokenHash: createHash("sha256").update(trackingToken).digest("hex"),
        },
      }));

      return json(201, { ...newOrder, trackingToken });
    },
  },

  // 2. จอครัว polling ดึงออเดอร์ (รองรับ ?status=pending,cooking)
  {
    method: "GET",
    path: "/orders",
    handler: withRoleAuth(["kitchen", "manager"], async (ctx: any) => {
      const queryParams = ctx.event.queryStringParameters || {};
      const statusParam = queryParams.status;

      const scanParams: any = { TableName: TABLES.orders };

      // ถ้ามีการกรองสถานะ ให้สร้าง FilterExpression แบบไดนามิก
      if (statusParam) {
        const statuses = statusParam.split(",").map((s: string) => s.trim());
        const conditions = statuses.map((_: any, i: number) => `#status = :s${i}`);
        
        scanParams.FilterExpression = conditions.join(" OR ");
        scanParams.ExpressionAttributeNames = { "#status": "status" };
        scanParams.ExpressionAttributeValues = {};
        
        statuses.forEach((s: string, i: number) => {
          scanParams.ExpressionAttributeValues[`:s${i}`] = s;
        });
      }

      const result = await db.send(new ScanCommand(scanParams));
      let orders = (result.Items ?? []) as (Order & { trackingTokenHash?: string })[];

      // เรียงลำดับจากใหม่ไปเก่า (ตาม createdAt) เพื่อให้ครัวเห็นออเดอร์ล่าสุดบนสุด
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const safeOrders = orders.map(({ trackingTokenHash: _trackingTokenHash, ...order }) => order);
      return json(200, { orders: safeOrders });
    }),
  },
  {
  method: "GET",
  path: "/orders/:id",
  handler: async (ctx: any) => {
    const id = ctx.params?.id;
    if (!id) return json(400, { error: "Missing 'id' in path" });

    const result = await db.send(new GetCommand({
      TableName: TABLES.orders,
      Key: { id },
    }));

    if (!result.Item) {
      return json(404, { error: "Order not found" });
    }

    const authorization = ctx.event.headers?.authorization ?? ctx.event.headers?.Authorization ?? "";
    const bearer = /^Bearer (.+)$/i.exec(authorization);
    const user = bearer ? verifyToken(bearer[1]) : null;
    const isStaff = user?.role === "kitchen" || user?.role === "manager";
    if (!isStaff) {
      const trackingToken = ctx.event.headers?.["x-order-tracking-token"] ?? ctx.event.headers?.["X-Order-Tracking-Token"];
      const storedHash = result.Item.trackingTokenHash;
      if (typeof trackingToken !== "string" || typeof storedHash !== "string") {
        return json(401, { message: "Order tracking token required" });
      }
      const expectedHash = Buffer.from(storedHash, "hex");
      const providedHash = createHash("sha256").update(trackingToken).digest();
      if (expectedHash.length !== providedHash.length || !timingSafeEqual(expectedHash, providedHash)) {
        return json(404, { error: "Order not found" });
      }
    }

    const { trackingTokenHash: _trackingTokenHash, ...order } = result.Item;
    return json(200, order as Order);
  },
},

  // 3. ครัวเปลี่ยนสถานะ pending -> cooking -> ready -> served
  {
    method: "PATCH",
    path: "/orders/:id/status",
    handler: withRoleAuth(["kitchen", "manager"], async (ctx: any) => {
      const id = ctx.params?.id;
      if (!id) {
        return json(400, { error: "Missing 'id' in path" });
      }

      const body = JSON.parse(ctx.event.body ?? "{}");
      const newStatus = body.status;

      if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
        return json(400, { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` 
        });
      }

      const currentResult = await db.send(new GetCommand({ TableName: TABLES.orders, Key: { id } }));
      const currentOrder = currentResult.Item as Order | undefined;
      if (!currentOrder) return json(404, { error: "Order not found" });
      const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
        pending: "cooking",
        cooking: "ready",
        ready: "served",
      };
      if (nextStatus[currentOrder.status] !== newStatus) {
        return json(409, { error: `Order status can only move from ${currentOrder.status} to ${nextStatus[currentOrder.status] ?? "no further status"}` });
      }

      const timestamp = new Date().toISOString();
      const timestampUpdate = newStatus === "cooking" ? ", startedAt = :timestamp" : newStatus === "served" ? ", servedAt = :timestamp" : "";

      let result;
      try {
        result = await db.send(new UpdateCommand({
      TableName: TABLES.orders,
      Key: { id },
      UpdateExpression: `SET #status = :status, 
                        #updatedAt = :updatedAt,
                        statusHistory = list_append(if_not_exists(statusHistory, :empty_list), :new_history)${timestampUpdate}`,
      ExpressionAttributeNames: { 
        "#status": "status",
        "#updatedAt": "updatedAt"
      },
      ConditionExpression: "#status = :previousStatus",
      ExpressionAttributeValues: {
        ":status": newStatus,
        ":updatedAt": timestamp,
        ":new_history": [{ status: newStatus, timestamp }],
        ":empty_list": [],
        ":previousStatus": currentOrder.status,
        ...(timestampUpdate ? { ":timestamp": timestamp } : {}),
      },
      ReturnValues: "ALL_NEW",
        }));
      } catch (error) {
        if (error instanceof ConditionalCheckFailedException) {
          return json(409, { error: "Order status changed; refresh and try again" });
        }
        throw error;
      }

      if (!result.Attributes) {
        return json(404, { error: "Order not found" });
      }

      return json(200, result.Attributes as Order);
    }),
  },
];