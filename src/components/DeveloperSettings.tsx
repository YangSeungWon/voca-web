'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { saveToken, getToken } from '@/lib/token-storage';

export default function DeveloperSettings() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const [tokenInfo, setTokenInfo] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkPlatform = () => {
    addLog('=== Checking Platform ===');
    const capacitor = (window as any).Capacitor;
    const native = capacitor?.isNativePlatform?.();
    setIsNative(native);
    addLog(`Capacitor detected: ${!!capacitor}`);
    addLog(`isNativePlatform: ${native}`);
    addLog(`Platform: ${capacitor?.getPlatform?.() || 'web'}`);

    // Check registered plugins
    if (capacitor?.Plugins) {
      const plugins = Object.keys(capacitor.Plugins);
      addLog(`Registered plugins (${plugins.length}):`);
      plugins.forEach(name => {
        addLog(`  - ${name}`);
      });
    }

    // Check message handler
    if ((window as any).webkit?.messageHandlers?.saveTokenToAppGroups) {
      addLog('✅ iOS message handler available');
    } else {
      addLog('❌ iOS message handler NOT available');
    }
  };

  const testTokenSave = async () => {
    addLog('=== Testing Token Save ===');
    setTestResult('idle');

    try {
      const testToken = `test_token_${Date.now()}`;
      addLog(`Generating test token: ${testToken.substring(0, 20)}...`);

      addLog('Calling saveToken()...');
      await saveToken(testToken);
      addLog('✅ saveToken() completed');
      addLog('⏱ Check Xcode console for [TokenSync] messages');

      addLog('Retrieving token...');
      const retrieved = await getToken();
      addLog(`Retrieved token: ${retrieved?.substring(0, 20)}...`);

      if (retrieved === testToken) {
        addLog('✅ Token save/retrieve SUCCESS');
        setTestResult('success');
        setTokenInfo('✅ Token saved - check Xcode console');
      } else {
        addLog('❌ Token mismatch!');
        setTestResult('error');
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      setTestResult('error');
    }
  };

  const checkCurrentToken = async () => {
    addLog('=== Checking Current Token ===');

    try {
      // Check localStorage
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      addLog(`localStorage: ${localToken ? `${localToken.substring(0, 20)}...` : 'null'}`);

      // Check via getToken()
      const capacitorToken = await getToken();
      addLog(`getToken(): ${capacitorToken ? `${capacitorToken.substring(0, 20)}...` : 'null'}`);

      setTokenInfo(localToken ? '✅ Token found in localStorage' : '❌ No token in localStorage');

      if (localToken) {
        addLog('✅ Token exists - AppDelegate will sync to App Groups');
        addLog('📱 Check Xcode console for [TokenSync] messages');
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      setTokenInfo('❌ Error checking token');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResult('idle');
    setTokenInfo('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white">Developer Settings</h3>
        <button
          onClick={clearLogs}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear Logs
        </button>
      </div>

      {/* Platform Info */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Platform Info</div>
        <div className="text-sm text-gray-900 dark:text-white">
          {isNative === null ? (
            <span className="text-gray-500">Not checked yet</span>
          ) : isNative ? (
            <span className="text-green-600 dark:text-green-400">✅ Native (Capacitor)</span>
          ) : (
            <span className="text-blue-600 dark:text-blue-400">🌐 Web</span>
          )}
        </div>
        {tokenInfo && (
          <div className="mt-2 text-sm text-gray-900 dark:text-white">
            {tokenInfo}
          </div>
        )}
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={checkPlatform}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Check Platform
        </button>
        <button
          onClick={checkCurrentToken}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Check Token
        </button>
        <button
          onClick={testTokenSave}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium col-span-2"
        >
          Test Token Save & Sync
        </button>
      </div>

      {/* Test Result Indicator */}
      {testResult !== 'idle' && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testResult === 'success'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}>
          {testResult === 'success' ? <Check size={20} /> : <X size={20} />}
          <span className="font-medium">
            {testResult === 'success' ? 'Test Passed' : 'Test Failed'}
          </span>
        </div>
      )}

      {/* Logs Display */}
      {logs.length > 0 && (
        <div className="bg-black/90 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-xs font-mono text-green-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="font-medium mb-1">Note:</p>
        <p>Token is synced to iOS App Groups via WKScriptMessageHandler.</p>
        <p>Check Xcode console for [TokenSync] log messages.</p>
      </div>
    </div>
  );
}
