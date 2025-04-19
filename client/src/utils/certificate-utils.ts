import crypto from 'crypto';
import { Certificate } from '@shared/schema';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get a status badge class based on certificate status
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'revoked':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-secondary-100 text-secondary-800';
  }
}

/**
 * Format a certificate hash for display (shortened)
 */
export function formatHash(hash: string, length = 8): string {
  if (!hash) return '';
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

/**
 * Download certificate as PDF (simulated for MVP)
 * In a real implementation, this would generate a PDF
 */
export function downloadCertificateAsJSON(certificate: Certificate): void {
  // Create a JSON representation of the certificate
  const certificateData = JSON.stringify(certificate, null, 2);
  
  // Create a Blob with the JSON data
  const blob = new Blob([certificateData], { type: 'application/json' });
  
  // Create a URL for the Blob
  const url = window.URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = `certificate-${certificate.certificateId}.json`;
  
  // Append the link to the body
  document.body.appendChild(link);
  
  // Simulate a click on the link
  link.click();
  
  // Remove the link from the body
  document.body.removeChild(link);
  
  // Release the URL
  window.URL.revokeObjectURL(url);
}

/**
 * Create a share link for certificate verification
 */
export function createShareLink(certificateId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/verification?id=${encodeURIComponent(certificateId)}`;
}

/**
 * Copy text to clipboard
 */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
