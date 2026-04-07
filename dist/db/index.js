import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "@/config/env.config";
const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
export const testConnection = async () => {
    try {
        await client `SELECT 1`;
        console.log("✅ Database connected successfully");
    }
    catch (error) {
        console.log("❌ Database connection failed:", error);
        process.exit(1);
    }
};
export default db;
