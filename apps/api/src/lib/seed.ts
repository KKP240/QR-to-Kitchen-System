import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { MenuItem, RestaurantTable } from "@qr-kitchen/shared";
import { db } from "./dynamo";
import { TABLES } from "./config";
import { seedMenuItems, seedTables } from "./seed-data";

async function putIfMissing(tableName: string, keyName: string, item: Record<string, unknown>): Promise<boolean> {
  try {
    await db.send(new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(#key)",
      ExpressionAttributeNames: { "#key": keyName },
    }));
    return true;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) return false;
    throw error;
  }
}

export async function seedInitialData() {
  const [menuResult, tableResult] = await Promise.all([
    db.send(new ScanCommand({ TableName: TABLES.menu })),
    db.send(new ScanCommand({ TableName: TABLES.tables })),
  ]);
  const menuItems = (menuResult.Items ?? []) as MenuItem[];
  const tables = (tableResult.Items ?? []) as RestaurantTable[];
  const menuIds = new Set(menuItems.map((item) => item.id));
  const menuNames = new Set(menuItems.map((item) => item.name.trim().toLocaleLowerCase()));
  const tableNames = new Set(tables.map((table) => table.name.trim().toLocaleLowerCase()));

  let menuInserted = 0;
  let menuExisting = 0;
  let menuSkippedDuplicateName = 0;
  let tablesInserted = 0;
  let tablesExisting = 0;

  for (const item of seedMenuItems) {
    if (menuIds.has(item.id)) {
      menuExisting++;
      continue;
    }
    if (menuNames.has(item.name.trim().toLocaleLowerCase())) {
      menuSkippedDuplicateName++;
      continue;
    }
    if (await putIfMissing(TABLES.menu, "id", item as unknown as Record<string, unknown>)) {
      menuInserted++;
      menuIds.add(item.id);
      menuNames.add(item.name.trim().toLocaleLowerCase());
    } else {
      menuExisting++;
    }
  }

  for (const table of seedTables) {
    if (tableNames.has(table.name.trim().toLocaleLowerCase())) {
      tablesExisting++;
      continue;
    }
    if (await putIfMissing(TABLES.tables, "id", table as unknown as Record<string, unknown>)) {
      tablesInserted++;
      tableNames.add(table.name.trim().toLocaleLowerCase());
    } else {
      tablesExisting++;
    }
  }

  return {
    menu: { inserted: menuInserted, existing: menuExisting, skippedDuplicateName: menuSkippedDuplicateName },
    tables: { inserted: tablesInserted, existing: tablesExisting },
  };
}