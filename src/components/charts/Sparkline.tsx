/**
 * Sparkline Charts Component
 * Mini trend visualizations for dashboard
 */

'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  showDots?: boolean;
  animate?: boolean;
  type?: 'line' | 'area' | 'bar';
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color,
  strokeWidth = 2,
  className = '',
  showDots = false,
  animate = true,
  type = 'line'
}: SparklineProps) {
  const { isDark } = useTheme();
  
  const defaultColor = color || (isDark ? '#3B82F6' : '#1E40AF');
  
  const { path, points, bars } = useMemo(() => {
    if (data.length === 0) return { path: '', points: [], bars: [] };

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;

    const stepX = width / (data.length - 1 || 1);
    const padding = 4;

    const points = data.map((value, index) => ({
      x: index * stepX,
      y: height - padding - ((value - minValue) / range) * (height - 2 * padding),
      value
    }));

    // Generate SVG path for line
    const path = points.reduce((acc, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point.x} ${point.y}`;
    }, '').trim();

    // Generate bars
    const barWidth = width / data.length * 0.8;
    const bars = points.map((point) => ({
      x: point.x - barWidth / 2,
      y: point.y,
      width: barWidth,
      height: height - padding - point.y,
      value: point.value
    }));

    return { path, points, bars };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className={`text-xs ${isDark ? 'text-gray-700' : 'text-gray-700'}`}>
          No data
        </div>
      </div>
    );
  }

  const isPositiveTrend = data.length > 1 && data[data.length - 1] > data[0];

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={defaultColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={defaultColor} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {type === 'area' && (
          <>
            {/* Area fill */}
            <path
              d={`${path} L ${width} ${height} L 0 ${height} Z`}
              fill={`url(#gradient-${Math.random()})`}
              className={animate ? 'animate-fade-in' : ''}
            />
            {/* Area line */}
            <path
              d={path}
              fill="none"
              stroke={defaultColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={animate ? 'animate-draw-line' : ''}
            />
          </>
        )}

        {type === 'line' && (
          <path
            d={path}
            fill="none"
            stroke={defaultColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animate ? 'animate-draw-line' : ''}
          />
        )}

        {type === 'bar' && (
          <g>
            {bars.map((bar, index) => (
              <rect
                key={index}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={defaultColor}
                opacity={0.7}
                rx={1}
                className={animate ? `animate-grow-bar` : ''}
                style={{
                  animationDelay: animate ? `${index * 50}ms` : undefined
                }}
              />
            ))}
          </g>
        )}

        {/* Data points */}
        {showDots && type !== 'bar' && (
          <g>
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={2}
                fill={defaultColor}
                className={animate ? 'animate-scale-in' : ''}
                style={{
                  animationDelay: animate ? `${index * 100 + 500}ms` : undefined
                }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

interface SparklineCardProps {
  title: string;
  data: number[];
  currentValue?: number;
  previousValue?: number;
  isCurrency?: boolean;
  type?: 'line' | 'area' | 'bar';
  color?: string;
  className?: string;
}

export function SparklineCard({
  title,
  data,
  currentValue,
  previousValue,
  isCurrency = false,
  type = 'area',
  color,
  className = ''
}: SparklineCardProps) {
  const { isDark } = useTheme();
  
  const trend = useMemo(() => {
    if (data.length < 2) return 'neutral';
    const lastValue = data[data.length - 1];
    const firstValue = data[0];
    return lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'neutral';
  }, [data]);

  const change = currentValue !== undefined && previousValue !== undefined 
    ? currentValue - previousValue 
    : 0;

  const changePercent = previousValue !== 0 && previousValue !== undefined
    ? (change / Math.abs(previousValue)) * 100 
    : 0;

  const trendColor = useMemo(() => {
    if (color) return color;
    if (trend === 'up') return isDark ? '#10B981' : '#059669';
    if (trend === 'down') return isDark ? '#EF4444' : '#DC2626';
    return isDark ? '#6B7280' : '#4B5563';
  }, [trend, isDark, color]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300">
          {title}
        </h3>
        <div className={`flex items-center space-x-1 text-xs ${
          trend === 'up' 
            ? 'text-green-600 dark:text-green-400' 
            : trend === 'down'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-700'
        }`}>
          {trend === 'up' && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {trend === 'down' && (
            <svg className="w-3 h-3 rotate-180" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {trend === 'neutral' && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>
            {Math.abs(changePercent) > 0.1 
              ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
              : '0%'
            }
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          {currentValue !== undefined && (
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {isCurrency ? formatCurrency(currentValue) : currentValue.toFixed(0)}
            </span>
          )}
          {change !== 0 && (
            <span className={`text-sm ${
              change > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {change > 0 ? '+' : ''}{isCurrency ? formatCurrency(change) : change.toFixed(0)}
            </span>
          )}
        </div>
        
        <Sparkline
          data={data}
          width={80}
          height={40}
          color={trendColor}
          type={type}
          animate={true}
          showDots={type === 'line'}
        />
      </div>
    </div>
  );
}

interface FinancialSparklineProps {
  transactions: Transaction[];
  period?: 'week' | 'month' | 'quarter';
  type?: 'income' | 'expense' | 'balance';
}

export function FinancialSparkline({
  transactions,
  period = 'month',
  type = 'balance'
}: FinancialSparklineProps) {
  const data = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let intervals: number;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        intervals = 7;
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        intervals = 12;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        intervals = 10;
    }

    const intervalMs = (now.getTime() - startDate.getTime()) / intervals;
    const values: number[] = [];

    for (let i = 0; i < intervals; i++) {
      const intervalStart = new Date(startDate.getTime() + i * intervalMs);
      const intervalEnd = new Date(startDate.getTime() + (i + 1) * intervalMs);

      const intervalTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= intervalStart && date < intervalEnd;
      });

      let value = 0;
      if (type === 'income') {
        value = intervalTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      } else if (type === 'expense') {
        value = intervalTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      } else {
        // Balance calculation
        value = intervalTransactions.reduce((sum, t) => {
          return sum + (t.type === 'income' ? t.amount : -t.amount);
        }, i === 0 ? 0 : values[i - 1] || 0);
      }

      values.push(value);
    }

    return values;
  }, [transactions, period, type]);

  const currentValue = data[data.length - 1] || 0;
  const previousValue = data[data.length - 2] || 0;

  return (
    <SparklineCard
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Trend`}
      data={data}
      currentValue={currentValue}
      previousValue={previousValue}
      isCurrency={true}
      type="area"
      color={
        type === 'income' 
          ? '#10B981' 
          : type === 'expense' 
            ? '#EF4444' 
            : '#3B82F6'
      }
    />
  );
}