import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { CertificateService } from "./certificate-service";
import { insertCertificateSchema, revokeCertificateSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { blockchainService } from "./blockchain-service";

// Helper middleware to check roles
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Certificate routes
  // Get all certificates for current user based on role
  app.get("/api/certificates", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let certificates;
      if (req.user!.role === "student") {
        certificates = await storage.getCertificatesByStudentId(req.user!.id);
      } else if (req.user!.role === "university") {
        certificates = await storage.getCertificatesByUniversityId(req.user!.id);
      } else if (req.user!.role === "employer" || req.user!.role === "admin") {
        certificates = await storage.getAllCertificates();
      } else {
        return res.status(403).json({ message: "Forbidden: Invalid role" });
      }
      
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Get a specific certificate by ID
  app.get("/api/certificates/:id", async (req, res) => {
    try {
      const certificate = await storage.getCertificate(parseInt(req.params.id));
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // If the user is a student, they should only be able to view their own certificates
      if (
        req.isAuthenticated() && 
        req.user!.role === "student" && 
        certificate.studentId !== req.user!.id
      ) {
        return res.status(403).json({ message: "Forbidden: Not your certificate" });
      }
      
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  });

  // Issue a new certificate (university only)
  app.post("/api/certificates", requireRole(["university", "admin"]), async (req, res) => {
    try {
      const certificateData = insertCertificateSchema.parse(req.body);
      
      // Set the university ID to the current user
      certificateData.universityId = req.user!.id;
      
      // Issue the certificate
      const certificate = await CertificateService.issueCertificate(certificateData);
      
      res.status(201).json(certificate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to issue certificate" });
    }
  });

  // Revoke a certificate (university only)
  app.post("/api/certificates/:id/revoke", requireRole(["university", "admin"]), async (req, res) => {
    try {
      const { revocationReason } = revokeCertificateSchema.parse({
        id: parseInt(req.params.id),
        ...req.body
      });
      
      const certificate = await storage.getCertificate(parseInt(req.params.id));
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Only the issuing university can revoke the certificate
      if (certificate.universityId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Not your certificate to revoke" });
      }
      
      const updatedCertificate = await CertificateService.revokeCertificate(
        certificate.id,
        revocationReason
      );
      
      res.json(updatedCertificate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to revoke certificate" });
    }
  });

  // Verify a certificate (public route)
  app.get("/api/verify/:certificateId", async (req, res) => {
    try {
      const certificate = await CertificateService.verifyCertificateById(req.params.certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Record verification if user is authenticated
      if (req.isAuthenticated()) {
        await CertificateService.recordVerification(
          certificate.id,
          req.user!.name,
          req.user!.email
        );
      }
      
      res.json({
        ...certificate,
        isValid: certificate.status === "active",
        isRevoked: certificate.status === "revoked",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify certificate" });
    }
  });

  // Get verification history for a certificate
  app.get("/api/certificates/:id/verifications", async (req, res) => {
    try {
      const certificate = await storage.getCertificate(parseInt(req.params.id));
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // If the user is a student, they should only be able to view verifications for their certificates
      if (
        req.isAuthenticated() && 
        req.user!.role === "student" && 
        certificate.studentId !== req.user!.id
      ) {
        return res.status(403).json({ message: "Forbidden: Not your certificate" });
      }
      
      const verifications = await storage.getVerificationsByCertificateId(certificate.id);
      
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verification history" });
    }
  });

  // Get all verification records (university or admin only)
  app.get("/api/verifications", requireRole(["university", "admin"]), async (req, res) => {
    try {
      const verifications = await storage.getAllVerifications();
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  // Blockchain-related routes
  // Get blockchain configuration status - admin only
  app.get("/api/blockchain/status", requireRole(["admin"]), async (req, res) => {
    try {
      const isConfigured = blockchainService.isConfigured();
      
      // Return configuration status to admin
      res.json({
        isConfigured,
        provider: process.env.ETHEREUM_PROVIDER || null,
        contractAddress: process.env.CONTRACT_ADDRESS || null,
        ipfsConfigured: !!process.env.IPFS_API_URL,
        accountConfigured: !!process.env.ETHEREUM_PRIVATE_KEY
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blockchain status" });
    }
  });

  // Retrieve a certificate from IPFS - admin only
  app.get("/api/blockchain/ipfs/:cid", requireRole(["admin"]), async (req, res) => {
    try {
      if (!blockchainService.isConfigured()) {
        return res.status(503).json({ message: "Blockchain services not properly configured" });
      }
      
      const certificate = await blockchainService.retrieveCertificate(req.params.cid);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found on IPFS" });
      }
      
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve certificate from IPFS" });
    }
  });

  // Verify a certificate directly on the blockchain - admin only
  app.post("/api/blockchain/verify", requireRole(["admin"]), async (req, res) => {
    try {
      if (!blockchainService.isConfigured()) {
        return res.status(503).json({ message: "Blockchain services not properly configured" });
      }
      
      const { cid, hash } = req.body;
      
      if (!cid || !hash) {
        return res.status(400).json({ message: "CID and hash are required" });
      }
      
      const isValid = await blockchainService.verifyCertificate(cid, hash);
      
      res.json({ isValid });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify certificate on blockchain" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
