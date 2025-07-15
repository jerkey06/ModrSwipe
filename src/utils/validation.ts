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
      default:
        throw new FirebaseError(`Firebase error during ${operation}: ${error.message}`, error.code, error);
    }
  }
  
  if (error instanceof ValidationError) {
    throw error;
  }
  
  throw new FirebaseError(`Unexpected error during ${operation}: ${error.message}`, undefined, error);
};