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
  <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 animate-fade-in">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-25" />
      <LoadingSpinner size={32} className="text-primary-600 relative" />
    </div>
    <p className="text-surface-500 text-sm">{message}</p>
  </div>
);
