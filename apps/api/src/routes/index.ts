import type { Route } from "../lib/types";
import { authRoutes } from "./auth";
import { healthRoutes } from "./health";
import { menuRoutes } from "./menu";
import { orderRoutes } from "./orders";
import { tableRoutes } from "./tables";

export const routes: Route[] = [
  ...healthRoutes,
  ...authRoutes,
  ...menuRoutes,
  ...orderRoutes,
  ...tableRoutes,
];