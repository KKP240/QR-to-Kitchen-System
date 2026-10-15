import "./env";

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error("usage: pnpm --filter @qr-kitchen/api run invoke <handler-name>");
    process.exit(1);
  }
  const mod = await import(`../handlers/${name}`);
  const result = await (mod.handler as any)({}, {}, () => {});
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});