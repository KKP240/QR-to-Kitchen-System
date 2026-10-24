import { signToken, verifyPassword, withAuth } from "../lib/auth";
import { json } from "../lib/response";
import { USER_ROLES, type Route } from "../lib/types";
import { getUser } from "../lib/users";

export const authRoutes: Route[] = [
  {
    method: "POST",
    path: "/auth/login",
    handler: async ({ event }) => {
      let body: { username?: unknown; password?: unknown };
      try {
        body = JSON.parse(event.body ?? "{}");
      } catch {
        return json(400, { message: "Invalid JSON" });
      }
      const { username, password } = body;
      if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
        return json(400, { message: "username and password are required" });
      }
      const user = await getUser(username);
      if (!user || !(await verifyPassword(password, user.passwordHash)) || !USER_ROLES.includes(user.role)) {
        return json(401, { message: "Invalid username or password" });
      }
      return json(200, {
        token: signToken(user.username, user.role),
        user: { username: user.username, role: user.role },
      });
    },
  },
  {
    method: "GET",
    path: "/auth/me",
    handler: withAuth(async ({ user }) => json(200, { username: user!.sub, role: user!.role })),
  },
];