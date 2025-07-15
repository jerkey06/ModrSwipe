import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Wifi, RefreshCw, Clock } from 'lucide-react';
import { FirebaseError, ValidationError, getErrorMessage } from '../utils/validation';

export interface ErrorNotificationProps {
  error: Error | null;
  onDismiss: () => void;
  onRetry?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300); // Wait for animation to complete
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay, onDismiss]);

  const getErrorIcon = (error: Error) => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'network-request-failed':
        case 'unavailable':
          return <Wifi className="w-5 h-5" />;
        case 'timeout':
        case 'deadline-exceeded':
          return <Clock className="w-5 h-5" />;
        default:
          return <AlertCircle className="w-5 h-5" />;
      }
    }
    return <AlertCircle className="w-5 h-5" />;
  };

  const getErrorColor = (error: Error) => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'network-request-failed':
        case 'unavailable':
        case 'timeout':
        case 'deadline-exceeded':
          return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        case 'permission-denied':
        case 'unauthenticated':
          return 'bg-red-50 border-red-200 text-red-800';
        default:
          return 'bg-red-50 border-red-200 text-red-800';
      }
    }
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const isRetryable = (error: Error) => {
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
    return false;
  };

  if (!error) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-50 max-w-md w-full"
        >
          <div className={`rounded-lg border p-4 shadow-lg ${getErrorColor(error)}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getErrorIcon(error)}
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">
                  {error instanceof FirebaseError && error.code === 'network-request-failed' 
                    ? 'Connection Problem'
                    : error instanceof FirebaseError && error.code === 'permission-denied'
                    ? 'Access Denied'
                    : 'Error'}
                </h3>
                
                <p className="mt-1 text-sm opacity-90">
                  {getErrorMessage(error)}
                </p>
                
                {(onRetry && isRetryable(error)) && (
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={onRetry}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Try Again
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onDismiss, 300);
                  }}
                  className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for managing error notifications
export const useErrorNotification = () => {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const showError = (error: Error) => {
    setError(error);
    setIsRetrying(false);
  };

  const dismissError = () => {
    setError(null);
    setIsRetrying(false);
  };

  const retryOperation = (retryFn?: () => void | Promise<void>) => {
    if (retryFn) {
      setIsRetrying(true);
      setError(null);
      
      Promise.resolve(retryFn()).catch((error) => {
        setError(error);
        setIsRetrying(false);
      });
    }
  };

  return {
    error,
    isRetrying,
    showError,
    dismissError,
    retryOperation
  };
};

// Global error notification provider
interface ErrorNotificationContextType {
  showError: (error: Error) => void;
  dismissError: () => void;
}

const ErrorNotificationContext = React.createContext<ErrorNotificationContextType | null>(null);

export const ErrorNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { error, showError, dismissError } = useErrorNotification();

  return (
    <ErrorNotificationContext.Provider value={{ showError, dismissError }}>
      {children}
      <ErrorNotification
        error={error}
        onDismiss={dismissError}
        autoHide={true}
        autoHideDelay={6000}
      />
    </ErrorNotificationContext.Provider>
  );
};

export const useGlobalErrorNotification = () => {
  const context = React.useContext(ErrorNotificationContext);
  if (!context) {
    throw new Error('useGlobalErrorNotification must be used within ErrorNotificationProvider');
  }
  return context;
};