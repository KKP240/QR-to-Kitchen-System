import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "./dynamo";
import { TABLES } from "./config";
import { hashPassword } from "./auth";
import type { UserRole } from "./types";

export interface User {
  username: string;
  passwordHash: string;
  role: UserRole;
}

export async function getUser(username: string): Promise<User | null> {
  const r = await db.send(new GetCommand({ TableName: TABLES.users, Key: { username } }));
  return (r.Item as User) ?? null;
}

// เรียกซ้ำกับ username เดิม = รีเซ็ตรหัสผ่าน
export async function createUser(username: string, password: string, role: UserRole = "manager") {
  const passwordHash = await hashPassword(password);
  await db.send(
    new PutCommand({ TableName: TABLES.users, Item: { username, passwordHash, role } })
  );
}

export async function deleteUser(username: string): Promise<boolean> {
  try {
    await db.send(new DeleteCommand({
      TableName: TABLES.users,
      Key: { username },
      ConditionExpression: "attribute_exists(username)",
    }));
    return true;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) return false;
    throw error;
  }
}