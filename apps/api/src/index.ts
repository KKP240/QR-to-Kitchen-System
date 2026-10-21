import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { route } from "./router";

export const handler: APIGatewayProxyHandlerV2 = (event) => route(event);