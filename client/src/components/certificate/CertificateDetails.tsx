import { useState } from 'react';
import { Certificate, Verification } from '@shared/schema';
import { formatDate, getStatusBadgeClass, formatHash, downloadCertificateAsJSON, createShareLink, copyToClipboard } from '@/utils/certificate-utils';
import { getQRCodeUrl } from '@/utils/qr-utils';
import { Shield, X, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

type CertificateDetailsProps = {
  certificate: Certificate;
  onClose: () => void;
};

export default function CertificateDetails({ certificate, onClose }: CertificateDetailsProps) {
  const { toast } = useToast();
  
  // Fetch verification history
  const { data: verifications = [] } = useQuery<Verification[]>({
    queryKey: [`/api/certificates/${certificate.id}/verifications`],
    enabled: !!certificate.id,
  });

  const handleDownload = () => {
    downloadCertificateAsJSON(certificate);
    toast({
      title: 'Download started',
      description: 'Your certificate is being downloaded.',
    });
  };

  const handleShare = async () => {
    const shareLink = createShareLink(certificate.certificateId);
    
    try {
      await copyToClipboard(shareLink);
      toast({
        title: 'Link copied!',
        description: 'Verification link has been copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy the link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-secondary-900">
            Certificate Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            Secured by blockchain technology
          </p>
        </div>
        <button 
          type="button" 
          className="text-secondary-500 hover:text-secondary-600" 
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="border-t border-secondary-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-2xl p-8 border border-secondary-200 rounded-lg bg-secondary-50">
              <div className="text-center">
                <div className="inline-block p-2 bg-primary-100 rounded-full mb-4">
                  <Shield className="h-10 w-10 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-1">{certificate.universityName}</h2>
                <p className="text-secondary-500 mb-8">Certificate of Completion</p>
                
                <div className="text-center my-8">
                  <p className="text-secondary-600 text-lg mb-1">This is to certify that</p>
                  <h3 className="text-3xl font-bold text-secondary-900 mb-1">{certificate.studentName}</h3>
                  <p className="text-secondary-600 text-lg mb-8">has successfully completed all requirements for the</p>
                  <h4 className="text-2xl font-bold text-primary-700 mb-2">{certificate.degreeName}</h4>
                  <p className="text-secondary-600">{formatDate(certificate.issueDate)}</p>
                </div>
                
                <div className="flex justify-center mt-8 mb-6">
                  <img 
                    src={getQRCodeUrl(certificate.certificateId)}
                    alt="QR Code for certificate verification" 
                    className="h-32 w-32" 
                  />
                </div>
                
                <div className="text-sm text-secondary-500 mt-4">
                  <p>Certificate ID: <span className="font-mono">{certificate.certificateId}</span></p>
                  <p className="mt-1">Blockchain Hash: <span className="font-mono text-xs">{certificate.certificateHash}</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-secondary-200 pt-5">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-secondary-500">Student Name</dt>
                <dd className="mt-1 text-sm text-secondary-900">{certificate.studentName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary-500">Student Email</dt>
                <dd className="mt-1 text-sm text-secondary-900">{certificate.studentEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary-500">University</dt>
                <dd className="mt-1 text-sm text-secondary-900">{certificate.universityName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary-500">Degree</dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {certificate.degreeName}
                  {certificate.degreeField && ` - ${certificate.degreeField}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary-500">Issue Date</dt>
                <dd className="mt-1 text-sm text-secondary-900">{formatDate(certificate.issueDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary-500">Status</dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(certificate.status)}`}>
                    {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                  </span>
                </dd>
              </div>
            </div>
          </div>
          
          {verifications && verifications.length > 0 && (
            <div className="mt-8 border-t border-secondary-200 pt-5">
              <h4 className="text-md font-medium text-secondary-900 mb-4">Verification History</h4>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-secondary-300">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-secondary-900 sm:pl-6">Verified By</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900">Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 bg-white">
                    {verifications.map((verification) => (
                      <tr key={verification.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-secondary-900">{verification.verifiedBy}</div>
                          {verification.verifiedByEmail && <div className="text-secondary-500">{verification.verifiedByEmail}</div>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-500">
                          {formatDate(verification.verifiedAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {verification.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-between">
            <div>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center"
              >
                <Download className="-ml-1 mr-2 h-5 w-5 text-secondary-500" />
                Download Certificate
              </Button>
            </div>
            <div>
              <Button onClick={handleShare} className="flex items-center">
                <Share2 className="-ml-1 mr-2 h-5 w-5" />
                Share Verification Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
