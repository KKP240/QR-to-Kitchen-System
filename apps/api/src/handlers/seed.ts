import { json } from "../lib/response";
import { seedInitialData } from "../lib/seed";

export const handler = async () => json(200, await seedInitialData());