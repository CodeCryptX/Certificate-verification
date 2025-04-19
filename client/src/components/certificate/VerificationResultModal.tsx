import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Certificate } from '@shared/schema';
import { formatDate, formatHash } from '@/utils/certificate-utils';

interface VerificationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  result: Certificate | null;
  status: 'valid' | 'invalid' | 'revoked' | 'loading' | null;
}

export default function VerificationResultModal({ 
  isOpen, 
  onClose, 
  onViewDetails, 
  result, 
  status 
}: VerificationResultModalProps) {
  if (!result) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'revoked':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'valid':
        return 'Certificate Verified';
      case 'invalid':
        return 'Invalid Certificate';
      case 'revoked':
        return 'Certificate Revoked';
      default:
        return 'Verification Result';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'valid':
        return 'This certificate has been validated. The blockchain hash matches our records and confirms this is an authentic certificate.';
      case 'invalid':
        return 'This certificate could not be verified. The blockchain hash does not match our records or the certificate does not exist.';
      case 'revoked':
        return `This certificate has been revoked by the issuing institution on ${formatDate(result.revocationDate)}. Reason: ${result.revocationReason}`;
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'valid':
        return 'bg-green-100';
      case 'invalid':
        return 'bg-red-100';
      case 'revoked':
        return 'bg-yellow-100';
      default:
        return 'bg-primary-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <DialogTitle className="text-center">{getStatusTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {getStatusDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-5 bg-secondary-50 p-4 rounded-md">
          <div className="flex flex-col space-y-3">
            <div>
              <span className="text-xs text-secondary-500">Student Name</span>
              <p className="text-sm font-medium text-secondary-900">{result.studentName}</p>
            </div>
            <div>
              <span className="text-xs text-secondary-500">Certificate</span>
              <p className="text-sm font-medium text-secondary-900">{result.degreeName}</p>
            </div>
            <div>
              <span className="text-xs text-secondary-500">Issuing Institution</span>
              <p className="text-sm font-medium text-secondary-900">{result.universityName}</p>
            </div>
            <div>
              <span className="text-xs text-secondary-500">Issue Date</span>
              <p className="text-sm font-medium text-secondary-900">{formatDate(result.issueDate)}</p>
            </div>
            <div>
              <span className="text-xs text-secondary-500">Blockchain Hash</span>
              <p className="text-sm font-mono text-secondary-900 truncate">{result.certificateHash}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:grid sm:grid-cols-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mt-3 sm:mt-0 sm:col-start-1"
          >
            Close
          </Button>
          <Button 
            onClick={onViewDetails}
            className="sm:col-start-2"
            disabled={status === 'invalid'}
          >
            View Full Certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
