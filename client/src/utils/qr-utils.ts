/**
 * Get QR code URL for a certificate ID
 */
export function getQRCodeUrl(certificateId: string, size = 150): string {
  const baseUrl = window.location.origin;
  const verificationUrl = `${baseUrl}/verification?id=${encodeURIComponent(certificateId)}`;
  
  // Use a free QR code API service
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verificationUrl)}`;
}
