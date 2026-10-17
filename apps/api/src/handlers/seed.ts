import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { MenuItem } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { json } from "../lib/response";

const items: MenuItem[] = [
  { id: "m1", name: "ข้าวกะเพราหมูสับ", price: 60, available: true },
  { id: "m2", name: "ผัดไทยกุ้งสด", price: 80, available: true },
  { id: "m3", name: "ชาเย็น", price: 30, available: true },
];

// ใช้ช่วงพัฒนาเท่านั้น: จะลบ handler นี้ออกก่อนใช้งานจริง
export const handler = async () => {
  for (const item of items) {
    await db.send(new PutCommand({ TableName: TABLES.menu, Item: item }));
  }
  return json(200, { seeded: items.length });
};