import { createUser, deleteUser } from "../lib/users";
import { USER_ROLES, type UserRole } from "../lib/types";

// Invoke only through AWS CLI: create { username, password, role? } or delete { username, action: "delete" }.
export const handler = async (event: { username?: string; password?: string; role?: string; action?: string }) => {
  if (event.action === "delete") {
    if (!event.username) return { statusCode: 400, body: "username is required" };
    const deleted = await deleteUser(event.username);
    return { statusCode: deleted ? 200 : 404, body: JSON.stringify({ deleted, username: event.username }) };
  }
  const role = event.role ?? "manager";
  if (!event.username || !event.password || event.password.length < 8) {
    return { statusCode: 400, body: "username and password (min 8 chars) are required" };
  }
  if (role !== "manager" && role !== "kitchen") {
    return { statusCode: 400, body: `role must be manager or kitchen (supported roles: ${USER_ROLES.join(", ")})` };
  }
  await createUser(event.username, event.password, role as UserRole);
  return { statusCode: 200, body: JSON.stringify({ created: event.username, role }) };
};