import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { Order, OrderStatus } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { json } from "../lib/response";
import type { Route } from "../lib/types";
import { withRoleAuth } from "../lib/auth";

const VALID_STATUSES: OrderStatus[] = ["pending", "cooking", "ready", "served"];

export const orderRoutes: Route[] = [
  // 1. ลูกค้าสั่งอาหาร
  {
    method: "POST",
    path: "/orders",
    handler: withRoleAuth(["customer"], async (ctx: any) => {
      const body = JSON.parse(ctx.event.body ?? "{}");

      // Validation เบื้องต้นตาม Contract
      if (!body.tableId || !Array.isArray(body.items) || body.items.length === 0) {
        return json(400, { error: "Invalid input: 'tableId' and 'items' (with at least 1 item) are required" });
      }

      // ตรวจสอบรูปแบบของ OrderItem
      for (const item of body.items) {
        if (!item.menuItemId || typeof item.quantity !== "number" || item.quantity <= 0) {
          return json(400, { error: "Invalid item format: each item must have 'menuItemId' and 'quantity' > 0" });
        }
      }

      const newOrder: Order = {
      id: crypto.randomUUID(),
      tableId: String(body.tableId),
      items: body.items,
      status: "pending",
      createdAt: new Date().toISOString(),
      note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : undefined,
      statusHistory: [{              // ← เพิ่มบรรทัดนี้
        status: "pending",
        timestamp: new Date().toISOString()
      }]
    };

      await db.send(new PutCommand({
        TableName: TABLES.orders,
        Item: newOrder,
      }));

      return json(201, newOrder);
    }),
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
      let orders = (result.Items ?? []) as Order[];

      // เรียงลำดับจากใหม่ไปเก่า (ตาม createdAt) เพื่อให้ครัวเห็นออเดอร์ล่าสุดบนสุด
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return json(200, { orders });
    }),
  },
  {
  method: "GET",
  path: "/orders/:id",
  handler: withRoleAuth(["kitchen", "manager"], async (ctx: any) => {
    const id = ctx.params?.id;
    if (!id) return json(400, { error: "Missing 'id' in path" });

    const result = await db.send(new GetCommand({
      TableName: TABLES.orders,
      Key: { id },
    }));

    if (!result.Item) {
      return json(404, { error: "Order not found" });
    }

    return json(200, result.Item as Order);
  }),
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

      const result = await db.send(new UpdateCommand({
      TableName: TABLES.orders,
      Key: { id },
      UpdateExpression: `SET #status = :status, 
                        #updatedAt = :updatedAt,
                        statusHistory = list_append(if_not_exists(statusHistory, :empty_list), :new_history)`,
      ExpressionAttributeNames: { 
        "#status": "status",
        "#updatedAt": "updatedAt"
      },
      ExpressionAttributeValues: { 
        ":status": newStatus,
        ":updatedAt": new Date().toISOString(),
        ":new_history": [{
          status: newStatus,
          timestamp: new Date().toISOString()
        }],
        ":empty_list": []
      },
      ReturnValues: "ALL_NEW",
    }));

      if (!result.Attributes) {
        return json(404, { error: "Order not found" });
      }

      return json(200, result.Attributes as Order);
    }),
  },
];