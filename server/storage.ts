import {
  users,
  certificates,
  verifications,
  type User,
  type InsertUser,
  type Certificate,
  type InsertCertificate,
  type Verification,
  type InsertVerification,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Certificate management
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateByHash(hash: string): Promise<Certificate | undefined>;
  getCertificateById(certificateId: string): Promise<Certificate | undefined>;
  getCertificatesByStudentId(studentId: number): Promise<Certificate[]>;
  getCertificatesByUniversityId(universityId: number): Promise<Certificate[]>;
  getAllCertificates(): Promise<Certificate[]>;
  createCertificate(
    certificate: InsertCertificate & {
      certificateHash: string;
      certificateId: string;
    }
  ): Promise<Certificate>;
  updateCertificateStatus(
    id: number,
    status: string,
    reason?: string
  ): Promise<Certificate | undefined>;
  // Blockchain-related method
  updateCertificateBlockchainData(
    id: number,
    ipfsCid: string,
    blockchainTxHash: string | null
  ): Promise<Certificate | undefined>;

  // Verification management
  getVerificationsByCertificateId(
    certificateId: number
  ): Promise<Verification[]>;
  createVerification(verification: InsertVerification): Promise<Verification>;
  getAllVerifications(): Promise<Verification[]>;

  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private certificates: Map<number, Certificate>;
  private verifications: Map<number, Verification>;
  sessionStore: any;
  private userCurrentId: number;
  private certificateCurrentId: number;
  private verificationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.certificates = new Map();
    this.verifications = new Map();
    this.userCurrentId = 1;
    this.certificateCurrentId = 1;
    this.verificationCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "student", // Default role if not provided
    };
    this.users.set(id, user);
    return user;
  }

  // Certificate methods
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async getCertificateByHash(hash: string): Promise<Certificate | undefined> {
    return Array.from(this.certificates.values()).find(
      (cert) => cert.certificateHash === hash
    );
  }

  async getCertificateById(
    certificateId: string
  ): Promise<Certificate | undefined> {
    return Array.from(this.certificates.values()).find(
      (cert) => cert.certificateId === certificateId
    );
  }

  async getCertificatesByStudentId(studentId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(
      (cert) => cert.studentId === studentId
    );
  }

  async getCertificatesByUniversityId(
    universityId: number
  ): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(
      (cert) => cert.universityId === universityId
    );
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return Array.from(this.certificates.values());
  }

  async createCertificate(
    certificate: InsertCertificate & {
      certificateHash: string;
      certificateId: string;
    }
  ): Promise<Certificate> {
    const id = this.certificateCurrentId++;

    // Create certificate with explicit field mappings to match schema
    const newCertificate: Certificate = {
      id,
      certificateId: certificate.certificateId,
      certificateHash: certificate.certificateHash,
      studentName: certificate.studentName,
      studentEmail: certificate.studentEmail,
      universityName: certificate.universityName,
      degreeName: certificate.degreeName,
      // Optional fields with defaults
      studentId: certificate.studentId || null,
      universityId: certificate.universityId || null,
      degreeField: certificate.degreeField || null,
      issueDate: certificate.issueDate || new Date(),
      status: "active",
      revocationDate: null,
      revocationReason: null,
      ipfsCid: certificate.ipfsCid || null,
      blockchainTxHash: certificate.blockchainTxHash || null,
    };

    this.certificates.set(id, newCertificate);
    return newCertificate;
  }

  async updateCertificateStatus(
    id: number,
    status: string,
    reason?: string
  ): Promise<Certificate | undefined> {
    const certificate = this.certificates.get(id);
    if (!certificate) return undefined;

    const updatedCertificate: Certificate = {
      ...certificate,
      status,
      revocationDate:
        status === "revoked" ? new Date() : certificate.revocationDate,
      revocationReason: reason || certificate.revocationReason,
    };

    this.certificates.set(id, updatedCertificate);
    return updatedCertificate;
  }

  async updateCertificateBlockchainData(
    id: number,
    ipfsCid: string,
    blockchainTxHash: string | null
  ): Promise<Certificate | undefined> {
    const certificate = this.certificates.get(id);
    if (!certificate) return undefined;

    const updatedCertificate: Certificate = {
      ...certificate,
      ipfsCid,
      blockchainTxHash,
    };

    this.certificates.set(id, updatedCertificate);
    return updatedCertificate;
  }

  // Verification methods
  async getVerificationsByCertificateId(
    certificateId: number
  ): Promise<Verification[]> {
    return Array.from(this.verifications.values()).filter(
      (verification) => verification.certificateId === certificateId
    );
  }

  async createVerification(
    verification: InsertVerification
  ): Promise<Verification> {
    const id = this.verificationCurrentId++;

    // Create verification with explicit field mappings to match schema
    const newVerification: Verification = {
      id,
      certificateId: verification.certificateId || null,
      status: verification.status || "verified",
      verifiedBy: verification.verifiedBy,
      verifiedByEmail: verification.verifiedByEmail || null,
      verifiedAt: new Date(),
    };

    this.verifications.set(id, newVerification);
    return newVerification;
  }

  async getAllVerifications(): Promise<Verification[]> {
    return Array.from(this.verifications.values());
  }
}

// Import the DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
