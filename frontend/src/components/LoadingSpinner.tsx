import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner = ({ size = 24, className = '' }: LoadingSpinnerProps) => (
  <Loader2 className={`animate-spin ${className}`} size={size} />
);

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader = ({ message = 'Loading...' }: FullPageLoaderProps) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
    <LoadingSpinner size={32} className="text-blue-600" />
    <p className="text-gray-500">{message}</p>
  </div>
);