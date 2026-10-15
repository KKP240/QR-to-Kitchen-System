import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { MenuItem } from "@qr-kitchen/shared";
import { db } from "../lib/dynamo";
import { TABLES } from "../lib/config";
import { json } from "../lib/response";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const result = await db.send(new ScanCommand({ TableName: TABLES.menu }));
    const items = (result.Items ?? []) as MenuItem[];
    return json(200, { items });
  } catch (err) {
    console.error(err);
    return json(500, { message: "Internal server error" });
  }
};