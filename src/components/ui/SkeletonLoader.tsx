'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Advanced skeleton loader component with multiple variants and animations
 */
export function Skeleton({ 
  className = '', 
  width, 
  height, 
  variant = 'text',
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg',
    circular: 'rounded-full'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };
  
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
}

/**
 * Dashboard skeleton loader
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={32} variant="text" />
        <Skeleton width={120} height={40} variant="rounded" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width={24} height={24} variant="circular" />
              <Skeleton width={60} height={20} variant="text" />
            </div>
            <Skeleton width={80} height={28} variant="text" className="mb-2" />
            <Skeleton width={120} height={16} variant="text" />
          </div>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <Skeleton width={150} height={24} variant="text" className="mb-4" />
          <Skeleton width="100%" height={300} variant="rounded" />
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <Skeleton width={180} height={24} variant="text" className="mb-4" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton width={40} height={40} variant="circular" />
                  <div>
                    <Skeleton width={120} height={16} variant="text" className="mb-1" />
                    <Skeleton width={80} height={14} variant="text" />
                  </div>
                </div>
                <Skeleton width={60} height={16} variant="text" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Transaction list skeleton loader
 */
export function TransactionListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton width={40} height={40} variant="circular" />
              <div>
                <Skeleton width={150} height={16} variant="text" className="mb-2" />
                <Skeleton width={100} height={14} variant="text" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton width={80} height={16} variant="text" className="mb-1" />
              <Skeleton width={60} height={14} variant="text" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Chart skeleton loader
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width={180} height={24} variant="text" />
        <div className="flex space-x-2">
          <Skeleton width={60} height={32} variant="rounded" />
          <Skeleton width={60} height={32} variant="rounded" />
          <Skeleton width={60} height={32} variant="rounded" />
        </div>
      </div>
      <Skeleton width="100%" height={height} variant="rounded" />
      <div className="flex justify-center space-x-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton width={12} height={12} variant="circular" />
            <Skeleton width={80} height={14} variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Form skeleton loader
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton width={200} height={28} variant="text" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Skeleton width={100} height={16} variant="text" className="mb-2" />
          <Skeleton width="100%" height={40} variant="rounded" />
        </div>
        <div>
          <Skeleton width={80} height={16} variant="text" className="mb-2" />
          <Skeleton width="100%" height={40} variant="rounded" />
        </div>
      </div>
      
      <div>
        <Skeleton width={120} height={16} variant="text" className="mb-2" />
        <Skeleton width="100%" height={100} variant="rounded" />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Skeleton width={80} height={40} variant="rounded" />
        <Skeleton width={100} height={40} variant="rounded" />
      </div>
    </div>
  );
}

/**
 * Loading spinner with professional styling
 */
export function LoadingSpinner({ 
  size = 'medium', 
  color = 'primary',
  className = '' 
}: { 
  size?: 'small' | 'medium' | 'large' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const colorClasses = {
    primary: 'border-blue-600',
    secondary: 'border-slate-600',
    white: 'border-white'
  };
  
  return (
    <div
      className={`
        ${sizeClasses[size]} 
        animate-spin 
        rounded-full 
        border-2 
        border-gray-300 
        border-t-transparent
        ${colorClasses[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({ message = 'Loading...', transparent = false }) {
  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      ${transparent ? 'bg-white/80' : 'bg-white'}
      backdrop-blur-sm transition-all duration-300
    `}>
      <div className="text-center">
        <LoadingSpinner size="large" className="mx-auto mb-4" />
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

export default Skeleton;