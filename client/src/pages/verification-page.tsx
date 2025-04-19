import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Certificate } from '@shared/schema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QRScannerModal from '@/components/certificate/QRScannerModal';
import VerificationResultModal from '@/components/certificate/VerificationResultModal';
import CertificateDetails from '@/components/certificate/CertificateDetails';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, QrCode, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function VerificationPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [certificateId, setCertificateId] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'revoked' | 'loading' | null>(null);
  const [showVerificationResult, setShowVerificationResult] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  
  // Parse query parameters for certificate ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setCertificateId(id);
      handleVerifyCertificate(id);
    }
  }, []);

  // Certificate verification query
  const {
    data: verificationResult,
    refetch,
    isLoading,
    isError,
    error
  } = useQuery<Certificate>({
    queryKey: [`/api/verify/${certificateId}`],
    enabled: false,
  });

  // Handle certificate verification
  const handleVerifyCertificate = async (id: string) => {
    if (!id) {
      toast({
        title: 'Verification Error',
        description: 'Please enter a certificate ID to verify',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCertificateId(id);
      setVerificationStatus('loading');
      setShowVerificationResult(true);
      
      // Call the API to verify the certificate
      const res = await apiRequest('GET', `/api/verify/${id}`, undefined);
      const data = await res.json();
      
      if (data.status === 'revoked') {
        setVerificationStatus('revoked');
      } else if (data.status === 'active') {
        setVerificationStatus('valid');
      } else {
        setVerificationStatus('invalid');
      }
      
      setSelectedCertificate(data);
    } catch (error: any) {
      setShowVerificationResult(false);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Could not verify the certificate',
        variant: 'destructive',
      });
    }
  };

  // Handle file upload for verification
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/json') {
      toast({
        title: 'Invalid file type',
        description: 'Only JSON certificate files are supported for verification',
        variant: 'destructive',
      });
      return;
    }

    // Read the file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const certificate = JSON.parse(content) as Certificate;
        
        if (!certificate.certificateId) {
          throw new Error('Invalid certificate format');
        }

        handleVerifyCertificate(certificate.certificateId);
      } catch (error) {
        toast({
          title: 'Invalid certificate',
          description: 'The file does not contain a valid certificate',
          variant: 'destructive',
        });
      }
    };
    
    reader.readAsText(file);
  };

  // Handle QR code scanning
  const handleQRScan = (scannedCertificateId: string) => {
    handleVerifyCertificate(scannedCertificateId);
  };

  // Handle viewing full certificate details
  const handleViewFullCertificate = () => {
    if (selectedCertificate) {
      setShowVerificationResult(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-secondary-900 sm:text-3xl sm:truncate">
                  Certificate Verification
                </h2>
                <p className="mt-1 text-secondary-500">
                  Verify the authenticity of educational certificates
                </p>
              </div>
            </div>

            {/* Show certificate details if a certificate is selected */}
            {selectedCertificate && !showVerificationResult ? (
              <CertificateDetails 
                certificate={selectedCertificate} 
                onClose={() => setSelectedCertificate(null)} 
              />
            ) : (
              <>
                {/* Verification methods */}
                <div className="space-y-6">
                  {/* Method 1: Direct ID verification */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Verify by Certificate ID</CardTitle>
                      <CardDescription>
                        Enter the certificate ID to verify its authenticity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="certificate-id">Certificate ID</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="certificate-id" 
                              placeholder="Enter certificate ID" 
                              value={certificateId}
                              onChange={(e) => setCertificateId(e.target.value)} 
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => handleVerifyCertificate(certificateId)}
                              disabled={!certificateId || isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Verify
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Method 2: File upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Verify by Certificate File</CardTitle>
                      <CardDescription>
                        Upload a certificate file to verify its authenticity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-secondary-400" />
                          <div className="flex text-sm text-secondary-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                              <span>Upload a file</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                onChange={handleFileUpload} 
                                accept=".json"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-secondary-500">
                            JSON certificate files only
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Method 3: QR code scanning */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Verify by QR Code</CardTitle>
                      <CardDescription>
                        Scan a certificate QR code to verify its authenticity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => setIsQRScannerOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center"
                      >
                        <QrCode className="h-5 w-5 mr-2" />
                        Scan QR Code
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />

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
        result={selectedCertificate}
        status={verificationStatus}
      />
    </div>
  );
}
