import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Certificate } from '@shared/schema';
import { formatDate, getStatusBadgeClass } from '@/utils/certificate-utils';
import { Loader2, Search, PlusCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import IssueCertificateModal from '@/components/certificate/IssueCertificateModal';
import CertificateDetails from '@/components/certificate/CertificateDetails';

export default function UniversityDashboard() {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch certificates issued by the university
  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ['/api/certificates'],
  });

  // Revoke certificate mutation
  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiRequest('POST', `/api/certificates/${id}/revoke`, { revocationReason: reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      toast({
        title: 'Certificate Revoked',
        description: 'The certificate has been successfully revoked.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to revoke certificate: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Calculate stats for certificates
  const totalCertificates = certificates.length;
  const verificationThisMonth = 0; // This would be calculated from verifications data
  const revokedCertificates = certificates.filter(cert => cert.status === 'revoked').length;

  // Filter certificates based on search query
  const filteredCertificates = certificates.filter(cert => 
    cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.degreeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle certificate revocation
  const handleRevokeCertificate = (id: number) => {
    const reason = window.prompt('Please enter a reason for revoking this certificate:');
    if (reason) {
      revokeMutation.mutate({ id, reason });
    }
  };

  // Handle view certificate details
  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
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
            University Administration
          </h2>
          <p className="mt-1 text-secondary-500">
            Manage certificates and verification
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={() => setIsIssueModalOpen(true)} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Issue New Certificate
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Total Certificates Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <Scroll className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Total Certificates
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-secondary-900">
                      {totalCertificates}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Verifications Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Verifications (This Month)
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-secondary-900">
                      {verificationThisMonth}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Revoked Certificates Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Revoked Certificates
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-secondary-900">
                      {revokedCertificates}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Certificates */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-lg font-medium text-secondary-900">Recent Certificates</h3>
            <p className="mt-2 text-sm text-secondary-700">
              A list of all recently issued certificates including their recipient, status, and date.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <div className="relative max-w-xs">
              <Input
                type="text"
                name="search"
                id="search"
                placeholder="Search certificates"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <Search className="h-5 w-5 text-secondary-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-secondary-300">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-secondary-900 sm:pl-6">Student</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900">Certificate</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900">Date</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 bg-white">
                    {filteredCertificates.length > 0 ? (
                      filteredCertificates.map(certificate => (
                        <tr key={certificate.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                {certificate.studentName.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-secondary-900">{certificate.studentName}</div>
                                <div className="text-secondary-500">{certificate.studentEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-900">
                            <div className="text-secondary-900">{certificate.degreeName}</div>
                            {certificate.degreeField && (
                              <div className="text-secondary-500">{certificate.degreeField}</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(certificate.status)}`}>
                              {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-500">
                            {formatDate(certificate.issueDate)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleViewCertificate(certificate)}
                              className="text-primary-600 hover:text-primary-900 mr-4"
                            >
                              View
                            </button>
                            {certificate.status !== 'revoked' && (
                              <button
                                onClick={() => handleRevokeCertificate(certificate.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-secondary-500">
                          {searchQuery ? 'No certificates found matching your search.' : 'No certificates have been issued yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Certificate Modal */}
      <IssueCertificateModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />
    </div>
  );
}

// Mocked SVG component
function Scroll(props) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
