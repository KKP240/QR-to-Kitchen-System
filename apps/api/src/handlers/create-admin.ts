import { createUser } from "../lib/users";

// Invoke with: { "username": "...", "password": "..." } (password min 8 chars)
export const handler = async (event: { username?: string; password?: string }) => {
  if (!event.username || !event.password || event.password.length < 8) {
    return { statusCode: 400, body: "username and password (min 8 chars) are required" };
  }
  await createUser(event.username, event.password, "owner");
  return { statusCode: 200, body: JSON.stringify({ created: event.username }) };
};