import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(ctx.event.body ?? "{}");
      } catch {
        return json(400, { error: "Invalid JSON" });
      }

      if (typeof body.name !== "string" || !body.name.trim() || typeof body.price !== "number" || !Number.isFinite(body.price) || body.price <= 0) {
        return json(400, { error: "Invalid input: a name and positive numeric price are required" });
      }
      const name = body.name.trim();
      const current = await db.send(new ScanCommand({ TableName: TABLES.menu }));
      if ((current.Items ?? []).some((item) => String(item.name).trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
        return json(409, { error: "A menu item with this name already exists" });
      }
      if (body.available !== undefined && typeof body.available !== "boolean") {
        return json(400, { error: "available must be a boolean" });
      }

      const newItem: MenuItem = {
        id: crypto.randomUUID(),
        name,
        price: body.price,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        category: typeof body.category === "string" ? body.category : undefined,
        available: typeof body.available === "boolean" ? body.available : true,
      };

      await db.send(new PutCommand({
        TableName: TABLES.menu,
        Item: newItem,
        ConditionExpression: "attribute_not_exists(id)",
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

      let body: Record<string, unknown>;
      try {
        body = JSON.parse(ctx.event.body ?? "{}");
      } catch {
        return json(400, { error: "Invalid JSON" });
      }
      const current = await db.send(new GetCommand({ TableName: TABLES.menu, Key: { id } }));
      if (!current.Item) return json(404, { error: "Menu item not found" });

      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (body.name !== undefined) {
        if (typeof body.name !== "string" || !body.name.trim()) {
          return json(400, { error: "name must be a non-empty string" });
        }
        const name = body.name.trim();
        const existing = await db.send(new ScanCommand({ TableName: TABLES.menu }));
        if ((existing.Items ?? []).some((item) => item.id !== id && String(item.name).trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
          return json(409, { error: "A menu item with this name already exists" });
        }
        updateExpressions.push("#name = :name");
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":name"] = name;
      }
      if (body.price !== undefined) {
        if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price <= 0) {
          return json(400, { error: "price must be a positive number" });
        }
        updateExpressions.push("#price = :price");
        expressionAttributeNames["#price"] = "price";
        expressionAttributeValues[":price"] = body.price;
      }
      if (body.imageUrl !== undefined) {
        if (typeof body.imageUrl !== "string") return json(400, { error: "imageUrl must be a string" });
        updateExpressions.push("#imageUrl = :imageUrl");
        expressionAttributeNames["#imageUrl"] = "imageUrl";
        expressionAttributeValues[":imageUrl"] = body.imageUrl;
      }
      if (body.description !== undefined) {
        if (typeof body.description !== "string") return json(400, { error: "description must be a string" });
        updateExpressions.push("#description = :description");
        expressionAttributeNames["#description"] = "description";
        expressionAttributeValues[":description"] = body.description;
      }
      if (body.category !== undefined) {
        if (typeof body.category !== "string") return json(400, { error: "category must be a string" });
        updateExpressions.push("#category = :category");
        expressionAttributeNames["#category"] = "category";
        expressionAttributeValues[":category"] = body.category;
      }
      if (body.available !== undefined) {
        if (typeof body.available !== "boolean") return json(400, { error: "available must be a boolean" });
        updateExpressions.push("#available = :available");
        expressionAttributeNames["#available"] = "available";
        expressionAttributeValues[":available"] = body.available;
      }

      if (updateExpressions.length === 0) {
        return json(400, { error: "No fields to update" });
      }

      try {
        const result = await db.send(new UpdateCommand({
          TableName: TABLES.menu,
          Key: { id },
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ConditionExpression: "attribute_exists(id)",
          ReturnValues: "ALL_NEW",
        }));
        return json(200, result.Attributes as MenuItem);
      } catch (error) {
        if (error instanceof ConditionalCheckFailedException) return json(404, { error: "Menu item not found" });
        throw error;
      }
    }),
  },
  {
    method: "DELETE",
    path: "/menu/:id",
    handler: withRoleAuth(["manager"], async (ctx: any) => {
      const id = ctx.params?.id;
      if (!id) return json(400, { error: "Missing 'id' in path" });

      try {
        await db.send(new DeleteCommand({
          TableName: TABLES.menu,
          Key: { id },
          ConditionExpression: "attribute_exists(id)",
        }));
        return json(200, { deleted: true, id });
      } catch (error) {
        if (error instanceof ConditionalCheckFailedException) return json(404, { error: "Menu item not found" });
        throw error;
      }
    }),
  },
];