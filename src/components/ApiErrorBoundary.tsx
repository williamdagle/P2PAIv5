import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import Button from './Button';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
  functionName?: string;
  showFunctionHelp?: boolean;
}

const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({
  children,
  error,
  loading,
  onRetry,
  functionName,
  showFunctionHelp = false
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    const isResourceError = error.includes('ERR_INSUFFICIENT_RESOURCES') || 
                           error.includes('Failed to fetch') ||
                           error.includes('Service temporarily unavailable') ||
                           error.includes('NetworkError') ||
                           error.includes('TypeError: Failed to fetch');
    
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900 mb-2">
              {isResourceError ? 'Connection Issue' : 'Error Loading Data'}
            </h3>
            
            {isResourceError ? (
              <div className="space-y-3">
                <p className="text-red-800 text-sm">
                  Unable to connect to the server. This could be a temporary network issue.
                </p>
                
                {functionName && (
                  <div className="bg-red-100 p-3 rounded border border-red-300">
                    <p className="text-red-900 text-sm font-medium">
                      Function: <code className="bg-red-200 px-1 rounded">{functionName}</code>
                    </p>
                  </div>
                )}
                
                {showFunctionHelp && (
                  <div className="text-red-800 text-sm space-y-2">
                    <p className="font-medium">Possible solutions:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Check your internet connection</li>
                      <li>Try refreshing the page</li>
                      <li>Wait a moment and try again</li>
                      <li>Contact support if the issue persists</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-800 text-sm">{error}</p>
            )}
            
            <div className="flex items-center space-x-3 mt-4">
              {onRetry && (
                <Button
                  variant="secondary"
                  onClick={onRetry}
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              {showFunctionHelp && isResourceError && (
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-red-700 hover:text-red-900 underline"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open Supabase Dashboard
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiErrorBoundary;