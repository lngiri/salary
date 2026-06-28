import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Page Not Found</h1>
        <p className="text-surface-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button>
              <Home size={16} />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
