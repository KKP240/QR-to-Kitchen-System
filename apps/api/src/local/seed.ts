import "./env";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { MenuItem } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";

const items: MenuItem[] = [
  { id: "m1", name: "ข้าวกะเพราหมูสับ", price: 60, available: true },
  { id: "m2", name: "ผัดไทยกุ้งสด", price: 80, available: true },
  { id: "m3", name: "ชาเย็น", price: 30, available: true },
];

async function main() {
  for (const item of items) {
    await db.send(new PutCommand({ TableName: TABLES.menu, Item: item }));
  }
  console.log(`seeded ${items.length} menu items`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});