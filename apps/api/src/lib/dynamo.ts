import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// บน Lambda: ไม่มี DYNAMODB_ENDPOINT -> ใช้ DynamoDB จริงด้วยสิทธิ์ของ LabRole
// บนเครื่อง: src/local/env.ts ตั้ง DYNAMODB_ENDPOINT ชี้ไป DynamoDB Local
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT
    ? { endpoint: process.env.DYNAMODB_ENDPOINT }
    : {}),
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const rawClient = client;