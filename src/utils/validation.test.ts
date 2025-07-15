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

  describe('Advanced validation scenarios', () => {
    it('should handle mod data with extreme values', () => {
      const extremeMod = {
        id: 'x'.repeat(1000), // Very long ID
        roomId: 'y'.repeat(500), // Very long room ID
        name: '', // Empty name should fail
        description: 'z'.repeat(100000), // Very long description
        proposedBy: 'user1',
        createdAt: new Date()
      };

      expect(() => validateModData(extremeMod)).toThrow(ValidationError);
    });

    it('should handle mod data with special characters', () => {
      const specialCharMod = {
        id: 'mod-123',
        roomId: 'room-456',
        name: 'Mod with "quotes" and \'apostrophes\' & symbols',
        description: 'Description with <script>alert("xss")</script> and unicode: ñáéíóú',
        proposedBy: 'user-123',
        createdAt: new Date(),
        url: 'https://example.com/mod?param=value&other=test#fragment',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      };

      const result = validateModData(specialCharMod);
      expect(result.name).toBe('Mod with "quotes" and \'apostrophes\' & symbols');
      expect(result.url).toBe('https://example.com/mod?param=value&other=test#fragment');
    });

    it('should handle player data with edge case values', () => {
      const edgeCasePlayer = {
        nickname: 'A'.repeat(100), // Very long nickname
        isHost: false,
        isOnline: true,
        joinedAt: new Date('1970-01-01') // Very old date
      };

      const result = validatePlayerData(edgeCasePlayer, 'player-123');
      expect(result.nickname).toBe('A'.repeat(100));
      expect(result.joinedAt.getFullYear()).toBe(1970);
    });

    it('should handle room data with various status values', () => {
      const validStatuses = ['lobby', 'voting', 'results'];
      
      validStatuses.forEach(status => {
        const roomData = {
          id: 'room-123',
          hostId: 'user-123',
          status,
          createdAt: new Date()
        };

        const result = validateRoomData(roomData);
        expect(result.status).toBe(status);
      });

      // Test invalid status
      const invalidRoom = {
        id: 'room-123',
        hostId: 'user-123',
        status: 'invalid-status',
        createdAt: new Date()
      };

      expect(() => validateRoomData(invalidRoom)).toThrow(ValidationError);
    });

    it('should handle date parsing edge cases', () => {
      const dateEdgeCases = [
        '2023-12-31T23:59:59.999Z', // End of year
        '2024-01-01T00:00:00.000Z', // Start of year
        '2024-02-29T12:00:00.000Z', // Leap year
        '1970-01-01T00:00:00.000Z', // Unix epoch
        '2038-01-19T03:14:07.000Z'  // Near 32-bit timestamp limit
      ];

      dateEdgeCases.forEach(dateString => {
        const modData = {
          id: 'test-mod',
          roomId: 'test-room',
          name: 'Test Mod',
          description: 'Test Description',
          proposedBy: 'test-user',
          createdAt: dateString
        };

        const result = validateModData(modData);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.createdAt.toISOString()).toBe(dateString);
      });
    });

    it('should handle malformed date strings', () => {
      const invalidDates = [
        'not-a-date',
        '2023-13-01', // Invalid month
        '2023-02-30', // Invalid day for February
        '2023-01-32', // Invalid day
        '', // Empty string
        '2023/01/01', // Wrong format
        '01-01-2023' // Wrong format
      ];

      invalidDates.forEach(invalidDate => {
        const modData = {
          id: 'test-mod',
          roomId: 'test-room',
          name: 'Test Mod',
          description: 'Test Description',
          proposedBy: 'test-user',
          createdAt: invalidDate
        };

        expect(() => validateModData(modData)).toThrow(ValidationError);
      });
    });

    it('should handle null and undefined values in required fields', () => {
      const fieldsToTest = ['id', 'roomId', 'name', 'description', 'proposedBy'];
      
      fieldsToTest.forEach(field => {
        const modData = {
          id: 'test-id',
          roomId: 'test-room',
          name: 'Test Mod',
          description: 'Test Description',
          proposedBy: 'test-user',
          createdAt: new Date()
        };

        // Test null value
        (modData as any)[field] = null;
        expect(() => validateModData(modData)).toThrow(ValidationError);

        // Test undefined value
        (modData as any)[field] = undefined;
        expect(() => validateModData(modData)).toThrow(ValidationError);

        // Test empty string
        (modData as any)[field] = '';
        expect(() => validateModData(modData)).toThrow(ValidationError);
      });
    });

    it('should handle type coercion attempts', () => {
      const coercionAttempts = [
        { field: 'id', value: 123 },
        { field: 'roomId', value: true },
        { field: 'name', value: [] },
        { field: 'description', value: {} },
        { field: 'proposedBy', value: Symbol('test') }
      ];

      coercionAttempts.forEach(({ field, value }) => {
        const modData = {
          id: 'test-id',
          roomId: 'test-room',
          name: 'Test Mod',
          description: 'Test Description',
          proposedBy: 'test-user',
          createdAt: new Date()
        };

        (modData as any)[field] = value;
        expect(() => validateModData(modData)).toThrow(ValidationError);
      });
    });
  });

  describe('Safe data access edge cases', () => {
    it('should handle circular references in objects', () => {
      const circularObj: any = { prop: 'value' };
      circularObj.self = circularObj;

      const result = safeGetObject(circularObj, { default: true });
      expect(result).toBe(circularObj);
      expect(result.prop).toBe('value');
    });

    it('should handle arrays with holes', () => {
      const sparseArray = new Array(10);
      sparseArray[0] = 'first';
      sparseArray[9] = 'last';

      const result = safeGetArray(sparseArray, []);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10);
      expect(result[0]).toBe('first');
      expect(result[9]).toBe('last');
    });

    it('should handle frozen and sealed objects', () => {
      const frozenObj = Object.freeze({ frozen: true });
      const sealedObj = Object.seal({ sealed: true });

      expect(safeGetObject(frozenObj, { default: true })).toBe(frozenObj);
      expect(safeGetObject(sealedObj, { default: true })).toBe(sealedObj);
    });

    it('should handle objects with null prototype', () => {
      const nullProtoObj = Object.create(null);
      nullProtoObj.prop = 'value';

      const result = safeGetObject(nullProtoObj, { default: true });
      expect(result).toBe(nullProtoObj);
      expect(result.prop).toBe('value');
    });

    it('should handle extremely large arrays', () => {
      const largeArray = new Array(1000000).fill('item');
      
      const result = safeGetArray(largeArray, []);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1000000);
    });

    it('should handle strings that look like other types', () => {
      const stringNumbers = ['123', '0', '-456', '3.14', 'NaN', 'Infinity'];
      const stringBooleans = ['true', 'false', 'TRUE', 'FALSE'];
      const stringObjects = ['{}', '[]', 'null', 'undefined'];

      [...stringNumbers, ...stringBooleans, ...stringObjects].forEach(str => {
        expect(safeGetString(str, 'default')).toBe(str);
        expect(safeGetArray(str, [])).toEqual([]);
        expect(safeGetObject(str, { default: true })).toEqual({ default: true });
      });
    });
  });

  describe('Firebase error handling comprehensive scenarios', () => {
    it('should handle all Firebase error codes', () => {
      const firebaseErrorCodes = [
        'permission-denied',
        'not-found',
        'network-request-failed',
        'timeout',
        'unavailable',
        'cancelled',
        'deadline-exceeded',
        'already-exists',
        'resource-exhausted',
        'failed-precondition',
        'aborted',
        'out-of-range',
        'unimplemented',
        'internal',
        'data-loss',
        'unauthenticated'
      ];

      firebaseErrorCodes.forEach(code => {
        const firebaseError = {
          code,
          message: `Test error for ${code}`
        };

        expect(() => handleFirebaseError(firebaseError, 'test')).toThrow(FirebaseError);
      });
    });

    it('should handle unknown Firebase error codes', () => {
      const unknownError = {
        code: 'unknown-error-code',
        message: 'Unknown error'
      };

      expect(() => handleFirebaseError(unknownError, 'test')).toThrow(FirebaseError);
    });

    it('should handle errors without codes', () => {
      const genericError = new Error('Generic error without code');

      expect(() => handleFirebaseError(genericError, 'test')).toThrow(FirebaseError);
    });

    it('should handle nested error objects', () => {
      const nestedError = {
        code: 'permission-denied',
        message: 'Access denied',
        details: {
          reason: 'insufficient-permissions',
          resource: 'rooms/test-room'
        },
        originalError: new Error('Original cause')
      };

      expect(() => handleFirebaseError(nestedError, 'test')).toThrow(FirebaseError);
    });

    it('should handle error objects with circular references', () => {
      const circularError: any = {
        code: 'internal',
        message: 'Internal error'
      };
      circularError.self = circularError;

      expect(() => handleFirebaseError(circularError, 'test')).toThrow(FirebaseError);
    });
  });

  describe('Memory and performance edge cases', () => {
    it('should handle validation of extremely large datasets', () => {
      // Test with large valid mod
      const largeMod = {
        id: 'large-mod',
        roomId: 'test-room',
        name: 'Large Mod',
        description: 'x'.repeat(1000000), // 1MB description
        proposedBy: 'test-user',
        createdAt: new Date()
      };

      expect(() => validateModData(largeMod)).not.toThrow();
    });

    it('should handle rapid successive validations', () => {
      const validMod = {
        id: 'test-mod',
        roomId: 'test-room',
        name: 'Test Mod',
        description: 'Test Description',
        proposedBy: 'test-user',
        createdAt: new Date()
      };

      // Perform 1000 rapid validations
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          validateModData({ ...validMod, id: `mod-${i}` });
        }
      }).not.toThrow();
    });

    it('should handle validation with memory pressure', () => {
      // Create objects that consume significant memory
      const memoryIntensiveObjects = Array.from({ length: 100 }, (_, i) => ({
        id: `mod-${i}`,
        roomId: 'test-room',
        name: `Mod ${i}`,
        description: 'x'.repeat(10000), // 10KB each
        proposedBy: 'test-user',
        createdAt: new Date(),
        largeData: new Array(1000).fill(`data-${i}`)
      }));

      // Should handle memory-intensive validation without crashing
      expect(() => {
        memoryIntensiveObjects.forEach(obj => validateModData(obj));
      }).not.toThrow();
    });
  });
});