import React, { useEffect, useState } from 'react';
import { testSupabaseConnection } from '../utils/supabaseClient';
import { userService, projectService, taskService, timeLogService, inventoryService } from '../utils/supabaseService';

interface TestResult {
  testName: string;
  status: 'success' | 'error' | 'running';
  result: string;
}

const SupabaseConnectionTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (testName: string, status: 'success' | 'error' | 'running', result: string) => {
    setResults(prev => [...prev, { testName, status, result }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Basic connection
      addResult('Basic Connection', 'running', 'Testing...');
      const connectionOK = await testSupabaseConnection();
      addResult('Basic Connection', 'success', connectionOK ? 'Connection successful' : 'Connection failed');

      // Test 2: User operations
      addResult('User Service', 'running', 'Testing...');
      const users = await userService.getAll();
      addResult('User Service', 'success', `Found ${users.length} users`);

      // Test 3: Project operations  
      addResult('Project Service', 'running', 'Testing...');
      const projects = await projectService.getAll();
      addResult('Project Service', 'success', `Found ${projects.length} projects`);

      // Test 4: Task operations
      addResult('Task Service', 'running', 'Testing...');
      const tasks = await taskService.getAll();
      addResult('Task Service', 'success', `Found ${tasks.length} tasks`);

      // Test 5: Time log operations
      addResult('Time Log Service', 'running', 'Testing...');
      const timeLogs = await timeLogService.getAll();
      addResult('Time Log Service', 'success', `Found ${timeLogs.length} time logs`);

      // Test 6: Inventory operations
      addResult('Inventory Service', 'running', 'Testing...');
      const inventory = await inventoryService.getAll();
      addResult('Inventory Service', 'success', `Found ${inventory.length} inventory items`);

    } catch (error) {
      addResult('Error', 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Supabase Connection Test</h1>
        
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Running comprehensive tests on Supabase MCP connections...
          </div>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Re-run Tests'}
          </button>
        </div>

        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : result.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{result.testName}</span>
                <span className={`text-sm ${
                  result.status === 'success'
                    ? 'text-green-600'
                    : result.status === 'error'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}>
                  {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">{result.result}</div>
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            Click "Re-run Tests" to start testing...
          </div>
        )}

        {isRunning && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-600">Running tests...</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium text-gray-800 mb-2">Environment Variables:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</div>
            <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionTest;