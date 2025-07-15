// Firebase data validation utilities
import { Mod, User } from '../types';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FirebaseError extends Error {
  constructor(message: string, public code?: string, public originalError?: Error) {
    super(message);
    this.name = 'FirebaseError';
  }
}

// Validation functions for Firebase data
export const validateModData = (data: any): Mod => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid mod data: must be an object');
  }

  if (!data.id || typeof data.id !== 'string') {
    throw new ValidationError('Invalid mod data: id is required and must be a string', 'id');
  }

  if (!data.roomId || typeof data.roomId !== 'string') {
    throw new ValidationError('Invalid mod data: roomId is required and must be a string', 'roomId');
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new ValidationError('Invalid mod data: name is required and must be a string', 'name');
  }

  if (!data.description || typeof data.description !== 'string') {
    throw new ValidationError('Invalid mod data: description is required and must be a string', 'description');
  }

  if (!data.proposedBy || typeof data.proposedBy !== 'string') {
    throw new ValidationError('Invalid mod data: proposedBy is required and must be a string', 'proposedBy');
  }

  // Validate optional fields
  if (data.url && typeof data.url !== 'string') {
    throw new ValidationError('Invalid mod data: url must be a string', 'url');
  }

  if (data.image && typeof data.image !== 'string') {
    throw new ValidationError('Invalid mod data: image must be a string', 'image');
  }

  // Validate and parse createdAt
  let createdAt: Date;
  if (data.createdAt instanceof Date) {
    createdAt = data.createdAt;
  } else if (typeof data.createdAt === 'string') {
    createdAt = new Date(data.createdAt);
    if (isNaN(createdAt.getTime())) {
      throw new ValidationError('Invalid mod data: createdAt must be a valid date', 'createdAt');
    }
  } else {
    throw new ValidationError('Invalid mod data: createdAt is required and must be a date or ISO string', 'createdAt');
  }

  return {
    id: data.id,
    roomId: data.roomId,
    name: data.name,
    url: data.url || undefined,
    description: data.description,
    image: data.image || undefined,
    proposedBy: data.proposedBy,
    createdAt
  };
};

export const validatePlayerData = (data: any, playerId: string): User & { isHost: boolean; joinedAt: Date; isOnline: boolean } => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid player data: must be an object');
  }

  if (!data.nickname || typeof data.nickname !== 'string') {
    throw new ValidationError('Invalid player data: nickname is required and must be a string', 'nickname');
  }

  if (typeof data.isHost !== 'boolean') {
    throw new ValidationError('Invalid player data: isHost must be a boolean', 'isHost');
  }

  if (typeof data.isOnline !== 'boolean') {
    throw new ValidationError('Invalid player data: isOnline must be a boolean', 'isOnline');
  }

  // Validate and parse joinedAt
  let joinedAt: Date;
  if (data.joinedAt instanceof Date) {
    joinedAt = data.joinedAt;
  } else if (typeof data.joinedAt === 'string') {
    joinedAt = new Date(data.joinedAt);
    if (isNaN(joinedAt.getTime())) {
      throw new ValidationError('Invalid player data: joinedAt must be a valid date', 'joinedAt');
    }
  } else {
    throw new ValidationError('Invalid player data: joinedAt is required and must be a date or ISO string', 'joinedAt');
  }

  return {
    uid: playerId,
    nickname: data.nickname,
    isAnonymous: true, // Default for room players
    isHost: data.isHost,
    joinedAt,
    isOnline: data.isOnline
  };
};

export const validateRoomData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid room data: must be an object');
  }

  if (!data.id || typeof data.id !== 'string') {
    throw new ValidationError('Invalid room data: id is required and must be a string', 'id');
  }

  if (!data.hostId || typeof data.hostId !== 'string') {
    throw new ValidationError('Invalid room data: hostId is required and must be a string', 'hostId');
  }

  if (!data.status || !['lobby', 'voting', 'results'].includes(data.status)) {
    throw new ValidationError('Invalid room data: status must be lobby, voting, or results', 'status');
  }

  // Validate and parse createdAt
  let createdAt: Date;
  if (data.createdAt instanceof Date) {
    createdAt = data.createdAt;
  } else if (typeof data.createdAt === 'string') {
    createdAt = new Date(data.createdAt);
    if (isNaN(createdAt.getTime())) {
      throw new ValidationError('Invalid room data: createdAt must be a valid date', 'createdAt');
    }
  } else {
    throw new ValidationError('Invalid room data: createdAt is required and must be a date or ISO string', 'createdAt');
  }

  return {
    ...data,
    createdAt
  };
};

// Safe data access helpers
export const safeGetArray = <T>(data: any, defaultValue: T[] = []): T[] => {
  return Array.isArray(data) ? data : defaultValue;
};

export const safeGetObject = <T>(data: any, defaultValue: T): T => {
  return data && typeof data === 'object' && !Array.isArray(data) ? data : defaultValue;
};

export const safeGetString = (data: any, defaultValue: string = ''): string => {
  return typeof data === 'string' ? data : defaultValue;
};

// Error handling utilities
export const handleFirebaseError = (error: any, operation: string): never => {
  console.error(`Firebase error in ${operation}:`, error);
  
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        throw new FirebaseError(`Access denied for ${operation}`, error.code, error);
      case 'not-found':
        throw new FirebaseError(`Resource not found for ${operation}`, error.code, error);
      case 'network-request-failed':
        throw new FirebaseError(`Network error during ${operation}. Please check your connection.`, error.code, error);
      case 'timeout':
        throw new FirebaseError(`Operation ${operation} timed out. Please try again.`, error.code, error);
      case 'unavailable':
        throw new FirebaseError(`Service temporarily unavailable for ${operation}. Please try again.`, error.code, error);
      case 'cancelled':
        throw new FirebaseError(`Operation ${operation} was cancelled.`, error.code, error);
      case 'deadline-exceeded':
        throw new FirebaseError(`Operation ${operation} took too long. Please try again.`, error.code, error);
      case 'already-exists':
        throw new FirebaseError(`Resource already exists for ${operation}.`, error.code, error);
      case 'resource-exhausted':
        throw new FirebaseError(`Too many requests for ${operation}. Please wait and try again.`, error.code, error);
      case 'failed-precondition':
        throw new FirebaseError(`Operation ${operation} failed due to invalid state.`, error.code, error);
      case 'aborted':
        throw new FirebaseError(`Operation ${operation} was aborted due to conflict.`, error.code, error);
      case 'out-of-range':
        throw new FirebaseError(`Invalid parameters for ${operation}.`, error.code, error);
      case 'unimplemented':
        throw new FirebaseError(`Operation ${operation} is not supported.`, error.code, error);
      case 'internal':
        throw new FirebaseError(`Internal server error during ${operation}. Please try again.`, error.code, error);
      case 'data-loss':
        throw new FirebaseError(`Data corruption detected during ${operation}.`, error.code, error);
      case 'unauthenticated':
        throw new FirebaseError(`Authentication required for ${operation}.`, error.code, error);
      default:
        throw new FirebaseError(`Firebase error during ${operation}: ${error.message}`, error.code, error);
    }
  }
  
  if (error instanceof ValidationError) {
    throw error;
  }
  
  throw new FirebaseError(`Unexpected error during ${operation}: ${error.message}`, undefined, error);
};

// Retry mechanism for Firebase operations
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'network-request-failed',
    'timeout',
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'internal',
    'aborted'
  ]
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Check if error is retryable
      const isRetryable = error instanceof FirebaseError && 
        error.code && 
        config.retryableErrors.includes(error.code);
      
      if (!isRetryable) {
        // Non-retryable error, throw immediately
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed for ${operationName}, retrying in ${delay}ms:`, error.message);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All attempts failed
  throw lastError!;
};

// User-friendly error messages
export const getErrorMessage = (error: Error): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You don\'t have permission to access this resource. Please contact the room host.';
      case 'not-found':
        return 'The requested room or resource was not found. Please check the room code.';
      case 'network-request-failed':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'timeout':
      case 'deadline-exceeded':
        return 'The request took too long to complete. Please try again.';
      case 'unavailable':
        return 'The service is temporarily unavailable. Please try again in a moment.';
      case 'resource-exhausted':
        return 'Too many requests. Please wait a moment and try again.';
      case 'unauthenticated':
        return 'You need to be signed in to perform this action.';
      case 'already-exists':
        return 'This resource already exists. Please try a different name or ID.';
      case 'failed-precondition':
        return 'This action cannot be performed in the current state.';
      case 'cancelled':
        return 'The operation was cancelled.';
      case 'internal':
        return 'An internal server error occurred. Please try again.';
      case 'data-loss':
        return 'Data corruption was detected. Please refresh and try again.';
      default:
        return error.message || 'An unexpected Firebase error occurred.';
    }
  }
  
  if (error instanceof ValidationError) {
    return `Invalid data: ${error.message}`;
  }
  
  return error.message || 'An unexpected error occurred.';
};