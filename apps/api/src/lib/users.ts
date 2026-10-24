import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "./dynamo";
import { TABLES } from "./config";
import { hashPassword } from "./auth";

export interface User {
  username: string;
  passwordHash: string;
  role: string;
}

export async function getUser(username: string): Promise<User | null> {
  const r = await db.send(new GetCommand({ TableName: TABLES.users, Key: { username } }));
  return (r.Item as User) ?? null;
}

// เรียกซ้ำกับ username เดิม = รีเซ็ตรหัสผ่าน
export async function createUser(username: string, password: string, role = "owner") {
  const passwordHash = await hashPassword(password);
  await db.send(
    new PutCommand({ TableName: TABLES.users, Item: { username, passwordHash, role } })
  );
}