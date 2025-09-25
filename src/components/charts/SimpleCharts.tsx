/**
 * Simple Chart Components
 * Lightweight chart components without external dependencies
 */

'use client';

import { formatCurrency } from '@/utils/formatters';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// Pie Chart Component
interface PieChartProps {
  data: ChartData[];
  size?: number;
  showLabels?: boolean;
}

export function PieChart({ data, size = 200, showLabels = true }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let currentAngle = 0;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) - 10;

  const createPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY, 
      "L", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, 
      "z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="flex items-center space-x-6">
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (item.value / total) * 360;
          const path = createPath(currentAngle, currentAngle + angle);
          currentAngle += angle;
          
          const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;
          
          return (
            <path
              key={item.label}
              d={path}
              fill={color}
              stroke="white"
              strokeWidth="2"
              className="transition-opacity hover:opacity-80"
            />
          );
        })}
      </svg>
      
      {showLabels && (
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;
            
            return (
              <div key={item.label} className="flex items-center space-x-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-700">{item.label}</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
                <span className="text-gray-500">({percentage}%)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: ChartData[];
  height?: number;
  showValues?: boolean;
}

export function BarChart({ data, height = 300, showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));
  if (maxValue === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-end space-x-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;
          
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-md transition-all hover:opacity-80 relative group"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: color,
                  minHeight: '4px'
                }}
              >
                {showValues && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(item.value)}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Line Chart Component (Simple trend line)
interface LineChartProps {
  data: { date: string; value: number }[];
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 200, color = '#3B82F6' }: LineChartProps) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const range = maxValue - minValue || 1;

  const width = 400;
  const padding = 20;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((item.value - minValue) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      <svg width={width} height={height} className="border border-gray-200 rounded-lg">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          className="drop-shadow-sm"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((item.value - minValue) / range) * (height - 2 * padding);
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>{item.date}: {formatCurrency(item.value)}</title>
            </circle>
          );
        })}
        
        {/* Y-axis labels */}
        <text x={5} y={padding} className="text-xs fill-gray-500">
          {formatCurrency(maxValue)}
        </text>
        <text x={5} y={height - padding + 5} className="text-xs fill-gray-500">
          {formatCurrency(minValue)}
        </text>
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 px-5">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// Progress Ring Component
interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3B82F6',
  label 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {percentage}%
          </div>
          {label && (
            <div className="text-xs text-gray-500 mt-1">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini Sparkline Component
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 100, height = 30, color = '#3B82F6' }: SparklineProps) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}