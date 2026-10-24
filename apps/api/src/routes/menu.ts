import { ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { MenuItem } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { json } from "../lib/response";
import type { Route } from "../lib/types";
import { withRoleAuth } from "../lib/auth";

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
  {
    method: "POST",
    path: "/menu",
    handler: withRoleAuth(["manager"], async (ctx: any) => {
      const body = JSON.parse(ctx.event.body ?? "{}");
      
      if (!body.name || typeof body.price !== "number") {
        return json(400, { error: "Invalid input: 'name' and 'price' are required" });
      }

      const newItem: MenuItem = {
        id: crypto.randomUUID(),
        name: body.name,
        price: body.price,
        imageUrl: body.imageUrl,
        available: body.available ?? true,
      };

      await db.send(new PutCommand({ 
        TableName: TABLES.menu, 
        Item: newItem 
      }));
      
      return json(201, newItem);
    }),
  },
  {
    method: "PUT",
    path: "/menu/:id",
    handler: withRoleAuth(["manager"], async (ctx: any) => {
      const id = ctx.params?.id;
      if (!id) return json(400, { error: "Missing 'id' in path" });

      const body = JSON.parse(ctx.event.body ?? "{}");
      
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // สร้าง Update Expression แบบไดนามิกตามฟิลด์ที่ส่งมา
      if (body.name !== undefined) {
        updateExpressions.push("#name = :name");
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":name"] = body.name;
      }
      if (body.price !== undefined) {
        updateExpressions.push("#price = :price");
        expressionAttributeNames["#price"] = "price";
        expressionAttributeValues[":price"] = body.price;
      }
      if (body.imageUrl !== undefined) {
        updateExpressions.push("#imageUrl = :imageUrl");
        expressionAttributeNames["#imageUrl"] = "imageUrl";
        expressionAttributeValues[":imageUrl"] = body.imageUrl;
      }
      if (body.available !== undefined) {
        updateExpressions.push("#available = :available");
        expressionAttributeNames["#available"] = "available";
        expressionAttributeValues[":available"] = body.available;
      }

      if (updateExpressions.length === 0) {
        return json(400, { error: "No fields to update" });
      }

      const result = await db.send(new UpdateCommand({
        TableName: TABLES.menu,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW", // คืนค่าข้อมูลแถวที่อัปเดตแล้วกลับมา
      }));

      return json(200, result.Attributes as MenuItem);
    }),
  },
  {
    method: "DELETE",
    path: "/menu/:id",
    handler: withRoleAuth(["manager"], async (ctx: any) => {
      const id = ctx.params?.id;
      if (!id) return json(400, { error: "Missing 'id' in path" });

      await db.send(new DeleteCommand({
        TableName: TABLES.menu,
        Key: { id },
      }));
      
      return json(200, { deleted: true, id });
    }),
  },
];