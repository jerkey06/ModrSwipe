import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useFirebaseConnection } from '../hooks/useFirebaseConnection';
import { useAppStore } from '../store/useAppStore';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const { user } = useAppStore();
  const connection = useFirebaseConnection(user?.uid);

  // Don't show anything if everything is working fine
  if (connection.isOnline && connection.isConnected && !connection.error) {
    return null;
  }

  const getStatusColor = () => {
    if (!connection.isOnline) return 'bg-red-500';
    if (!connection.isConnected) return 'bg-yellow-500';
    if (connection.error) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!connection.isOnline) return 'Offline';
    if (!connection.isConnected) return 'Connecting...';
    if (connection.error) return 'Connection Error';
    return 'Connected';
  };

  const getIcon = () => {
    if (!connection.isOnline) return <WifiOff className="w-4 h-4" />;
    if (!connection.isConnected) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (connection.error) return <AlertCircle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 left-4 z-40 ${className}`}
      >
        <div className="bg-white rounded-lg shadow-lg border p-3 max-w-sm">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <div className="flex items-center space-x-2 text-sm">
              {getIcon()}
              <span className="font-medium text-gray-900">
                {getStatusText()}
              </span>
            </div>
          </div>

          {showDetails && (
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              {connection.error && (
                <p className="text-red-600">{connection.error.message}</p>
              )}
              
              {connection.reconnectAttempts > 0 && (
                <p>Retry attempts: {connection.reconnectAttempts}/5</p>
              )}
              
              {connection.lastConnected && (
                <p>
                  Last connected: {connection.lastConnected.toLocaleTimeString()}
                </p>
              )}

              {connection.canRetry && (
                <button
                  onClick={connection.retryConnection}
                  disabled={connection.isRetrying}
                  className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connection.isRetrying ? 'Retrying...' : 'Retry Now'}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Compact version for status bars
export const ConnectionIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user } = useAppStore();
  const connection = useFirebaseConnection(user?.uid);

  const getStatusColor = () => {
    if (!connection.isOnline || !connection.isConnected || connection.error) {
      return 'text-red-500';
    }
    return 'text-green-500';
  };

  const getIcon = () => {
    if (!connection.isOnline) return <WifiOff className="w-4 h-4" />;
    if (!connection.isConnected) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (connection.error) return <AlertCircle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div className={`flex items-center ${getStatusColor()} ${className}`}>
      {getIcon()}
    </div>
  );
};

// Hook for components to check connection status
export const useConnectionStatus = () => {
  const { user } = useAppStore();
  const connection = useFirebaseConnection(user?.uid);

  return {
    isOnline: connection.isOnline,
    isConnected: connection.isConnected,
    hasError: !!connection.error,
    error: connection.error,
    canRetry: connection.canRetry,
    retry: connection.retryConnection,
    isRetrying: connection.isRetrying
  };
};