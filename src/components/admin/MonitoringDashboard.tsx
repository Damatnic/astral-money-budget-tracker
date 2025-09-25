/**
 * Production Monitoring Dashboard
 * Real-time system monitoring and alerting interface
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Server,
  Database,
  Zap,
  Clock,
  Users,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: {
    database: ComponentHealth;
    api: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
    external: ComponentHealth;
  };
  metrics: SystemMetrics;
  alerts: HealthAlert[];
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: any;
  lastCheck: string;
  uptime?: number;
}

interface SystemMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage?: number;
  activeConnections: number;
}

interface HealthAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  timestamp: string;
  details?: any;
}

interface PerformanceData {
  overview: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequestRate: number;
    requestsPerMinute: number;
  };
  routes: RoutePerformance[];
  slowestRequests: any[];
  recentErrors: any[];
  memoryTrend: { timestamp: number; heapUsed: number }[];
}

interface RoutePerformance {
  route: string;
  method: string;
  averageResponseTime: number;
  requestCount: number;
  errorCount: number;
  slowRequestCount: number;
  lastAccessed: Date;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health?detailed=true');
      if (!response.ok) throw new Error('Failed to fetch health data');
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError('Failed to load health data');
      console.error('Health data fetch error:', err);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/performance?type=overview');
      if (!response.ok) throw new Error('Failed to fetch performance data');
      const data = await response.json();
      setPerformanceData(data.data);
    } catch (err) {
      setError('Failed to load performance data');
      console.error('Performance data fetch error:', err);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/performance?type=realtime');
      if (!response.ok) throw new Error('Failed to fetch realtime data');
      const data = await response.json();
      setRealtimeData(data.data);
    } catch (err) {
      console.error('Realtime data fetch error:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchHealthData(),
        fetchPerformanceData(),
        fetchRealtimeData()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatUptime = (uptimeMs: number) => {
    const seconds = Math.floor(uptimeMs / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mx-4 my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchAllData} className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>{autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}</span>
          </Button>
          <Button onClick={fetchAllData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(healthData.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.status)}`}>
                      {healthData.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Server className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold">{formatUptime(healthData.uptime)}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-bold">{healthData.metrics.memoryUsage.percentage}%</p>
                  <p className="text-xs text-gray-500">
                    {healthData.metrics.memoryUsage.used}MB / {healthData.metrics.memoryUsage.total}MB
                  </p>
                </div>
                <Database className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Requests/Min</p>
                  <p className="text-2xl font-bold">{healthData.metrics.requestsPerMinute}</p>
                  <p className="text-xs text-gray-500">
                    {healthData.metrics.errorRate}% error rate
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {performanceData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.overview.totalRequests.toLocaleString()}</div>
                  <p className="text-xs text-gray-600">Last hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.overview.averageResponseTime}ms</div>
                  <p className="text-xs text-gray-600">
                    {performanceData.overview.slowRequestRate}% slow requests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.overview.errorRate}%</div>
                  <p className="text-xs text-gray-600">HTTP 4xx/5xx responses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Requests/Min</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.overview.requestsPerMinute}</div>
                  <p className="text-xs text-gray-600">Current rate</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Routes Performance */}
          {performanceData && performanceData.routes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top API Routes</CardTitle>
                <CardDescription>Most frequently accessed routes and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceData.routes.slice(0, 10).map((route, index) => (
                    <div key={`${route.method}-${route.route}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={route.method === 'GET' ? 'default' : route.method === 'POST' ? 'destructive' : 'secondary'}>
                          {route.method}
                        </Badge>
                        <span className="font-mono text-sm">{route.route}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{route.requestCount} requests</span>
                        <span>{route.averageResponseTime}ms avg</span>
                        <span className={route.errorCount > 0 ? 'text-red-600' : 'text-green-600'}>
                          {route.errorCount} errors
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {realtimeData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Heap Used:</span>
                      <span>{formatBytes(realtimeData.memory.heapUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heap Total:</span>
                      <span>{formatBytes(realtimeData.memory.heapTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RSS:</span>
                      <span>{formatBytes(realtimeData.memory.rss)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(realtimeData.memory.heapUsed / realtimeData.memory.heapTotal) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span>{Math.floor(realtimeData.uptime / 3600)}h {Math.floor((realtimeData.uptime % 3600) / 60)}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Handles:</span>
                      <span>{realtimeData.activeHandles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Requests:</span>
                      <span>{realtimeData.activeRequests}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>User:</span>
                      <span>{Math.round((realtimeData.cpuUsage?.user || 0) / 1000)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System:</span>
                      <span>{Math.round((realtimeData.cpuUsage?.system || 0) / 1000)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Slowest Requests */}
          {performanceData && performanceData.slowestRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Slowest Requests</CardTitle>
                <CardDescription>Recent requests with highest response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceData.slowestRequests.slice(0, 5).map((request, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{request.method}</Badge>
                        <span className="font-mono text-sm">{request.route}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-red-600 font-bold">{request.duration}ms</span>
                        <span className="text-gray-500">{new Date(request.startTime).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {healthData && healthData.alerts.length > 0 ? (
            <div className="space-y-3">
              {healthData.alerts.map((alert, index) => (
                <Alert key={index} className={`border-l-4 ${
                  alert.level === 'critical' ? 'border-l-red-500' :
                  alert.level === 'error' ? 'border-l-red-400' :
                  alert.level === 'warning' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.level)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center space-x-2">
                        <span>{alert.component.toUpperCase()}</span>
                        <Badge variant={
                          alert.level === 'critical' ? 'destructive' :
                          alert.level === 'error' ? 'destructive' :
                          alert.level === 'warning' ? 'secondary' :
                          'default'
                        }>
                          {alert.level}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <p>{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                        {alert.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer">View Details</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(alert.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Active Alerts</h3>
                <p className="text-gray-600">All systems are operating normally</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          {healthData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(healthData.components).map(([name, component]) => (
                <Card key={name}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(component.status)}
                      <span className="capitalize">{name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={getStatusColor(component.status)}>
                          {component.status}
                        </Badge>
                      </div>
                      {component.responseTime && (
                        <div className="flex justify-between">
                          <span>Response Time:</span>
                          <span>{component.responseTime}ms</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Last Check:</span>
                        <span className="text-sm">{new Date(component.lastCheck).toLocaleTimeString()}</span>
                      </div>
                      {component.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer">View Details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(component.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
