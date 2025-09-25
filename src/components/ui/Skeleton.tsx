/**
 * Skeleton Loading Components
 * Beautiful loading states that match the actual content structure
 */

'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true
}: SkeletonProps) {
  const { isDark } = useTheme();
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      } ${rounded ? 'rounded-full' : 'rounded'} ${
        animate ? 'animate-pulse' : ''
      } ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton width={40} height={40} rounded />
            <div className="space-y-2">
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={12} />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton width={80} height={16} />
            <Skeleton width={60} height={12} />
          </div>
        </div>
        
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Skeleton width={32} height={32} rounded />
                <div className="space-y-1">
                  <Skeleton width={100 + Math.random() * 80} height={14} />
                  <Skeleton width={60 + Math.random() * 40} height={10} />
                </div>
              </div>
              <Skeleton width={60} height={14} />
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton width={80} height={12} />
              <Skeleton width={24} height={24} rounded />
            </div>
            <Skeleton width={120} height={24} />
            <div className="flex items-center space-x-2">
              <Skeleton width={16} height={16} />
              <Skeleton width={60} height={12} />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width={150} height={20} />
          <div className="flex space-x-2">
            <Skeleton width={60} height={32} />
            <Skeleton width={60} height={32} />
          </div>
        </div>
        <Skeleton width="100%" height={height} />
        <div className="flex justify-center space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton width={12} height={12} rounded />
              <Skeleton width={40} height={12} />
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

export function SparklineCardSkeleton() {
  return (
    <SkeletonCard className="h-32">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width={80} height={14} />
          <div className="flex items-center space-x-1">
            <Skeleton width={12} height={12} />
            <Skeleton width={30} height={12} />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton width={100} height={20} />
            <Skeleton width={60} height={14} />
          </div>
          <Skeleton width={80} height={40} />
        </div>
      </div>
    </SkeletonCard>
  );
}

export function GoalCardSkeleton() {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width={120} height={18} />
          <Skeleton width={24} height={24} rounded />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={14} />
          </div>
          <Skeleton width="100%" height={8} />
        </div>
        <div className="flex justify-between text-sm">
          <Skeleton width={90} height={12} />
          <Skeleton width={70} height={12} />
        </div>
      </div>
    </SkeletonCard>
  );
}

export function BillCardSkeleton() {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton width={40} height={40} rounded />
            <div className="space-y-2">
              <Skeleton width={100} height={16} />
              <Skeleton width={70} height={12} />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton width={70} height={16} />
            <Skeleton width={50} height={12} />
          </div>
        </div>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <Skeleton width={60} height={12} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} width={60 + Math.random() * 40} height={14} />
          ))}
        </div>
        
        {/* Table rows */}
        <div className="space-y-3">
          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-4 items-center">
              {[...Array(cols)].map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  width={colIndex === 0 ? 120 : 60 + Math.random() * 60} 
                  height={14} 
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      {/* User section */}
      <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Skeleton width={40} height={40} rounded />
          <div className="space-y-2">
            <Skeleton width={100} height={14} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <SkeletonCard className="p-3">
          <div className="space-y-2">
            <Skeleton width={60} height={10} />
            <Skeleton width={80} height={16} />
          </div>
        </SkeletonCard>
      </div>
      
      {/* Navigation */}
      <div className="py-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 py-2">
            <Skeleton width={20} height={20} />
            <Skeleton width={70 + Math.random() * 30} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface SkeletonWrapperProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SkeletonWrapper({ loading, skeleton, children, className = '' }: SkeletonWrapperProps) {
  return (
    <div className={className}>
      {loading ? skeleton : children}
    </div>
  );
}

// Shimmer effect for more advanced skeletons
export function ShimmerSkeleton({ 
  className = '', 
  width = '100%', 
  height = '1rem' 
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  const { isDark } = useTheme();
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`relative overflow-hidden rounded ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      } ${className}`}
      style={style}
    >
      <div
        className={`absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r ${
          isDark 
            ? 'from-gray-700 via-gray-600 to-gray-700' 
            : 'from-gray-200 via-gray-100 to-gray-200'
        }`}
      />
    </div>
  );
}