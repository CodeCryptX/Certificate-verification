import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Certificate, Verification } from "@shared/schema";
import CertificateCard from "@/components/certificate/CertificateCard";
import CertificateDetails from "@/components/certificate/CertificateDetails";
import { formatDate } from "@/utils/certificate-utils";
import { Loader2 } from "lucide-react";

export default function StudentDashboard() {
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);

  // Fetch certificates for the student
  const {
    data: certificates = [],
    isLoading,
    error,
  } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Get all verification history across certificates
  const { data: allVerifications = [] } = useQuery<Verification[]>({
    queryKey: ["/api/verifications"],
    enabled: certificates.length > 0,
  });

  // Map verifications to certificates and flatten the array
  const verificationHistory = certificates.flatMap((cert) =>
    allVerifications
      .filter((v) => v.certificateId === cert.id)
      .map((v) => ({ ...v, certificate: cert }))
  );

  // Sort verification history by date (newest first)
  const sortedVerificationHistory = [...verificationHistory].sort(
    (a, b) =>
      new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
  );

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

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-secondary-900 sm:text-3xl sm:truncate">
            Student Dashboard
          </h2>
          <p className="mt-1 text-secondary-500">
            View and verify your certificates
          </p>
        </div>
      </div>

      {/* Student Certificate List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-secondary-200">
          {certificates.length > 0 ? (
            certificates.map((certificate) => (
              <li
                key={certificate.id}
                onClick={() => setSelectedCertificate(certificate)}
                className="cursor-pointer"
              >
                <CertificateCard certificate={certificate} />
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center">
              <p className="text-secondary-500">
                No certificates found. Certificates issued to you will appear
                here.
              </p>
            </li>
          )}
        </ul>
      </div>

      {/* Verification History */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-secondary-900">
          Verification History
        </h3>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-secondary-200">
            {sortedVerificationHistory.length > 0 ? (
              sortedVerificationHistory.map((verification, index) => (
                <li key={index}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-primary-700">
                          {verification.certificate.degreeName}
                        </div>
                        <div className="text-sm text-secondary-500">
                          Verified by: {verification.verifiedBy}
                        </div>
                      </div>
                      <div className="text-sm text-secondary-500">
                        {formatDate(verification.verifiedAt)}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-8 text-center">
                <p className="text-secondary-500">
                  No verification history yet. When employers verify your
                  certificates, it will be recorded here.
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
