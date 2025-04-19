import { useAuth } from '@/hooks/use-auth';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import UniversityDashboard from '@/components/dashboard/UniversityDashboard';
import EmployerDashboard from '@/components/dashboard/EmployerDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HomePage() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'university':
        return <UniversityDashboard />;
      case 'employer':
        return <EmployerDashboard />;
      case 'admin':
        return <UniversityDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {renderDashboard()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
