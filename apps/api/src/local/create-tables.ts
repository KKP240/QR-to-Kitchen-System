import "./env";
import {
  CreateTableCommand,
  ListTablesCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";
import { rawClient } from "../lib/dynamo";
import { TABLES } from "../lib/config";

const definitions = [
  { name: TABLES.menu, key: "id" },
  { name: TABLES.orders, key: "id" },
  { name: TABLES.tables, key: "id" },
  { name: TABLES.connections, key: "connectionId" },
  { name: TABLES.users, key: "username" },
];

async function waitForDb(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      await rawClient.send(new ListTablesCommand({}));
      return;
    } catch {
      console.log(`waiting for DynamoDB Local... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("DynamoDB Local is not reachable at localhost:8000");
}

async function main() {
  await waitForDb();
  for (const { name, key } of definitions) {
    try {
      await rawClient.send(
        new CreateTableCommand({
          TableName: name,
          BillingMode: "PAY_PER_REQUEST",
          AttributeDefinitions: [{ AttributeName: key, AttributeType: "S" }],
          KeySchema: [{ AttributeName: key, KeyType: "HASH" }],
        })
      );
      console.log(`created: ${name}`);
    } catch (err) {
      if (err instanceof ResourceInUseException) {
        console.log(`exists:  ${name}`);
      } else {
        throw err;
      }
    }
  }
  const list = await rawClient.send(new ListTablesCommand({}));
  console.log("tables now:", list.TableNames);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});