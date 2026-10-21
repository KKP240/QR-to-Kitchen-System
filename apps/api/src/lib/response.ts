import type { RouteResult } from "./types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export function json(statusCode: number, body: unknown): RouteResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify(body),
  };
}

export function preflight(): RouteResult {
  return { statusCode: 204, headers: { ...CORS, "Access-Control-Max-Age": "86400" } };
}

// ใช้กับ endpoint ที่วางโครงไว้แต่ยังไม่มีใครทำ
export function notImplemented(owner: string): RouteResult {
  return json(501, { message: "Not implemented", owner });
}