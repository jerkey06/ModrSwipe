import { describe, it, expect } from 'vitest';
import { 
  validateModData, 
  validatePlayerData, 
  validateRoomData, 
  ValidationError,
  FirebaseError,
  handleFirebaseError,
  safeGetArray,
  safeGetObject,
  safeGetString
} from './validation';

describe('Validation utilities', () => {
  describe('validateModData', () => {
    it('should validate correct mod data', () => {
      const validMod = {
        id: 'test-id',
        roomId: 'room-123',
        name: 'Test Mod',
        description: 'A test mod',
        proposedBy: 'user-123',
        createdAt: new Date()
      };

      const result = validateModData(validMod);
      expect(result).toEqual(validMod);
    });

    it('should throw ValidationError for missing required fields', () => {
      const invalidMod = {
        id: 'test-id',
        // missing roomId
        name: 'Test Mod',
        description: 'A test mod',
        proposedBy: 'user-123',
        createdAt: new Date()
      };

      expect(() => validateModData(invalidMod)).toThrow(ValidationError);
    });

    it('should handle ISO string dates', () => {
      const modWithISODate = {
        id: 'test-id',
        roomId: 'room-123',
        name: 'Test Mod',
        description: 'A test mod',
        proposedBy: 'user-123',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      const result = validateModData(modWithISODate);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('validatePlayerData', () => {
    it('should validate correct player data', () => {
      const validPlayer = {
        nickname: 'TestPlayer',
        isHost: true,
        isOnline: true,
        joinedAt: new Date()
      };

      const result = validatePlayerData(validPlayer, 'player-123');
      expect(result.uid).toBe('player-123');
      expect(result.nickname).toBe('TestPlayer');
      expect(result.isHost).toBe(true);
    });

    it('should throw ValidationError for invalid data types', () => {
      const invalidPlayer = {
        nickname: 'TestPlayer',
        isHost: 'true', // should be boolean
        isOnline: true,
        joinedAt: new Date()
      };

      expect(() => validatePlayerData(invalidPlayer, 'player-123')).toThrow(ValidationError);
    });
  });

  describe('Safe data access helpers', () => {
    it('should return default array for non-array input', () => {
      expect(safeGetArray(null)).toEqual([]);
      expect(safeGetArray(undefined)).toEqual([]);
      expect(safeGetArray('not-array')).toEqual([]);
      expect(safeGetArray([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should return default object for non-object input', () => {
      const defaultObj = { default: true };
      expect(safeGetObject(null, defaultObj)).toEqual(defaultObj);
      expect(safeGetObject([], defaultObj)).toEqual(defaultObj);
      expect(safeGetObject({ valid: true }, defaultObj)).toEqual({ valid: true });
    });

    it('should return default string for non-string input', () => {
      expect(safeGetString(null)).toBe('');
      expect(safeGetString(123)).toBe('');
      expect(safeGetString('valid')).toBe('valid');
    });
  });

  describe('Error handling', () => {
    it('should handle Firebase errors with codes', () => {
      const firebaseError = {
        code: 'permission-denied',
        message: 'Access denied'
      };

      expect(() => handleFirebaseError(firebaseError, 'test')).toThrow(FirebaseError);
    });

    it('should handle validation errors', () => {
      const validationError = new ValidationError('Invalid data');

      expect(() => handleFirebaseError(validationError, 'test')).toThrow(ValidationError);
    });
  });
});