import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Certificate } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CertificateCard from '@/components/certificate/CertificateCard';
import CertificateDetails from '@/components/certificate/CertificateDetails';
import IssueCertificateModal from '@/components/certificate/IssueCertificateModal';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function CertificatesPage() {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const { user } = useAuth();

  // Fetch certificates based on user role
  const { data: certificates = [], isLoading, error } = useQuery<Certificate[]>({
    queryKey: ['/api/certificates'],
  });

  // Handle certificate selection
  const handleCertificateSelect = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
  };

  // Render content based on certificates data
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
          <p>Error loading certificates: {error.message}</p>
        </div>
      );
    }

    if (selectedCertificate) {
      return (
        <CertificateDetails 
          certificate={selectedCertificate} 
          onClose={() => setSelectedCertificate(null)} 
        />
      );
    }

    if (certificates.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-secondary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No Certificates Found</h3>
          <p className="text-secondary-500 mb-6">
            {user?.role === 'university' 
              ? "You haven't issued any certificates yet." 
              : "You don't have any certificates yet."}
          </p>
          {user?.role === 'university' && (
            <Button onClick={() => setIsIssueModalOpen(true)}>
              Issue Your First Certificate
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <div 
            key={certificate.id} 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 bg-white rounded-lg shadow overflow-hidden"
            onClick={() => handleCertificateSelect(certificate)}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-secondary-900">{certificate.degreeName}</h3>
                  {certificate.degreeField && (
                    <p className="text-sm text-secondary-500">{certificate.degreeField}</p>
                  )}
                </div>
              </div>
              <div className="mt-2">
                {user?.role === 'university' ? (
                  <p className="text-sm text-secondary-700">Issued to: {certificate.studentName}</p>
                ) : (
                  <p className="text-sm text-secondary-700">Issued by: {certificate.universityName}</p>
                )}
                <p className="text-sm text-secondary-500 mt-1">
                  Issue Date: {new Date(certificate.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  certificate.status === 'active' ? 'bg-green-100 text-green-800' :
                  certificate.status === 'revoked' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                </span>
                <button 
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCertificateSelect(certificate);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
                  {user?.role === 'university' ? 'Issued Certificates' : 'My Certificates'}
                </h2>
                <p className="mt-1 text-secondary-500">
                  {user?.role === 'university' 
                    ? 'Manage and view certificates issued by your institution' 
                    : 'View and manage your educational certificates'}
                </p>
              </div>
              {user?.role === 'university' && (
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button onClick={() => setIsIssueModalOpen(true)}>
                    Issue New Certificate
                  </Button>
                </div>
              )}
            </div>

            {renderContent()}
          </div>
        </div>
      </main>
      <Footer />

      {/* Issue Certificate Modal */}
      <IssueCertificateModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />
    </div>
  );
}
