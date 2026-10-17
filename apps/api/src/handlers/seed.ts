import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { seedMenuItems as items } from "../lib/seed-data";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { json } from "../lib/response";

// ใช้ช่วงพัฒนาเท่านั้น: จะลบ handler นี้ออกก่อนใช้งานจริง
export const handler = async () => {
  for (const item of items) {
    await db.send(new PutCommand({ TableName: TABLES.menu, Item: item }));
  }
  return json(200, { seeded: items.length });
};