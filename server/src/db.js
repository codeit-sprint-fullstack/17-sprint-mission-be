import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export const prisma = new PrismaClient();
