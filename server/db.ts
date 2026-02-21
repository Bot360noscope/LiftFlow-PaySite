import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        tier TEXT,
        user_count INTEGER,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE payment_users ADD COLUMN IF NOT EXISTS tier TEXT;`);
    await pool.query(`ALTER TABLE payment_users ADD COLUMN IF NOT EXISTS user_count INTEGER;`);
    console.log("[db] payment_users table ready");
  } catch (err: any) {
    console.error("[db] Error ensuring tables:", err.message);
  }
}
