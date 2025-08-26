// src/components/debug/DebugPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bug, 
  Settings, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  Info,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { debug, DebugCategory } from '@/utils/debug';

// Complete interface definitions
interface DebugPanelProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultOpen?: boolean;
}

interface DebugStatus {
  enabled: boolean;
  environment: 'development' | 'production';
  categories: string[];
  totalLogs: number;
  config: {
    enabled: boolean;
    categories: Set<string>;
    showTimestamps: boolean;
    showStackTrace: boolean;
    persistLogs: boolean;
    maxLogs: number;
  };
}

interface DebugLogEntry {
  timestamp: number;
  category: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  data?: any;
  stackTrace?: string;
}

// Category information for display
const categoryInfo = {
  api: { 
    icon: '🌐', 
    label: 'API Calls', 
    description: 'HTTP requests, responses, errors',
    color: 'bg-blue-100 text-blue-700'
  },
  auth: { 
    icon: '🔐', 
    label: 'Authentication', 
    description: 'Login, sessions, tokens',
    color: 'bg-purple-100 text-purple-700'
  },
  dashboard: { 
    icon: '📊', 
    label: 'Dashboard', 
    description: 'Dashboard hooks, data loading',
    color: 'bg-green-100 text-green-700'
  },
  navigation: { 
    icon: '🧭', 
    label: 'Navigation', 
    description: 'Routing, page changes',
    color: 'bg-yellow-100 text-yellow-700'
  },
  ui: { 
    icon: '🎨', 
    label: 'UI Interactions', 
    description: 'User interactions, state changes',
    color: 'bg-pink-100 text-pink-700'
  },
  storage: { 
    icon: '💾', 
    label: 'Storage', 
    description: 'LocalStorage operations',
    color: 'bg-indigo-100 text-indigo-700'
  },
  performance: { 
    icon: '⚡', 
    label: 'Performance', 
    description: 'Timing, measurements',
    color: 'bg-orange-100 text-orange-700'
  },
  fallback: { 
    icon: '🔧', 
    label: 'Fallback API', 
    description: 'Mock data usage',
    color: 'bg-red-100 text-red-700'
  },
  general: { 
    icon: '🐛', 
    label: 'General', 
    description: 'Miscellaneous debug info',
    color: 'bg-gray-100 text-gray-700'
  },
};

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  className,
  position = 'bottom-right',
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [debugStatus, setDebugStatus] = useState<DebugStatus>({
    enabled: false,
    environment: 'development',
    categories: [],
    totalLogs: 0,
    config: {
      enabled: false,
      categories: new Set(),
      showTimestamps: true,
      showStackTrace: false,
      persistLogs: false,
      maxLogs: 1000,
    }
  });
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [copiedLogIndex, setCopiedLogIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'controls' | 'logs'>('controls');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      const status = debug.getStatus() as DebugStatus;
      setDebugStatus(status);
      
      const debugLogs = debug.getLogs();
      setLogs(debugLogs.slice(-50)); // Last 50 logs
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const handleToggleDebug = () => {
    debug.toggle();
    setDebugStatus(debug.getStatus() as DebugStatus);
  };

  const handleToggleCategory = (category: DebugCategory) => {
    if (debugStatus.categories?.includes(category)) {
      debug.disableCategory(category);
    } else {
      debug.enableCategory(category);
    }
    setDebugStatus(debug.getStatus() as DebugStatus);
  };

  const handleClearLogs = () => {
    debug.clearLogs();
    setLogs([]);
  };

  const handleExportLogs = () => {
    debug.exportLogs();
  };

  const handleCopyLog = async (log: DebugLogEntry, index: number) => {
    try {
      const logText = JSON.stringify({
        timestamp: new Date(log.timestamp).toISOString(),
        category: log.category,
        level: log.level,
        message: log.message,
        ...(log.data && { data: log.data })
      }, null, 2);
      
      await navigator.clipboard.writeText(logText);
      setCopiedLogIndex(index);
      setTimeout(() => setCopiedLogIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy log:', error);
    }
  };

  const formatLogLevel = (level: string) => {
    const levelClasses = {
      log: 'bg-gray-100 text-gray-700',
      info: 'bg-blue-100 text-blue-700',
      warn: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
    };
    return levelClasses[level as keyof typeof levelClasses] || levelClasses.log;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  // Collapsed state - show only toggle button
  if (!isOpen) {
    return (
      <div className={cn("fixed z-50", positionClasses[position], className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="secondary"
          className="bg-black/80 text-white hover:bg-black/90 shadow-lg border-0"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
          {debugStatus.enabled && (
            <Badge variant="default" className="ml-2 px-1 py-0 text-xs">
              {debugStatus.totalLogs}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  // Expanded state - show full panel
  return (
    <div className={cn("fixed z-50 w-96 max-w-[calc(100vw-2rem)]", positionClasses[position], className)}>
      <Card className="shadow-lg border-2 border-orange-200 bg-white/95 backdrop-blur max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Debug Panel</CardTitle>
              <Badge variant={debugStatus.enabled ? "default" : "secondary"}>
                {debugStatus.enabled ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab switcher */}
          <div className="flex space-x-2 mt-2">
            <Button
              variant={activeTab === 'controls' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('controls')}
              className="h-8"
            >
              <Settings className="h-3 w-3 mr-1" />
              Controls
            </Button>
            <Button
              variant={activeTab === 'logs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('logs')}
              className="h-8"
            >
              <Info className="h-3 w-3 mr-1" />
              Logs ({logs.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 overflow-y-auto flex-1">
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Main Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Debug System</div>
                  <div className="text-xs text-gray-500">
                    {debugStatus.environment} environment
                  </div>
                </div>
                <Switch
                  checked={debugStatus.enabled}
                  onCheckedChange={handleToggleDebug}
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Categories</h4>
                
                <div className="space-y-1">
                  {Object.entries(categoryInfo).map(([category, info]) => {
                    const isEnabled = debugStatus.categories?.includes(category);
                    
                    return (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-sm">{info.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{info.label}</div>
                            <div className="text-xs text-gray-500">{info.description}</div>
                          </div>
                          <Badge className={cn("text-xs", isEnabled ? info.color : 'bg-gray-100 text-gray-500')}>
                            {category}
                          </Badge>
                        </div>
                        
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleToggleCategory(category as DebugCategory)}
                          disabled={!debugStatus.enabled}
                          className="ml-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Quick Actions</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      debug.enableAllCategories();
                      setDebugStatus(debug.getStatus() as DebugStatus);
                    }}
                    disabled={!debugStatus.enabled}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    All On
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      debug.disableAllCategories();
                      setDebugStatus(debug.getStatus() as DebugStatus);
                    }}
                    disabled={!debugStatus.enabled}
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    All Off
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearLogs}
                    disabled={!debugStatus.enabled || logs.length === 0}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLogs}
                    disabled={!debugStatus.enabled || logs.length === 0}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDebugStatus(debug.getStatus() as DebugStatus);
                    setLogs(debug.getLogs().slice(-50));
                  }}
                  className="w-full"
                  disabled={!debugStatus.enabled}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Status
                </Button>
              </div>

              {/* System Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">System Info</h4>
                <div className="text-xs space-y-1 bg-gray-50 p-2 rounded font-mono">
                  <div>Environment: {debugStatus.environment}</div>
                  <div>Total Logs: {debugStatus.totalLogs}</div>
                  <div>Max Logs: {debugStatus.config.maxLogs}</div>
                  <div>Timestamps: {debugStatus.config.showTimestamps ? 'ON' : 'OFF'}</div>
                  <div>Persist Logs: {debugStatus.config.persistLogs ? 'ON' : 'OFF'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No debug logs yet</p>
                  <p className="text-xs">Enable debug categories to see logs</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className="p-2 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={cn("text-xs", formatLogLevel(log.level))}>
                              {log.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                            <span className="text-xs text-gray-500 font-mono">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-900 break-words">
                            {log.message}
                          </div>
                          
                          {log.data && (
                            <pre className="text-xs text-gray-600 mt-1 bg-white p-1 rounded border overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLog(log, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2"
                        >
                          {copiedLogIndex === index ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};