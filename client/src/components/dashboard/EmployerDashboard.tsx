import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Certificate } from '@shared/schema';
import { formatDate, getStatusBadgeClass } from '@/utils/certificate-utils';
import { Loader2, Upload, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import QRScannerModal from '@/components/certificate/QRScannerModal';
import VerificationResultModal from '@/components/certificate/VerificationResultModal';
import CertificateDetails from '@/components/certificate/CertificateDetails';

export default function EmployerDashboard() {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<Certificate | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'revoked' | 'loading' | null>(null);
  const [showVerificationResult, setShowVerificationResult] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const { toast } = useToast();
  
  // Fetch recent verification history
  const { data: verifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/verifications'],
  });

  // Handle file upload for verification
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/json') {
      toast({
        title: 'Invalid file type',
        description: 'Only JSON files are supported for verification in this demo.',
        variant: 'destructive',
      });
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const certificate = JSON.parse(content) as Certificate;
        
        if (!certificate.certificateId) {
          throw new Error('Invalid certificate format');
        }

        setVerificationStatus('loading');
        setShowVerificationResult(true);
        
        // Simulate verification delay
        setTimeout(() => {
          // In a real implementation, we would verify the certificate against the blockchain
          if (certificate.status === 'revoked') {
            setVerificationStatus('revoked');
          } else {
            setVerificationStatus('valid');
          }
          
          setVerificationResult(certificate);
        }, 1000);
      } catch (error) {
        toast({
          title: 'Invalid certificate',
          description: 'The file does not contain a valid certificate.',
          variant: 'destructive',
        });
      }
    };
    
    reader.readAsText(file);
  };

  // Handle QR code scanning
  const handleQRScan = async (certificateId: string) => {
    try {
      setVerificationStatus('loading');
      setShowVerificationResult(true);
      
      // In a real implementation, we would fetch the certificate from the API
      // For now, simulate a delay and then return a result
      setTimeout(() => {
        // Mock certificate for demo purposes
        const mockCertificate: Certificate = {
          id: 1,
          studentId: 1,
          universityId: 2,
          studentName: "John Doe",
          studentEmail: "john.doe@example.com",
          universityName: "Tech University",
          degreeName: "Bachelor of Computer Science",
          degreeField: null,
          issueDate: new Date().toISOString(),
          certificateHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
          certificateId: certificateId,
          status: "active",
          revocationDate: null,
          revocationReason: null,
        };
        
        setVerificationStatus('valid');
        setVerificationResult(mockCertificate);
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
      setShowVerificationResult(false);
    }
  };

  // Handle view full certificate
  const handleViewFullCertificate = () => {
    if (verificationResult) {
      setSelectedCertificate(verificationResult);
      setShowVerificationResult(false);
    }
  };

  if (selectedCertificate) {
    return (
      <CertificateDetails 
        certificate={selectedCertificate} 
        onClose={() => setSelectedCertificate(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-secondary-900 sm:text-3xl sm:truncate">
            Certificate Verification
          </h2>
          <p className="mt-1 text-secondary-500">
            Verify certificates issued to candidates
          </p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-secondary-900">Verify a Certificate</h3>
          <div className="mt-2 max-w-xl text-sm text-secondary-500">
            <p>Upload a certificate file or scan a QR code to verify its authenticity.</p>
          </div>
          <div className="mt-5 sm:flex sm:items-center">
            <div className="w-full sm:max-w-md">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-secondary-400" />
                  <div className="flex text-sm text-secondary-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept=".json" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-secondary-500">
                    JSON certificate files
                  </p>
                </div>
              </div>
            </div>
            <span className="mt-3 sm:mt-0 sm:ml-3 sm:text-sm">or</span>
            <div className="mt-3 sm:mt-0 sm:ml-3 sm:flex-shrink-0">
              <Button onClick={() => setIsQRScannerOpen(true)} className="flex items-center">
                <QrCode className="-ml-1 mr-2 h-5 w-5" />
                Scan QR Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification History for Employers */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-secondary-900">Recent Verifications</h3>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-secondary-200">
            {verifications.length > 0 ? (
              verifications.slice(0, 5).map((verification, index) => (
                <li key={index}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                            <Shield className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-primary-700">
                              {verification.studentName} - {verification.degreeName}
                            </div>
                            <div className="text-sm text-secondary-500">
                              Issued by: {verification.universityName}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(verification.status)}`}>
                          {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                        </span>
                        <div className="ml-4 text-sm text-secondary-500">
                          {formatDate(verification.verifiedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-8 text-center">
                <p className="text-secondary-500">No verification history yet. Verified certificates will appear here.</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal 
        isOpen={isQRScannerOpen} 
        onClose={() => setIsQRScannerOpen(false)} 
        onScan={handleQRScan}
      />

      {/* Verification Result Modal */}
      <VerificationResultModal
        isOpen={showVerificationResult}
        onClose={() => setShowVerificationResult(false)}
        onViewDetails={handleViewFullCertificate}
        result={verificationResult}
        status={verificationStatus}
      />
    </div>
  );
}

// Mocked SVG component
function Shield(props) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}
