/**
 * Enhanced Loading Spinner Component
 * Beautiful, responsive loading indicators with different variants
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'dots' | 'pulse';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  if (variant === 'gradient') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="relative w-full h-full">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-spin">
            <div className="absolute inset-1 rounded-full bg-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'} bg-blue-600 rounded-full animate-bounce`}></div>
        <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'} bg-indigo-600 rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
        <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'} bg-purple-600 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-full h-full"></div>
    </div>
  );
}

export function LoadingCard({ children, className = '' }: { children?: React.ReactNode, className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      <div className="relative z-10 p-6">
        {children || (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}