import "./env";
import { createUser } from "../lib/users";
import { USER_ROLES, type UserRole } from "../lib/types";

async function main() {
  const [username, password, role = "manager"] = process.argv.slice(2);
  if (!username || !password || password.length < 8 || !USER_ROLES.includes(role as UserRole)) {
    console.error("usage: pnpm --filter @qr-kitchen/api run admin:create <username> <password(min 8)> [customer|kitchen|manager]");
    process.exit(1);
  }
  await createUser(username, password, role as UserRole);
  console.log(`created/updated ${role}: ${username}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});