import type { APIGatewayProxyEventV2 } from "aws-lambda";

export const USER_ROLES = ["customer", "kitchen", "manager"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface TokenPayload {
  sub: string; // username
  role: UserRole;
  exp: number;
}

export interface RouteContext {
  event: APIGatewayProxyEventV2;
  params: Record<string, string>;
  user?: TokenPayload; // มีค่าเมื่อ route ถูกครอบด้วย withAuth
}

export interface RouteResult {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
}

export type RouteHandler = (ctx: RouteContext) => Promise<RouteResult>;

export interface Route {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  handler: RouteHandler;
}