import { db } from "./db";
import { log } from "./vite";
import util from "util";

// This function pushes the schema to the database
export async function runMigrations() {
  log("Running database migrations...", "database");

  try {
    // Push the schema to the database
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student'
      );
      
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id),
        university_id INTEGER REFERENCES users(id),
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        university_name TEXT NOT NULL,
        degree_name TEXT NOT NULL,
        degree_field TEXT,
        issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
        certificate_hash TEXT NOT NULL,
        certificate_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        revocation_date TIMESTAMP,
        revocation_reason TEXT,
        ipfs_cid TEXT,
        blockchain_tx_hash TEXT
      );
      
      CREATE TABLE IF NOT EXISTS verifications (
        id SERIAL PRIMARY KEY,
        certificate_id INTEGER REFERENCES certificates(id),
        verified_by TEXT NOT NULL,
        verified_by_email TEXT,
        verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'verified'
      );
    `);

    log("Database migrations completed successfully!", "database");
  } catch (error) {
    log(
      `Database migration error:\n${util.inspect(error, { depth: null })}`,
      "database"
    );
    throw error;
  }
}
