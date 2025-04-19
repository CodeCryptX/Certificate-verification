import crypto from 'crypto';
import { storage } from './storage';
import { InsertCertificate, Certificate } from '@shared/schema';

export class CertificateService {
  /**
   * Generate a SHA-256 hash for a certificate
   */
  static generateCertificateHash(certificate: InsertCertificate): string {
    // Create a string representation of the certificate data
    const certificateData = JSON.stringify({
      studentName: certificate.studentName,
      universityName: certificate.universityName,
      degreeName: certificate.degreeName,
      degreeField: certificate.degreeField,
      issueDate: certificate.issueDate,
    });
    
    // Generate a SHA-256 hash
    return crypto.createHash('sha256').update(certificateData).digest('hex');
  }

  /**
   * Generate a unique certificate ID
   */
  static generateCertificateId(): string {
    const timestamp = new Date().getTime();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `CERT-${timestamp}-${randomString}`;
  }

  /**
   * Create a new certificate
   */
  static async issueCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const certificateHash = this.generateCertificateHash(certificate);
    const certificateId = this.generateCertificateId();
    
    return storage.createCertificate({
      ...certificate,
      certificateHash,
      certificateId,
    });
  }

  /**
   * Verify a certificate by its hash
   */
  static async verifyCertificateByHash(hash: string): Promise<Certificate | undefined> {
    return storage.getCertificateByHash(hash);
  }

  /**
   * Verify a certificate by its ID
   */
  static async verifyCertificateById(id: string): Promise<Certificate | undefined> {
    return storage.getCertificateById(id);
  }

  /**
   * Revoke a certificate
   */
  static async revokeCertificate(id: number, reason: string): Promise<Certificate | undefined> {
    return storage.updateCertificateStatus(id, 'revoked', reason);
  }

  /**
   * Record a verification
   */
  static async recordVerification(certificateId: number, verifiedBy: string, verifiedByEmail?: string): Promise<void> {
    await storage.createVerification({
      certificateId,
      verifiedBy,
      verifiedByEmail,
      status: 'verified'
    });
  }
}
