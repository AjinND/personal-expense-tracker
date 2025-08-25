// src/components/dev/DebugHelper.tsx
'use client';

import { STORAGE_KEYS } from '@/constants/dashboard';
import React, { useState, useEffect } from 'react';

export const DebugHelper: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    checkDebugInfo();
  }, []);

  const checkDebugInfo = () => {
    const info = {
      authToken: localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
      authTokenExists: !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      localStorage: { ...localStorage },
      cookies: document.cookie,
    };
    setDebugInfo(info);
  };

  const testApiDirectly = async () => {
    const results: any = {};
    
    try {
      // Test 1: Health check
      console.log('🔍 Testing /api/health...');
      const healthResponse = await fetch('/api/health');
      results.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        statusText: healthResponse.statusText,
      };
      console.log('Health check result:', results.health);
    } catch (error) {
      results.health = { error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error) };
      console.error('Health check failed:', error);
    }

    try {
      // Test 2: Expenses without auth
      console.log('🔍 Testing /api/expenses without auth...');
      const expensesResponse = await fetch('/api/expenses');
      const expensesData = await expensesResponse.json();
      results.expensesNoAuth = {
        status: expensesResponse.status,
        ok: expensesResponse.ok,
        statusText: expensesResponse.statusText,
        data: expensesData,
      };
      console.log('Expenses (no auth) result:', results.expensesNoAuth);
    } catch (error) {
      results.expensesNoAuth = { error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error) };
      console.error('Expenses (no auth) failed:', error);
    }

    try {
      // Test 3: Expenses with auth (if token exists)
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        console.log('🔍 Testing /api/expenses with auth token...');
        const authExpensesResponse = await fetch('/api/expenses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const authExpensesData = await authExpensesResponse.json();
        results.expensesWithAuth = {
          status: authExpensesResponse.status,
          ok: authExpensesResponse.ok,
          statusText: authExpensesResponse.statusText,
          data: authExpensesData,
        };
        console.log('Expenses (with auth) result:', results.expensesWithAuth);
      } else {
        results.expensesWithAuth = { skipped: 'No auth token found' };
      }
    } catch (error) {
      results.expensesWithAuth = { error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error) };
      console.error('Expenses (with auth) failed:', error);
    }

    setTestResults(results);
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    checkDebugInfo();
    alert('Local storage cleared!');
  };

  const setMockToken = () => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'mock-jwt-token-for-testing');
    checkDebugInfo();
    alert('Mock token set!');
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-black text-white p-4 rounded-lg max-w-md text-xs font-mono">
      <div className="mb-3">
        <h3 className="text-yellow-400 font-bold mb-2">🐛 Debug Helper</h3>
        
        <div className="space-y-1 mb-3">
          <div>Auth Token: {debugInfo.authTokenExists ? '✅ Exists' : '❌ Missing'}</div>
          <div>Token Value: {debugInfo.authToken ? `${debugInfo.authToken.substring(0, 20)}...` : 'None'}</div>
          <div>URL: {debugInfo.currentUrl}</div>
        </div>

        <div className="space-y-1">
          <button
            onClick={testApiDirectly}
            className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            🧪 Test APIs Directly
          </button>
          
          <button
            onClick={setMockToken}
            className="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            🔑 Set Mock Token
          </button>
          
          <button
            onClick={clearLocalStorage}
            className="w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
          >
            🗑️ Clear Storage
          </button>
          
          <button
            onClick={checkDebugInfo}
            className="w-full bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
          >
            🔄 Refresh Info
          </button>
        </div>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="border-t border-gray-600 pt-3">
          <h4 className="text-yellow-400 font-bold mb-2">Test Results:</h4>
          <div className="max-h-32 overflow-y-auto text-xs">
            <pre>{JSON.stringify(testResults, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugHelper;