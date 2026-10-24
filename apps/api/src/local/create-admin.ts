import "./env";
import { createUser } from "../lib/users";

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password || password.length < 8) {
    console.error("usage: pnpm --filter @qr-kitchen/api run admin:create <username> <password(min 8)>");
    process.exit(1);
  }
  await createUser(username, password, "owner");
  console.log(`created/updated user: ${username}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});