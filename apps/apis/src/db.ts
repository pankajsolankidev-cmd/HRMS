import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", { ssl: "require" });
export const db = drizzle(sql);
