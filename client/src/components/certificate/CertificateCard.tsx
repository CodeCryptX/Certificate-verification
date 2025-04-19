import { Certificate } from '@shared/schema';
import { formatDate, getStatusBadgeClass } from '@/utils/certificate-utils';
import { Shield } from 'lucide-react';
import { Link } from 'wouter';

type CertificateCardProps = {
  certificate: Certificate;
};

export default function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <li className="hover:bg-secondary-50">
      <Link href={`/certificates/${certificate.id}`} className="block">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-primary-700">
                  {certificate.degreeName}
                </div>
                <div className="text-sm text-secondary-500">
                  Issued on: {formatDate(certificate.issueDate)}
                </div>
              </div>
            </div>
            <div className="ml-2 flex-shrink-0 flex">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(certificate.status)}`}>
                {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
