// src/components/dev/ApiStatusIndicator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { dashboardApi } from '@/services/dashboard-api';
import { dashboardApiFallback } from '@/services/dashboard-api-fallback';

interface ApiStatusIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ 
  position = 'bottom-right' 
}) => {
  const [status, setStatus] = useState<{
    environment: string;
    usingFallback: boolean;
  }>({ environment: 'unknown', usingFallback: false });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    const checkStatus = async () => {
      const apiStatus = dashboardApi.getStatus();
      const healthy = await dashboardApi.healthCheck();
      
      setStatus(apiStatus);
      setIsHealthy(healthy);
    };

    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResetFallback = () => {
    dashboardApi.resetFallbackMode();
    dashboardApiFallback.resetMockData();
    
    // Recheck status after reset
    setTimeout(() => {
      const newStatus = dashboardApi.getStatus();
      setStatus(newStatus);
    }, 100);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const getStatusColor = () => {
    if (status.usingFallback) return 'bg-yellow-500';
    if (isHealthy === true) return 'bg-green-500';
    if (isHealthy === false) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (status.usingFallback) return 'MOCK';
    if (isHealthy === true) return 'API';
    if (isHealthy === false) return 'ERROR';
    return 'CHECKING';
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 font-mono text-xs`}>
      {/* Status Indicator */}
      <div
        className={`${getStatusColor()} text-white px-2 py-1 rounded cursor-pointer transition-all hover:opacity-80`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Click to expand API status details"
      >
        {getStatusText()}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 bg-black text-white p-3 rounded shadow-lg min-w-[200px]">
          <div className="mb-2">
            <div className="font-bold text-green-400">🛠️ DEV MODE</div>
            <div className="text-gray-300">Environment: {status.environment}</div>
          </div>
          
          <div className="mb-2">
            <div className="text-blue-400">API Status:</div>
            <div className={`ml-2 ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>
              {isHealthy ? '✅ Healthy' : '❌ Unavailable'}
            </div>
          </div>

          <div className="mb-3">
            <div className="text-yellow-400">Data Source:</div>
            <div className={`ml-2 ${status.usingFallback ? 'text-yellow-400' : 'text-green-400'}`}>
              {status.usingFallback ? '🔧 Mock Data' : '🌐 Real API'}
            </div>
          </div>

          {status.usingFallback && (
            <div className="mb-3 p-2 bg-yellow-900 rounded">
              <div className="text-yellow-200 text-xs">
                ⚠️ Using fallback mock data because the real API is not available.
              </div>
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={handleResetFallback}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              🔄 Reset API State
            </button>
            
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatusIndicator;