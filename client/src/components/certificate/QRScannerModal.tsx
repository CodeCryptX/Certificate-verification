import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Scan } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (certificateId: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const { toast } = useToast();
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  
  // In a real implementation, this would use a QR scanner library
  // For now, we'll simulate scanning with a manually entered certificate ID
  const [manualCertificateId, setManualCertificateId] = useState('');

  // Simulate scanning availability check
  useEffect(() => {
    if (isOpen) {
      // Check if camera is available
      const checkCamera = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setScannerAvailable(videoDevices.length > 0);
        } catch (error) {
          console.error('Error checking camera:', error);
          setScannerAvailable(false);
        }
      };
      
      checkCamera();
    }
  }, [isOpen]);

  const handleScan = () => {
    if (manualCertificateId) {
      onScan(manualCertificateId);
      setManualCertificateId('');
      onClose();
    } else {
      toast({
        title: 'No Certificate ID',
        description: 'Please enter a certificate ID to verify.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Scan className="h-6 w-6 text-primary-600" />
          </div>
          <DialogTitle className="text-center">Scan QR Code</DialogTitle>
          <DialogDescription className="text-center">
            Align the QR code within the scanner to verify the certificate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex flex-col items-center">
          {scannerAvailable ? (
            <div className="w-full h-64 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <p className="text-center text-secondary-500">
                Camera not active in this version.
                <br />
                Please enter the certificate ID manually below.
              </p>
            </div>
          ) : (
            <div className="w-full h-64 bg-secondary-100 rounded-lg flex flex-col items-center justify-center mb-4">
              <Scan className="h-12 w-12 text-secondary-400 mb-2" />
              <p className="text-center text-secondary-500">
                Camera not available.
                <br />
                Please enter the certificate ID manually.
              </p>
            </div>
          )}
          
          <div className="w-full mt-4">
            <label htmlFor="certificate-id" className="block text-sm font-medium text-secondary-700">
              Certificate ID
            </label>
            <input
              type="text"
              id="certificate-id"
              className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter certificate ID"
              value={manualCertificateId}
              onChange={(e) => setManualCertificateId(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleScan}>
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
