import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("student"),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id),
  universityId: integer("university_id").references(() => users.id),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  universityName: text("university_name").notNull(),
  degreeName: text("degree_name").notNull(),
  degreeField: text("degree_field"),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  certificateHash: text("certificate_hash").notNull(),
  certificateId: text("certificate_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  revocationDate: timestamp("revocation_date"),
  revocationReason: text("revocation_reason"),
});

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id").references(() => certificates.id),
  verifiedBy: text("verified_by").notNull(),
  verifiedByEmail: text("verified_by_email"),
  verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  status: text("status").notNull().default("verified"),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Certificate schemas
export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  certificateHash: true,
  certificateId: true,
  revocationDate: true,
  revocationReason: true,
});

export const revokeCertificateSchema = z.object({
  id: z.number(),
  revocationReason: z.string().min(1, "Reason is required"),
});

// Verification schema
export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  verifiedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type RevokeCertificate = z.infer<typeof revokeCertificateSchema>;

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
