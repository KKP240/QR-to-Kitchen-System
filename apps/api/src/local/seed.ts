import "./env";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { seedMenuItems as items } from "../lib/seed-data";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";


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