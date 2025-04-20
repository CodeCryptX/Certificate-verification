import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Scan, Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (certificateId: string) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScan,
}: QRScannerModalProps) {
  const { toast } = useToast();
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualCertificateId, setManualCertificateId] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  // Initialize and clean up scanner
  useEffect(() => {
    if (isOpen) {
      // Check if camera is available
      const checkCamera = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );
          setScannerAvailable(videoDevices.length > 0);
        } catch (error) {
          console.error("Error checking camera:", error);
          setScannerAvailable(false);
        }
      };

      checkCamera();
    } else {
      // Stop scanning when modal is closed
      stopScanner();
    }

    // Cleanup function
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      setScanning(true);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        title: "Scanner Error",
        description:
          "Could not start the QR scanner. Please try again or use manual entry.",
        variant: "destructive",
      });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scanning) {
      try {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
        setScanning(false);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    setQrResult(decodedText);
    stopScanner();

    // Process the scanned certificate ID
    if (decodedText) {
      // Extract certificate ID if the QR contains additional data
      // Assuming the QR code contains just the certificate ID or a URL with the ID
      const certificateId = extractCertificateId(decodedText);

      onScan(certificateId);
      onClose();

      toast({
        title: "Certificate Scanned",
        description: "Certificate ID detected. Verifying...",
      });
    }
  };

  const onScanFailure = (error: any) => {
    // This function will be called frequently while scanning is in progress
    // Only log errors that might be important
    if (error?.name !== "NotFoundException") {
      console.error("QR Scan error:", error);
    }
  };

  // Extract certificate ID from QR code text (URL or plain text)
  const extractCertificateId = (text: string): string => {
    // If text is a URL, try to extract certificate ID from it
    if (text.startsWith("http")) {
      try {
        const url = new URL(text);
        // Check for certificate ID in paths like /verify/CERT-1234...
        const pathParts = url.pathname.split("/");
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart.startsWith("CERT-")) {
            return lastPart;
          }
        }

        // Check if certificate ID is in URL parameters
        const certParam =
          url.searchParams.get("id") || url.searchParams.get("certificateId");
        if (certParam) {
          return certParam;
        }
      } catch (e) {
        console.error("Error parsing URL from QR code:", e);
      }
    }

    // If text itself looks like a certificate ID, use it directly
    if (text.startsWith("CERT-")) {
      return text;
    }

    // If all else fails, just return the text as is
    return text;
  };

  const handleManualScan = () => {
    if (manualCertificateId) {
      onScan(manualCertificateId);
      setManualCertificateId("");
      onClose();
    } else {
      toast({
        title: "No Certificate ID",
        description: "Please enter a certificate ID to verify.",
        variant: "destructive",
      });
    }
  };

  const toggleScanner = () => {
    if (scanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
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
            <div className="w-full">
              <div
                id={scannerContainerId}
                className="w-full h-64 bg-secondary-100 rounded-lg mb-4"
              >
                {!scanning && (
                  <div className="h-full flex items-center justify-center">
                    <Button
                      onClick={startScanner}
                      className="flex items-center"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Start Scanner
                    </Button>
                  </div>
                )}
              </div>

              {scanning && (
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    onClick={stopScanner}
                    className="flex items-center"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Stop Scanner
                  </Button>
                </div>
              )}
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
            <label
              htmlFor="certificate-id"
              className="block text-sm font-medium text-secondary-700"
            >
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
          <Button onClick={handleManualScan}>Verify</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
