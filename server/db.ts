import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { log } from "./vite";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

log("Connecting to PostgreSQL database...", "database");

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Test the connection
pool.query('SELECT NOW()')
  .then(() => {
    log("Successfully connected to PostgreSQL database", "database");
  })
  .catch(err => {
    log(`Failed to connect to PostgreSQL database: ${err}`, "database");
  });