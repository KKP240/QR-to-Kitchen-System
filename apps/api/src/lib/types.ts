import type { APIGatewayProxyEventV2 } from "aws-lambda";

export interface RouteContext {
  event: APIGatewayProxyEventV2;
  params: Record<string, string>; // เช่น /menu/:id -> params.id
}

export interface RouteResult {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
}

export type RouteHandler = (ctx: RouteContext) => Promise<RouteResult>;

export interface Route {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string; // รองรับ :param เช่น "/orders/:id/status"
  handler: RouteHandler;
}