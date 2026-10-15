import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { json } from "../lib/response";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return json(200, {
    status: "ok",
    service: "qr-kitchen-api",
    time: new Date().toISOString(),
  });
};