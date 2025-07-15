import { useState, useEffect, useCallback } from 'react';
import { ref, onDisconnect, onValue, serverTimestamp, set } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { FirebaseError } from '../utils/validation';

export interface ConnectionState {
  isOnline: boolean;
  isConnected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: FirebaseError | null;
}

export const useFirebaseConnection = (userId?: string) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    isConnected: false,
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });

  const [isRetrying, setIsRetrying] = useState(false);

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionState(prev => ({ ...prev, isOnline: true, error: null }));
    };

    const handleOffline = () => {
      setConnectionState(prev => ({ 
        ...prev, 
        isOnline: false, 
        isConnected: false,
        error: new FirebaseError('You are offline. Please check your internet connection.', 'network-request-failed')
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firebase connection status
  useEffect(() => {
    const connectedRef = ref(rtdb, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      
      setConnectionState(prev => ({
        ...prev,
        isConnected,
        lastConnected: isConnected ? new Date() : prev.lastConnected,
        reconnectAttempts: isConnected ? 0 : prev.reconnectAttempts,
        error: isConnected ? null : new FirebaseError(
          'Lost connection to Firebase. Attempting to reconnect...', 
          'unavailable'
        )
      }));

      // Set up presence system for user if connected and userId provided
      if (isConnected && userId) {
        const userStatusRef = ref(rtdb, `users/${userId}/status`);
        const userLastSeenRef = ref(rtdb, `users/${userId}/lastSeen`);
        
        // Set user as online
        set(userStatusRef, 'online').catch(console.error);
        
        // Set up disconnect handler to mark user as offline
        onDisconnect(userStatusRef).set('offline');
        onDisconnect(userLastSeenRef).set(serverTimestamp());
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Retry connection with exponential backoff
  const retryConnection = useCallback(async () => {
    if (isRetrying || connectionState.reconnectAttempts >= 5) {
      return;
    }

    setIsRetrying(true);
    
    try {
      // Increment retry attempts
      setConnectionState(prev => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));

      // Wait with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, connectionState.reconnectAttempts), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Try to reconnect by checking connection status
      const connectedRef = ref(rtdb, '.info/connected');
      const snapshot = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection check timeout')), 10000);
        
        onValue(connectedRef, (snapshot) => {
          clearTimeout(timeout);
          resolve(snapshot);
        }, { onlyOnce: true });
      });

      // Connection check successful
      console.log('Connection retry successful');
      
    } catch (error) {
      console.error('Connection retry failed:', error);
      setConnectionState(prev => ({
        ...prev,
        error: new FirebaseError(
          `Connection retry failed (attempt ${prev.reconnectAttempts + 1}/5)`,
          'network-request-failed'
        )
      }));
    } finally {
      setIsRetrying(false);
    }
  }, [connectionState.reconnectAttempts, isRetrying]);

  // Auto-retry connection when offline
  useEffect(() => {
    if (!connectionState.isConnected && 
        connectionState.isOnline && 
        connectionState.reconnectAttempts < 5 && 
        !isRetrying) {
      
      const retryTimer = setTimeout(() => {
        retryConnection();
      }, 2000);

      return () => clearTimeout(retryTimer);
    }
  }, [connectionState.isConnected, connectionState.isOnline, connectionState.reconnectAttempts, isRetrying, retryConnection]);

  const resetConnection = useCallback(() => {
    setConnectionState(prev => ({
      ...prev,
      reconnectAttempts: 0,
      error: null
    }));
  }, []);

  return {
    ...connectionState,
    isRetrying,
    retryConnection,
    resetConnection,
    canRetry: connectionState.reconnectAttempts < 5 && !isRetrying
  };
};

// Hook for monitoring specific Firebase operations
export const useFirebaseOperationStatus = () => {
  const [operations, setOperations] = useState<Map<string, {
    status: 'pending' | 'success' | 'error';
    error?: FirebaseError;
    timestamp: Date;
  }>>(new Map());

  const startOperation = useCallback((operationId: string) => {
    setOperations(prev => new Map(prev.set(operationId, {
      status: 'pending',
      timestamp: new Date()
    })));
  }, []);

  const completeOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        newMap.set(operationId, {
          ...operation,
          status: 'success',
          timestamp: new Date()
        });
      }
      return newMap;
    });
  }, []);

  const failOperation = useCallback((operationId: string, error: FirebaseError) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        newMap.set(operationId, {
          ...operation,
          status: 'error',
          error,
          timestamp: new Date()
        });
      }
      return newMap;
    });
  }, []);

  const clearOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });
  }, []);

  const getOperation = useCallback((operationId: string) => {
    return operations.get(operationId);
  }, [operations]);

  return {
    startOperation,
    completeOperation,
    failOperation,
    clearOperation,
    getOperation,
    operations: Array.from(operations.entries())
  };
};