import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json, preflight } from "./lib/response";
import type { RouteResult } from "./lib/types";
import { routes } from "./routes";

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean);
  const a = path.split("/").filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export async function route(event: APIGatewayProxyEventV2): Promise<RouteResult> {
  const method = event.requestContext.http.method;
  if (method === "OPTIONS") return preflight();

  for (const r of routes) {
    if (r.method !== method) continue;
    const params = match(r.path, event.rawPath);
    if (!params) continue;
    try {
      return await r.handler({ event, params });
    } catch (err) {
      console.error(err);
      return json(500, { message: "Internal server error" });
    }
  }
  return json(404, { message: "Not found" });
}