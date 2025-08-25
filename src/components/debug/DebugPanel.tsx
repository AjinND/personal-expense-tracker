// src/components/debug/DebugPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
// import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  Settings, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  Info,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { debug, DebugCategory } from '@/utils/debug';

interface DebugPanelProps {
  className?: string;
}

const categoryInfo = {
  api: { icon: '🌐', label: 'API Calls', description: 'HTTP requests, responses, errors' },
  auth: { icon: '🔐', label: 'Authentication', description: 'Login, sessions, tokens' },
  dashboard: { icon: '📊', label: 'Dashboard', description: 'Dashboard hooks, data loading' },
  navigation: { icon: '🧭', label: 'Navigation', description: 'Routing, page changes' },
  ui: { icon: '🎨', label: 'UI Interactions', description: 'User interactions, state changes' },
  storage: { icon: '💾', label: 'Storage', description: 'LocalStorage operations' },
  performance: { icon: '⚡', label: 'Performance', description: 'Timing, measurements' },
  fallback: { icon: '🔧', label: 'Fallback API', description: 'Mock data usage' },
  general: { icon: '🐛', label: 'General', description: 'Miscellaneous debug info' },
};

export const DebugPanel: React.FC<DebugPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugStatus, setDebugStatus] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      setDebugStatus(debug.getStatus());
      setLogs(debug.getLogs().slice(-50)); // Last 50 logs
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDebug = () => {
    debug.toggle();
    setDebugStatus(debug.getStatus());
  };

  const handleToggleCategory = (category: DebugCategory) => {
    if (debugStatus.categories?.includes(category)) {
      debug.disableCategory(category);
    } else {
      debug.enableCategory(category);
    }
    setDebugStatus(debug.getStatus());
  };

  const handleClearLogs = () => {
    debug.clearLogs();
    setLogs([]);
  };

  const handleExportLogs = () => {
    debug.exportLogs();
  };

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="secondary"
          className="bg-black/80 text-white hover:bg-black/90 shadow-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 w-96", className)}>
      <Card className="shadow-lg border-2 border-orange-200 bg-white/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Debug Panel</CardTitle>
              <Badge variant={debugStatus.enabled ? "default" : "secondary"}>
                {debugStatus.enabled ? 'ON' : 'OFF'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugStatus(debug.getStatus())}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable Debug Mode</span>
            <Switch
              checked={debugStatus.enabled}
              onCheckedChange={handleToggleDebug}
            />
          </div>

          {/* <Separator /> */}

          {/* Categories */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Debug Categories</h4>
            
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {Object.entries(categoryInfo).map(([key, info]) => {
                const category = key as DebugCategory;
                const isEnabled = debugStatus.categories?.includes(category);
                
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{info.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{info.label}</div>
                        <div className="text-xs text-gray-500">{info.description}</div>
                      </div>
                    </div>
                    
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleCategory(category)}
                      disabled={!debugStatus.enabled}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* <Separator /> */}

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Quick Actions</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  debug.enableAllCategories();
                  setDebugStatus(debug.getStatus());
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
                  setDebugStatus(debug.getStatus());
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
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Logs
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLogs}
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* <Separator /> */}

          {/* Status Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Status</h4>
            
            <div className="text-xs space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>Environment:</span>
                <Badge variant="outline">{debugStatus.environment}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Logs:</span>
                <Badge variant="outline">{debugStatus.totalLogs || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Active Categories:</span>
                <Badge variant="outline">{debugStatus.categories?.length || 0}</Badge>
              </div>
            </div>
          </div>

          {/* Recent Logs Preview */}
          {logs.length > 0 && (
            <>
              {/* <Separator /> */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Recent Logs</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {logs.slice(-5).map((log, index) => (
                    <div
                      key={index}
                      className="p-2 rounded bg-gray-50 border"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs px-1">
                          {log.category}
                        </Badge>
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-700 truncate">
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <div className="flex items-start space-x-1">
              <Info className="h-3 w-3 mt-0.5 text-blue-600" />
              <div>
                <strong>Console Commands:</strong><br />
                Type <code>debug.help()</code> in browser console for full API
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};