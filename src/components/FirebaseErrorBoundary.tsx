import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { FirebaseError } from '../utils/validation';

interface FirebaseErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
}

const DefaultFirebaseFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const isFirebaseError = error instanceof FirebaseError;
  const isNetworkError = isFirebaseError && error.code === 'network-request-failed';
  const isPermissionError = isFirebaseError && error.code === 'permission-denied';

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
        {isNetworkError ? (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        ) : isPermissionError ? (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isNetworkError ? 'Connection Problem' : 
         isPermissionError ? 'Access Denied' : 
         'Something went wrong'}
      </h3>

      <p className="text-gray-600 text-center mb-6 max-w-md">
        {isNetworkError ? 
          'Unable to connect to the server. Please check your internet connection and try again.' :
         isPermissionError ?
          'You don\'t have permission to access this resource. Please contact the room host.' :
          error.message || 'An unexpected error occurred while loading data.'}
      </p>

      <div className="flex space-x-3">
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        
        {isNetworkError && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reload Page
          </button>
        )}
      </div>
    </div>
  );
};

export const FirebaseErrorBoundary: React.FC<FirebaseErrorBoundaryProps> = ({ 
  children, 
  fallbackComponent: FallbackComponent = DefaultFirebaseFallback 
}) => {
  return (
    <ErrorBoundary
      fallback={null}
      onError={(error, errorInfo) => {
        // Log Firebase errors with additional context
        if (error instanceof FirebaseError) {
          console.error('Firebase Error:', {
            message: error.message,
            code: error.code,
            originalError: error.originalError,
            componentStack: errorInfo.componentStack
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Hook for handling Firebase errors in components
export function useFirebaseErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error: Error) => {
    console.error('Firebase error handled:', error);
    setError(error);
    setIsRetrying(false);
  }, []);

  const retry = React.useCallback(() => {
    setError(null);
    setIsRetrying(true);
    // Reset retrying state after a short delay
    setTimeout(() => setIsRetrying(false), 1000);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  return {
    error,
    isRetrying,
    handleError,
    retry,
    clearError,
    hasError: error !== null
  };
}