import crypto from 'crypto';
import { storage } from './storage';
import { InsertCertificate, Certificate } from '@shared/schema';
import { blockchainService } from './blockchain-service';
import { log } from './vite';

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
    
    // First store in the local database
    const savedCertificate = await storage.createCertificate({
      ...certificate,
      certificateHash,
      certificateId,
    });

    // Then try to store in blockchain if configured
    try {
      if (blockchainService.isConfigured()) {
        const blockchainResult = await blockchainService.storeCertificate(savedCertificate);
        if (blockchainResult) {
          log(`Certificate stored on blockchain. CID: ${blockchainResult.cid}, TX: ${blockchainResult.txHash}`, 'certificate');
          
          // Store the blockchain data in the database
          await storage.updateCertificateBlockchainData(
            savedCertificate.id,
            blockchainResult.cid,
            blockchainResult.txHash
          );
        }
      } else {
        log('Blockchain service not configured. Certificate stored only in database.', 'certificate');
      }
    } catch (error) {
      // Don't fail if blockchain storage fails - we still have the database record
      log(`Failed to store certificate on blockchain: ${error}`, 'certificate');
    }
    
    return savedCertificate;
  }

  /**
   * Verify a certificate by its hash
   */
  static async verifyCertificateByHash(hash: string): Promise<Certificate | undefined> {
    // First check our database
    const certificate = await storage.getCertificateByHash(hash);
    
    // If found and blockchain is configured, also verify on blockchain
    if (certificate && blockchainService.isConfigured() && certificate.ipfsCid) {
      try {
        // Verify the certificate hash on the blockchain using the stored CID
        const isValid = await blockchainService.verifyCertificate(certificate.ipfsCid, hash);
        
        // Log the blockchain verification result
        if (isValid === true) {
          log(`Certificate verified on blockchain successfully. Hash: ${hash}`, 'certificate');
        } else if (isValid === false) {
          log(`Certificate verification failed on blockchain. Hash mismatch. Hash: ${hash}`, 'certificate');
          // In a production environment, you might want to flag this certificate as potentially tampered
        } else {
          log(`Blockchain verification returned null (service error). Hash: ${hash}`, 'certificate');
        }
      } catch (error) {
        log(`Blockchain verification failed: ${error}`, 'certificate');
      }
    }
    
    return certificate;
  }

  /**
   * Verify a certificate by its ID
   */
  static async verifyCertificateById(id: string): Promise<Certificate | undefined> {
    // First check our database
    const certificate = await storage.getCertificateById(id);
    
    // Similar to the hash verification, we would also verify on blockchain if configured
    if (certificate && blockchainService.isConfigured() && certificate.ipfsCid && certificate.certificateHash) {
      try {
        // Verify the certificate hash on the blockchain using the stored CID
        const isValid = await blockchainService.verifyCertificate(
          certificate.ipfsCid, 
          certificate.certificateHash
        );
        
        // Log the blockchain verification result
        if (isValid === true) {
          log(`Certificate verified on blockchain successfully. ID: ${id}`, 'certificate');
        } else if (isValid === false) {
          log(`Certificate verification failed on blockchain. Hash mismatch. ID: ${id}`, 'certificate');
          // In a production environment, you might want to flag this certificate as potentially tampered
        } else {
          log(`Blockchain verification returned null (service error). ID: ${id}`, 'certificate');
        }
      } catch (error) {
        log(`Blockchain verification failed: ${error}`, 'certificate');
      }
    }
    
    return certificate;
  }

  /**
   * Revoke a certificate
   */
  static async revokeCertificate(id: number, reason: string): Promise<Certificate | undefined> {
    // Update in local database
    const certificate = await storage.updateCertificateStatus(id, 'revoked', reason);
    
    // In a real blockchain implementation, you would also record the revocation
    // on the blockchain for immutable proof of revocation
    
    return certificate;
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
