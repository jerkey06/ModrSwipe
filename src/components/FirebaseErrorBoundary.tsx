import React, { useState, useCallback } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { FirebaseError, getErrorMessage } from '../utils/validation';
import { Wifi, Shield, AlertCircle, Clock, RefreshCw, Home } from 'lucide-react';

interface FirebaseErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void; goHome?: () => void }>;
  onError?: (error: Error) => void;
  showHomeButton?: boolean;
}

const DefaultFirebaseFallback: React.FC<{ 
  error: Error; 
  retry: () => void; 
  goHome?: () => void;
}> = ({ error, retry, goHome }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const isFirebaseError = error instanceof FirebaseError;
  const isNetworkError = isFirebaseError && error.code === 'network-request-failed';
  const isPermissionError = isFirebaseError && error.code === 'permission-denied';
  const isTimeoutError = isFirebaseError && (error.code === 'timeout' || error.code === 'deadline-exceeded');
  const isUnavailableError = isFirebaseError && error.code === 'unavailable';

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
      retry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getIcon = () => {
    if (isNetworkError || isUnavailableError) {
      return <Wifi className="w-8 h-8 text-red-600" />;
    }
    if (isPermissionError) {
      return <Shield className="w-8 h-8 text-red-600" />;
    }
    if (isTimeoutError) {
      return <Clock className="w-8 h-8 text-red-600" />;
    }
    return <AlertCircle className="w-8 h-8 text-red-600" />;
  };

  const getTitle = () => {
    if (isNetworkError) return 'Connection Problem';
    if (isUnavailableError) return 'Service Unavailable';
    if (isPermissionError) return 'Access Denied';
    if (isTimeoutError) return 'Request Timeout';
    return 'Something went wrong';
  };

  const getDescription = () => {
    return getErrorMessage(error);
  };

  const isRetryable = () => {
    if (!isFirebaseError) return true;
    const retryableCodes = [
      'network-request-failed',
      'timeout',
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'internal',
      'aborted'
    ];
    return error.code && retryableCodes.includes(error.code);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[400px]">
      <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
        {getIcon()}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {getTitle()}
      </h3>

      <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
        {getDescription()}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {isRetryable() && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
        )}
        
        {(isNetworkError || isUnavailableError) && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </button>
        )}

        {goHome && (
          <button
            onClick={goHome}
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        )}
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 p-4 bg-gray-100 rounded text-xs max-w-md w-full">
          <summary className="cursor-pointer font-medium text-gray-700 mb-2">
            Error Details (Development)
          </summary>
          <pre className="whitespace-pre-wrap text-gray-600">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
};

export const FirebaseErrorBoundary: React.FC<FirebaseErrorBoundaryProps> = ({ 
  children, 
  fallbackComponent: FallbackComponent = DefaultFirebaseFallback,
  onError,
  showHomeButton = false
}) => {
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={
        <FallbackComponent 
          error={new Error('Component error')} 
          retry={handleRetry}
          goHome={showHomeButton ? handleGoHome : undefined}
        />
      }
      onError={(error, errorInfo) => {
        // Log Firebase errors with additional context
        if (error instanceof FirebaseError) {
          console.error('Firebase Error Boundary:', {
            message: error.message,
            code: error.code,
            originalError: error.originalError,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error('Error Boundary:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString()
          });
        }

        // Call custom error handler if provided
        if (onError) {
          onError(error);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Enhanced hook for handling Firebase errors in components
export function useFirebaseErrorHandler() {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback((error: Error) => {
    console.error('Firebase error handled:', error);
    setError(error);
    setIsRetrying(false);
  }, []);

  const retry = useCallback(async (retryFn?: () => Promise<void>) => {
    if (retryCount >= 3) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      if (retryFn) {
        await retryFn();
      }
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Retry failed:', error);
      setError(error as Error);
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount]);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  const isRetryable = useCallback((error: Error) => {
    if (error instanceof FirebaseError) {
      const retryableCodes = [
        'network-request-failed',
        'timeout',
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'internal',
        'aborted'
      ];
      return error.code && retryableCodes.includes(error.code);
    }
    return true;
  }, []);

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    retry,
    clearError,
    isRetryable,
    hasError: error !== null,
    canRetry: retryCount < 3
  };
}