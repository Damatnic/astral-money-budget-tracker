/**
 * Animated Counter Component
 * Smooth numerical animations for financial data
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { formatCurrency } from '@/utils/formatters';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  onComplete?: () => void;
}

export function AnimatedCounter({
  value,
  duration = 2000,
  decimals = 0,
  isCurrency = false,
  prefix = '',
  suffix = '',
  className = '',
  onComplete
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef(0);

  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
        startValueRef.current = displayValue;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      const currentValue = startValueRef.current + (value - startValueRef.current) * easedProgress;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setDisplayValue(value);
        onComplete?.();
      }
    };

    if (Math.abs(value - displayValue) > 0.01) {
      setIsAnimating(true);
      startTimeRef.current = undefined;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, onComplete]);

  const formatValue = (val: number) => {
    if (isCurrency) {
      return formatCurrency(val);
    }
    return val.toFixed(decimals);
  };

  return (
    <span 
      className={`${className} ${isAnimating ? 'animate-pulse' : ''} transition-colors duration-300`}
      title={`${prefix}${formatValue(value)}${suffix}`}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}

interface AnimatedPercentageProps {
  value: number;
  previousValue?: number;
  showChange?: boolean;
  className?: string;
  positiveColor?: string;
  negativeColor?: string;
  duration?: number;
}

export function AnimatedPercentage({
  value,
  previousValue,
  showChange = true,
  className = '',
  positiveColor = 'text-green-600',
  negativeColor = 'text-red-600',
  duration = 1500
}: AnimatedPercentageProps) {
  const change = previousValue !== undefined ? value - previousValue : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <AnimatedCounter
        value={value}
        duration={duration}
        decimals={1}
        suffix="%"
        className="font-semibold"
      />
      {showChange && previousValue !== undefined && change !== 0 && (
        <div className={`flex items-center text-sm ${
          isPositive ? positiveColor : isNegative ? negativeColor : 'text-gray-500'
        }`}>
          <svg
            className={`w-3 h-3 mr-1 transition-transform duration-300 ${
              isPositive ? 'rotate-0' : 'rotate-180'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <AnimatedCounter
            value={Math.abs(change)}
            duration={duration}
            decimals={1}
            suffix="%"
          />
        </div>
      )}
    </div>
  );
}

interface QuickStatsCardProps {
  title: string;
  value: number;
  previousValue?: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function QuickStatsCard({
  title,
  value,
  previousValue,
  isCurrency = false,
  prefix = '',
  suffix = '',
  icon,
  trend,
  className = ''
}: QuickStatsCardProps) {
  const change = previousValue !== undefined ? value - previousValue : 0;
  const changePercent = previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg className="w-4 h-4 rotate-180" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <AnimatedCounter
            value={value}
            isCurrency={isCurrency}
            prefix={prefix}
            suffix={suffix}
            className="text-2xl font-bold text-gray-900 dark:text-white"
            duration={2500}
          />
        </div>

        {previousValue !== undefined && changePercent !== 0 && (
          <div className={`flex items-center space-x-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              <AnimatedCounter
                value={Math.abs(changePercent)}
                decimals={1}
                suffix="%"
                duration={2000}
              />
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              vs last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface AnimatedProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: string;
  className?: string;
  duration?: number;
}

export function AnimatedProgressBar({
  value,
  max,
  label,
  showPercentage = true,
  color = 'bg-blue-500',
  backgroundColor = 'bg-gray-200 dark:bg-gray-700',
  height = 'h-3',
  className = '',
  duration = 2000
}: AnimatedProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {showPercentage && (
            <AnimatedPercentage
              value={percentage}
              showChange={false}
              className="text-sm text-gray-600 dark:text-gray-400"
              duration={duration}
            />
          )}
        </div>
      )}
      <div className={`relative ${backgroundColor} rounded-full ${height} overflow-hidden`}>
        <div
          className={`absolute top-0 left-0 ${height} ${color} rounded-full transition-all duration-[${duration}ms] ease-out`}
          style={{
            width: `${Math.min((animatedValue / max) * 100, 100)}%`,
            transitionDuration: `${duration}ms`
          }}
        />
      </div>
    </div>
  );
}