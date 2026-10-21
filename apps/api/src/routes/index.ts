import type { Route } from "../lib/types";
import { healthRoutes } from "./health";
import { menuRoutes } from "./menu";
import { orderRoutes } from "./orders";
import { tableRoutes } from "./tables";

export const routes: Route[] = [
  ...healthRoutes,
  ...menuRoutes,
  ...orderRoutes,
  ...tableRoutes,
];