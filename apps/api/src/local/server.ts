import "./env";
import { createServer } from "node:http";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { route } from "../router";

const PORT = Number(process.env.PORT ?? 4000);

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // จำลอง event รูปแบบเดียวกับ Lambda Function URL
  const event = {
    version: "2.0",
    rawPath: url.pathname,
    rawQueryString: url.search.slice(1),
    queryStringParameters: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : (v ?? "")])
    ),
    body: chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined,
    isBase64Encoded: false,
    requestContext: { http: { method: req.method ?? "GET", path: url.pathname } },
  } as unknown as APIGatewayProxyEventV2;

  const result = await route(event);
  res.writeHead(result.statusCode, result.headers);
  res.end(result.body ?? "");
}).listen(PORT, () => console.log(`API (local) listening on http://localhost:${PORT}`));