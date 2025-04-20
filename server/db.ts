import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { log } from "./vite";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

log("Connecting to PostgreSQL database...", "database");
log(`Using DATABASE_URL: ${process.env.DATABASE_URL}`, "database");

// Create a Pool using pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Initialize Drizzle ORM with node-postgres adapter
const db = drizzle(pool, { schema });

// Test the connection
pool
  .query("SELECT NOW()")
  .then((res) => {
    log("Successfully connected to PostgreSQL database", "database");
  })
  .catch((err) => {
    // Log full error message and stack
    log(
      `Failed to connect to PostgreSQL database: ${err.message || err}`,
      "database"
    );
    if (err.stack) {
      log(`Stack trace: ${err.stack}`, "database");
    }
  });

export { pool, db };
