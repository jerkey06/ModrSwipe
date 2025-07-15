import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { modService } from './modService';
import { ValidationError } from '../utils/validation';

// Mock Firebase modules
vi.mock('../config/firebase', () => ({
  db: {},
  rtdb: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn()
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  push: vi.fn(() => ({ key: 'mock-id' }))
}));

vi.mock('../utils/validation', () => ({
  validateModData: vi.fn((data) => data),
  handleFirebaseError: vi.fn((error) => { throw error; }),
  safeGetObject: vi.fn((data, defaultValue) => data || defaultValue),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  withRetry: vi.fn((fn) => fn())
}));

describe('modService - Firebase Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('proposeMod error handling', () => {
    it('should handle invalid roomId parameter', async () => {
      await expect(modService.proposeMod('', 'user1', { name: 'Test', description: 'Test' }))
        .rejects.toThrow(ValidationError);
      
      await expect(modService.proposeMod(null as any, 'user1', { name: 'Test', description: 'Test' }))
        .rejects.toThrow(ValidationError);
      
      await expect(modService.proposeMod(123 as any, 'user1', { name: 'Test', description: 'Test' }))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid userId parameter', async () => {
      await expect(modService.proposeMod('room1', '', { name: 'Test', description: 'Test' }))
        .rejects.toThrow(ValidationError);
      
      await expect(modService.proposeMod('room1', null as any, { name: 'Test', description: 'Test' }))
        .rejects.toThrow(ValidationError);
      
      await expect(modService.proposeMod('room1', 123 as any, { name: 'Test', description: 'Test' }))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid modData parameter', async () => {
      await expect(modService.proposeMod('room1', 'user1', null as any))
        .rejects.toThrow(ValidationError);
      
      await expect(modService.proposeMod('room1', 'user1', 'invalid' as any))
        .rejects.toThrow(ValidationError);
      
      await expect(modService.proposeMod('room1', 'user1', { name: '', description: 'Test' }))
        .rejects.toThrow(ValidationError);
      
      await expect(modService.proposeMod('room1', 'user1', { name: 'Test', description: '' }))
        .rejects.toThrow(ValidationError);
    });

    it('should handle Firebase connection errors', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockRejectedValueOnce(new Error('Firebase connection failed'));

      await expect(modService.proposeMod('room1', 'user1', { name: 'Test', description: 'Test' }))
        .rejects.toThrow('Firebase connection failed');
    });

    it('should handle mod ID generation failure', async () => {
      const { push } = await import('firebase/database');
      vi.mocked(push).mockReturnValueOnce({ key: null } as any);

      await expect(modService.proposeMod('room1', 'user1', { name: 'Test', description: 'Test' }))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('onModsChanged error handling', () => {
    it('should handle invalid roomId parameter', () => {
      expect(() => modService.onModsChanged('', vi.fn())).toThrow(ValidationError);
      expect(() => modService.onModsChanged(null as any, vi.fn())).toThrow(ValidationError);
      expect(() => modService.onModsChanged(123 as any, vi.fn())).toThrow(ValidationError);
    });

    it('should handle invalid callback parameter', () => {
      expect(() => modService.onModsChanged('room1', null as any)).toThrow(ValidationError);
      expect(() => modService.onModsChanged('room1', 'invalid' as any)).toThrow(ValidationError);
      expect(() => modService.onModsChanged('room1', 123 as any)).toThrow(ValidationError);
    });

    it('should handle Firebase listener setup errors', async () => {
      const { onValue } = await import('firebase/database');
      vi.mocked(onValue).mockImplementationOnce(() => {
        throw new Error('Firebase listener setup failed');
      });

      const cleanup = modService.onModsChanged('room1', vi.fn());
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    it('should handle malformed Firebase data gracefully', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Mock safeGetObject to return malformed data
      vi.mocked(safeGetObject).mockReturnValueOnce({
        'mod1': { id: 'mod1', name: 'Valid Mod', description: 'Valid', proposedBy: 'user1', roomId: 'room1', createdAt: new Date() },
        'mod2': { id: 'mod2' }, // Invalid mod - missing required fields
        'mod3': null, // Invalid mod - null value
        'mod4': 'invalid' // Invalid mod - string instead of object
      });

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      // Simulate Firebase data update
      const mockSnapshot = { val: () => ({}) };
      listenerCallback!(mockSnapshot);

      // Should call callback with only valid mods (filtered array)
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should provide fallback empty array on Firebase errors', async () => {
      const { onValue } = await import('firebase/database');
      const mockCallback = vi.fn();
      
      let errorCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref, callback, errorHandler) => {
        errorCallback = errorHandler;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      // Simulate Firebase error
      errorCallback!(new Error('Firebase error'));

      // Should call callback with empty array as fallback
      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should handle cleanup errors gracefully', async () => {
      const { onValue, off } = await import('firebase/database');
      const mockUnsubscribe = vi.fn();
      
      vi.mocked(onValue).mockReturnValueOnce(mockUnsubscribe);
      vi.mocked(off).mockImplementationOnce(() => {
        throw new Error('Cleanup error');
      });

      const cleanup = modService.onModsChanged('room1', vi.fn());
      
      // Should not throw error during cleanup
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('getRoomMods error handling', () => {
    it('should handle invalid roomId parameter', async () => {
      await expect(modService.getRoomMods('')).rejects.toThrow(ValidationError);
      await expect(modService.getRoomMods(null as any)).rejects.toThrow(ValidationError);
      await expect(modService.getRoomMods(123 as any)).rejects.toThrow(ValidationError);
    });

    it('should handle Firebase query errors', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockRejectedValueOnce(new Error('Firebase query failed'));

      await expect(modService.getRoomMods('room1')).rejects.toThrow('Firebase query failed');
    });

    it('should handle malformed document data gracefully', async () => {
      const { withRetry, validateModData } = await import('../utils/validation');
      
      const mockDocs = [
        { id: 'doc1', data: () => ({ name: 'Valid Mod', description: 'Valid', proposedBy: 'user1', roomId: 'room1' }) },
        { id: 'doc2', data: () => ({ name: 'Invalid Mod' }) }, // Missing required fields
        { id: 'doc3', data: () => null } // Null data
      ];

      vi.mocked(withRetry).mockResolvedValueOnce({ docs: mockDocs });
      vi.mocked(validateModData).mockImplementation((data) => {
        if (!data || !data.name || !data.description || !data.proposedBy) {
          throw new ValidationError('Invalid mod data');
        }
        return data;
      });

      const result = await modService.getRoomMods('room1');
      
      // Should only return valid mods, filtering out invalid ones
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Valid Mod');
    });
  });

  describe('Advanced defensive programming scenarios', () => {
    it('should handle extremely large mod datasets', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject, validateModData } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Create large dataset with mixed valid/invalid mods
      const largeMods: Record<string, any> = {};
      for (let i = 0; i < 500; i++) {
        largeMods[`mod${i}`] = i % 4 === 0 ? 
          { id: `mod${i}`, name: `Mod ${i}`, description: `Description ${i}`, proposedBy: 'user1', roomId: 'room1', createdAt: new Date() } : // Valid
          { id: `mod${i}`, name: `Mod ${i}` }; // Invalid - missing fields
      }
      
      vi.mocked(safeGetObject).mockReturnValueOnce(largeMods);
      vi.mocked(validateModData).mockImplementation((data: any) => {
        if (!data || !data.name || !data.description || !data.proposedBy) {
          throw new ValidationError('Invalid mod data');
        }
        return data;
      });

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      const mockSnapshot = { val: () => largeMods };
      listenerCallback!(mockSnapshot);

      // Should handle large dataset and filter appropriately
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
      const callArgs = mockCallback.mock.calls[0][0];
      expect(Array.isArray(callArgs)).toBe(true);
      expect(callArgs.length).toBeLessThan(500); // Should filter out invalid entries
    });

    it('should handle mod data with special characters and edge cases', async () => {
      const specialMods = {
        'mod1': { 
          id: 'mod1', 
          name: 'Mod with "quotes" and \'apostrophes\'', 
          description: 'Description with <script>alert("xss")</script>', 
          proposedBy: 'user1', 
          roomId: 'room1', 
          createdAt: new Date(),
          url: 'https://example.com/mod?param=value&other=test'
        },
        'mod2': { 
          id: 'mod2', 
          name: '🎮 Emoji Mod 🚀', 
          description: 'Unicode: ñáéíóú çüß', 
          proposedBy: 'user2', 
          roomId: 'room1', 
          createdAt: new Date()
        },
        'mod3': { 
          id: 'mod3', 
          name: 'A'.repeat(1000), // Very long name
          description: 'B'.repeat(5000), // Very long description
          proposedBy: 'user3', 
          roomId: 'room1', 
          createdAt: new Date()
        }
      };

      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      vi.mocked(safeGetObject).mockReturnValueOnce(specialMods);

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      const mockSnapshot = { val: () => specialMods };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should handle concurrent mod operations', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockResolvedValue({ id: 'test-mod', roomId: 'room1', name: 'Test', description: 'Test', proposedBy: 'user1', createdAt: new Date() });

      // Simulate multiple concurrent mod proposals
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        modService.proposeMod('room1', `user${i}`, { 
          name: `Concurrent Mod ${i}`, 
          description: `Description ${i}` 
        })
      );

      // All operations should complete without interference
      await expect(Promise.all(concurrentOperations)).resolves.not.toThrow();
    });

    it('should handle memory pressure scenarios', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      
      // Simulate memory pressure by creating large objects
      const memoryIntensiveMods: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        memoryIntensiveMods[`mod${i}`] = {
          id: `mod${i}`,
          name: `Mod ${i}`,
          description: 'x'.repeat(10000), // Large description
          proposedBy: 'user1',
          roomId: 'room1',
          createdAt: new Date(),
          largeData: new Array(1000).fill('data') // Additional large data
        };
      }

      vi.mocked(safeGetObject).mockReturnValueOnce(memoryIntensiveMods);

      const mockCallback = vi.fn();
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      // Should handle large memory usage without crashing
      const mockSnapshot = { val: () => memoryIntensiveMods };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should handle rapid listener setup and teardown', async () => {
      const { onValue, off } = await import('firebase/database');
      const mockUnsubscribe = vi.fn();
      
      vi.mocked(onValue).mockReturnValue(mockUnsubscribe);

      // Rapidly create and destroy listeners
      const cleanupFunctions = [];
      for (let i = 0; i < 50; i++) {
        const cleanup = modService.onModsChanged(`room${i}`, vi.fn());
        cleanupFunctions.push(cleanup);
      }

      // Cleanup all listeners
      expect(() => {
        cleanupFunctions.forEach(cleanup => cleanup());
      }).not.toThrow();
    });
  });

  describe('Network resilience and retry scenarios', () => {
    it('should handle intermittent network failures', async () => {
      const { withRetry } = await import('../utils/validation');
      
      // First call fails, second succeeds
      vi.mocked(withRetry)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'test-mod', roomId: 'room1', name: 'Test', description: 'Test', proposedBy: 'user1', createdAt: new Date() });

      // First attempt should fail
      await expect(modService.proposeMod('room1', 'user1', { name: 'Test', description: 'Test' }))
        .rejects.toThrow('Network error');

      // Second attempt should succeed
      await expect(modService.proposeMod('room1', 'user1', { name: 'Test', description: 'Test' }))
        .resolves.toBeDefined();
    });

    it('should handle Firebase quota exceeded errors', async () => {
      const { withRetry } = await import('../utils/validation');
      const quotaError = new Error('Quota exceeded');
      (quotaError as any).code = 'resource-exhausted';
      
      vi.mocked(withRetry).mockRejectedValueOnce(quotaError);

      await expect(modService.getRoomMods('room1'))
        .rejects.toThrow('Quota exceeded');
    });

    it('should handle database offline scenarios', async () => {
      const { onValue } = await import('firebase/database');
      const mockCallback = vi.fn();
      
      // Simulate database going offline
      let errorCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function, errorHandler: Function) => {
        errorCallback = errorHandler;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      // Simulate offline error
      const offlineError = new Error('Database offline');
      (offlineError as any).code = 'unavailable';
      errorCallback!(offlineError);

      // Should provide fallback empty array when offline
      expect(mockCallback).toHaveBeenCalledWith([]);
    });
  });

  describe('Data validation edge cases', () => {
    it('should handle mods with null/undefined optional fields', async () => {
      const modsWithNullFields = {
        'mod1': { 
          id: 'mod1', 
          name: 'Test Mod', 
          description: 'Test Description', 
          proposedBy: 'user1', 
          roomId: 'room1', 
          createdAt: new Date(),
          url: null, // Null optional field
          image: undefined // Undefined optional field
        }
      };

      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      vi.mocked(safeGetObject).mockReturnValueOnce(modsWithNullFields);

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      const mockSnapshot = { val: () => modsWithNullFields };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should handle mods with invalid date formats', async () => {
      const modsWithInvalidDates = {
        'mod1': { 
          id: 'mod1', 
          name: 'Test Mod', 
          description: 'Test Description', 
          proposedBy: 'user1', 
          roomId: 'room1', 
          createdAt: 'invalid-date-string'
        },
        'mod2': { 
          id: 'mod2', 
          name: 'Test Mod 2', 
          description: 'Test Description 2', 
          proposedBy: 'user2', 
          roomId: 'room1', 
          createdAt: 12345 // Number instead of date
        }
      };

      const { onValue } = await import('firebase/database');
      const { safeGetObject, validateModData } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      vi.mocked(safeGetObject).mockReturnValueOnce(modsWithInvalidDates);
      vi.mocked(validateModData).mockImplementation((data: any) => {
        if (!data || !data.name || !data.description || !data.proposedBy) {
          throw new ValidationError('Invalid mod data');
        }
        // Simulate validation failure for invalid dates
        if (data.createdAt && typeof data.createdAt === 'string' && data.createdAt === 'invalid-date-string') {
          throw new ValidationError('Invalid date format');
        }
        return data;
      });

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      const mockSnapshot = { val: () => modsWithInvalidDates };
      listenerCallback!(mockSnapshot);

      // Should filter out mods with invalid dates
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
      const callArgs = mockCallback.mock.calls[0][0];
      expect(callArgs.length).toBeLessThan(2); // Should filter out invalid entries
    });
  });
});