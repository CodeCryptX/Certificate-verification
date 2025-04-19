import { users, certificates, verifications, type User, type InsertUser, type Certificate, type InsertCertificate, type Verification, type InsertVerification } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";
import { log } from "./vite";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
    log("PostgreSQL session store initialized", "database");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure role is set
    const userWithRole = {
      ...insertUser,
      role: insertUser.role || 'student'
    };
    
    const [user] = await db.insert(users).values(userWithRole).returning();
    return user;
  }

  // Certificate methods
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id));
    return certificate;
  }

  async getCertificateByHash(hash: string): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateHash, hash));
    return certificate;
  }

  async getCertificateById(certificateId: string): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateId, certificateId));
    return certificate;
  }

  async getCertificatesByStudentId(studentId: number): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.studentId, studentId));
  }

  async getCertificatesByUniversityId(universityId: number): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.universityId, universityId));
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return await db.select().from(certificates);
  }

  async createCertificate(certificate: InsertCertificate & { certificateHash: string, certificateId: string }): Promise<Certificate> {
    const [newCertificate] = await db
      .insert(certificates)
      .values({
        ...certificate,
        status: "active",
      })
      .returning();
    return newCertificate;
  }

  async updateCertificateStatus(id: number, status: string, reason?: string): Promise<Certificate | undefined> {
    const [updatedCertificate] = await db
      .update(certificates)
      .set({
        status,
        revocationDate: status === "revoked" ? new Date() : null,
        revocationReason: reason || null,
      })
      .where(eq(certificates.id, id))
      .returning();
    return updatedCertificate;
  }

  async updateCertificateBlockchainData(id: number, ipfsCid: string, blockchainTxHash: string | null): Promise<Certificate | undefined> {
    const [updatedCertificate] = await db
      .update(certificates)
      .set({
        ipfsCid,
        blockchainTxHash,
      })
      .where(eq(certificates.id, id))
      .returning();
    return updatedCertificate;
  }

  // Verification methods
  async getVerificationsByCertificateId(certificateId: number): Promise<Verification[]> {
    return await db
      .select()
      .from(verifications)
      .where(eq(verifications.certificateId, certificateId));
  }

  async createVerification(verification: InsertVerification): Promise<Verification> {
    const [newVerification] = await db
      .insert(verifications)
      .values({
        ...verification,
        status: verification.status || 'verified'
      })
      .returning();
    return newVerification;
  }

  async getAllVerifications(): Promise<Verification[]> {
    return await db.select().from(verifications);
  }
}