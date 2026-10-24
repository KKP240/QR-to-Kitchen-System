import "./env";
import { seedInitialData } from "../lib/seed";


async function main() {
  const result = await seedInitialData();
  console.log("seed result:", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});