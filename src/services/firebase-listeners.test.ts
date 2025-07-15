import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { roomService } from './roomService';
import { modService } from './modService';

// Mock Firebase modules
vi.mock('../config/firebase', () => ({
  db: {},
  rtdb: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn()
}));

vi.mock('../utils/validation', () => ({
  validatePlayerData: vi.fn(),
  validateModData: vi.fn(),
  safeGetObject: vi.fn(),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
}));

describe('Firebase Listeners - Defensive Programming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Firebase listener resilience', () => {
    it('should handle listener callback exceptions gracefully', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      
      // Mock callback that throws an error
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback processing error');
      });
      
      vi.mocked(safeGetObject).mockReturnValue({});
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      // Setup listener with faulty callback
      const cleanup = roomService.onPlayersChanged('room1', faultyCallback);
      
      // Simulate Firebase data update - should not crash despite callback error
      const mockSnapshot = { val: () => ({}) };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      
      // Cleanup should still work
      expect(() => cleanup()).not.toThrow();
    });

    it('should handle Firebase snapshot with corrupted data structure', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Mock corrupted snapshot data
      const corruptedData = {
        // Mix of valid and corrupted entries
        'valid_player': { nickname: 'Valid', isHost: true, isOnline: true, joinedAt: new Date() },
        'corrupted_1': { toString: () => { throw new Error('toString error'); } },
        'corrupted_2': new Proxy({}, { get: () => { throw new Error('Proxy error'); } }),
        'corrupted_3': Object.create(null, { 
          prop: { 
            get: () => { throw new Error('Getter error'); },
            enumerable: true 
          }
        })
      };
      
      vi.mocked(safeGetObject).mockReturnValue(corruptedData);
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      roomService.onPlayersChanged('room1', mockCallback);

      // Should handle corrupted data without crashing
      const mockSnapshot = { val: () => corruptedData };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      
      // Should still call callback (likely with fallback data)
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle rapid successive Firebase updates', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject, validatePlayerData } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      vi.mocked(safeGetObject).mockReturnValue({
        'player1': { nickname: 'Player1', isHost: true, isOnline: true, joinedAt: new Date() }
      });
      vi.mocked(validatePlayerData).mockReturnValue({
        uid: 'player1',
        nickname: 'Player1',
        isAnonymous: true,
        isHost: true,
        isOnline: true,
        joinedAt: new Date()
      });
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      roomService.onPlayersChanged('room1', mockCallback);

      // Simulate rapid successive updates
      const mockSnapshot = { val: () => ({}) };
      for (let i = 0; i < 100; i++) {
        listenerCallback!(mockSnapshot);
      }

      // Should handle all updates without issues
      expect(mockCallback).toHaveBeenCalledTimes(100);
    });

    it('should handle Firebase listener setup during network instability', async () => {
      const { onValue } = await import('firebase/database');
      
      // Simulate network instability by having onValue throw intermittently
      let callCount = 0;
      vi.mocked(onValue).mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          throw new Error('Network unstable');
        }
        return vi.fn();
      });

      // Multiple attempts to setup listeners
      const cleanupFunctions = [];
      for (let i = 0; i < 10; i++) {
        try {
          const cleanup = roomService.onPlayersChanged(`room${i}`, vi.fn());
          cleanupFunctions.push(cleanup);
        } catch (error) {
          // Some setups may fail due to network instability
          expect(error.message).toBe('Network unstable');
        }
      }

      // Successful setups should have working cleanup functions
      cleanupFunctions.forEach(cleanup => {
        expect(() => cleanup()).not.toThrow();
      });
    });

    it('should handle Firebase listener with memory leaks prevention', async () => {
      const { onValue, off } = await import('firebase/database');
      const mockUnsubscribe = vi.fn();
      
      vi.mocked(onValue).mockReturnValue(mockUnsubscribe);
      
      // Create many listeners rapidly
      const cleanupFunctions = [];
      for (let i = 0; i < 1000; i++) {
        const cleanup = modService.onModsChanged(`room${i}`, vi.fn());
        cleanupFunctions.push(cleanup);
      }

      // Cleanup all listeners - should not cause memory issues
      expect(() => {
        cleanupFunctions.forEach(cleanup => cleanup());
      }).not.toThrow();

      // Verify off was called for each listener
      expect(vi.mocked(off)).toHaveBeenCalledTimes(1000);
    });
  });

  describe('Data processing edge cases', () => {
    it('should handle Firebase data with prototype pollution attempts', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Malicious data attempting prototype pollution
      const maliciousData = {
        'normal_mod': {
          id: 'mod1',
          name: 'Normal Mod',
          description: 'Normal Description',
          proposedBy: 'user1',
          roomId: 'room1',
          createdAt: new Date()
        },
        '__proto__': {
          polluted: true
        },
        'constructor': {
          prototype: {
            polluted: true
          }
        }
      };
      
      vi.mocked(safeGetObject).mockReturnValue(maliciousData);
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      const mockSnapshot = { val: () => maliciousData };
      listenerCallback!(mockSnapshot);

      // Should process data without prototype pollution
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle Firebase data with extremely deep nesting', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Create deeply nested object
      let deepObject: any = { id: 'deep-mod' };
      for (let i = 0; i < 1000; i++) {
        deepObject = { nested: deepObject };
      }
      
      const dataWithDeepNesting = {
        'normal_mod': {
          id: 'mod1',
          name: 'Normal Mod',
          description: 'Normal Description',
          proposedBy: 'user1',
          roomId: 'room1',
          createdAt: new Date()
        },
        'deep_mod': deepObject
      };
      
      vi.mocked(safeGetObject).mockReturnValue(dataWithDeepNesting);
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      // Should handle deep nesting without stack overflow
      const mockSnapshot = { val: () => dataWithDeepNesting };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle Firebase data with binary and special data types', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Data with various special types
      const specialData = {
        'buffer_data': Buffer.from('test data'),
        'uint8_array': new Uint8Array([1, 2, 3, 4]),
        'date_object': new Date(),
        'regex_object': /test-pattern/gi,
        'function_object': function() { return 'test'; },
        'symbol_key': Symbol('test'),
        'bigint_value': BigInt(123456789),
        'normal_mod': {
          id: 'mod1',
          name: 'Normal Mod',
          description: 'Normal Description',
          proposedBy: 'user1',
          roomId: 'room1',
          createdAt: new Date()
        }
      };
      
      vi.mocked(safeGetObject).mockReturnValue(specialData);
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      // Should handle special data types without crashing
      const mockSnapshot = { val: () => specialData };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle Firebase data with circular references in arrays', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Create circular reference in array-like structure
      const circularArray: any = [
        { id: 'mod1', name: 'Mod 1' },
        { id: 'mod2', name: 'Mod 2' }
      ];
      circularArray.push(circularArray); // Circular reference
      
      const dataWithCircularArray = {
        'mods': circularArray,
        'normal_mod': {
          id: 'mod3',
          name: 'Normal Mod',
          description: 'Normal Description',
          proposedBy: 'user1',
          roomId: 'room1',
          createdAt: new Date()
        }
      };
      
      vi.mocked(safeGetObject).mockReturnValue(dataWithCircularArray);
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      // Should handle circular references in arrays
      const mockSnapshot = { val: () => dataWithCircularArray };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Concurrent listener operations', () => {
    it('should handle multiple listeners on same room simultaneously', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      
      const callbacks = Array.from({ length: 10 }, () => vi.fn());
      const cleanupFunctions: (() => void)[] = [];
      
      vi.mocked(safeGetObject).mockReturnValue({});
      vi.mocked(onValue).mockReturnValue(vi.fn());

      // Setup multiple listeners on same room
      callbacks.forEach(callback => {
        const cleanup = roomService.onPlayersChanged('room1', callback);
        cleanupFunctions.push(cleanup);
      });

      // All listeners should be set up successfully
      expect(vi.mocked(onValue)).toHaveBeenCalledTimes(10);

      // Cleanup all listeners
      cleanupFunctions.forEach(cleanup => {
        expect(() => cleanup()).not.toThrow();
      });
    });

    it('should handle listener setup and teardown race conditions', async () => {
      const { onValue, off } = await import('firebase/database');
      const mockUnsubscribe = vi.fn();
      
      vi.mocked(onValue).mockReturnValue(mockUnsubscribe);

      // Rapidly create and destroy listeners
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(async () => {
          const cleanup = modService.onModsChanged(`room${i}`, vi.fn());
          // Immediately cleanup to create race condition
          setTimeout(() => cleanup(), Math.random() * 10);
        });
      }

      // All operations should complete without errors
      await expect(Promise.all(operations.map(op => op()))).resolves.not.toThrow();
    });

    it('should handle Firebase reconnection scenarios', async () => {
      const { onValue } = await import('firebase/database');
      const mockCallback = vi.fn();
      
      // Simulate Firebase reconnection by having listener fail then succeed
      let attemptCount = 0;
      vi.mocked(onValue).mockImplementation((ref: any, callback: Function, errorHandler?: Function) => {
        attemptCount++;
        
        if (attemptCount <= 3) {
          // Simulate connection failure
          setTimeout(() => {
            if (errorHandler) {
              errorHandler(new Error('Connection lost'));
            }
          }, 10);
        } else {
          // Simulate successful reconnection
          setTimeout(() => {
            callback({ val: () => ({}) });
          }, 10);
        }
        
        return vi.fn();
      });

      // Setup listener that will experience reconnection
      const cleanup = roomService.onPlayersChanged('room1', mockCallback);

      // Wait for reconnection attempts
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should eventually succeed and call callback
      expect(mockCallback).toHaveBeenCalled();
      
      // Cleanup should work
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('Error recovery and fallback mechanisms', () => {
    it('should provide fallback data when validation fails for all entries', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject, validateModData } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // All data is invalid
      const invalidData = {
        'invalid1': { id: 'mod1' }, // Missing required fields
        'invalid2': { name: 'Mod 2' }, // Missing required fields
        'invalid3': null,
        'invalid4': 'string-instead-of-object'
      };
      
      vi.mocked(safeGetObject).mockReturnValue(invalidData);
      vi.mocked(validateModData).mockImplementation(() => {
        throw new Error('Validation failed');
      });
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      const mockSnapshot = { val: () => invalidData };
      listenerCallback!(mockSnapshot);

      // Should call callback with empty array as fallback
      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should handle partial data corruption gracefully', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject, validateModData } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      const mixedData = {
        'valid1': { id: 'mod1', name: 'Valid Mod 1', description: 'Desc 1', proposedBy: 'user1', roomId: 'room1', createdAt: new Date() },
        'corrupted1': { id: 'mod2' }, // Invalid
        'valid2': { id: 'mod3', name: 'Valid Mod 2', description: 'Desc 2', proposedBy: 'user2', roomId: 'room1', createdAt: new Date() },
        'corrupted2': null // Invalid
      };
      
      vi.mocked(safeGetObject).mockReturnValue(mixedData);
      vi.mocked(validateModData).mockImplementation((data: any) => {
        if (!data || !data.name || !data.description) {
          throw new Error('Validation failed');
        }
        return data;
      });
      
      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      modService.onModsChanged('room1', mockCallback);

      const mockSnapshot = { val: () => mixedData };
      listenerCallback!(mockSnapshot);

      // Should call callback with only valid entries
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
      const callArgs = mockCallback.mock.calls[0][0];
      expect(callArgs.length).toBe(2); // Only valid entries
    });

    it('should handle Firebase service degradation', async () => {
      const { onValue } = await import('firebase/database');
      const mockCallback = vi.fn();
      
      // Simulate service degradation with intermittent failures
      let callCount = 0;
      vi.mocked(onValue).mockImplementation((ref: any, callback: Function, errorHandler?: Function) => {
        callCount++;
        
        if (callCount % 2 === 0 && errorHandler) {
          // Simulate intermittent service errors
          setTimeout(() => {
            errorHandler(new Error('Service temporarily unavailable'));
          }, 10);
        } else {
          // Simulate successful data retrieval
          setTimeout(() => {
            callback({ val: () => ({}) });
          }, 10);
        }
        
        return vi.fn();
      });

      // Setup multiple listeners during service degradation
      const cleanupFunctions = [];
      for (let i = 0; i < 10; i++) {
        const cleanup = roomService.onPlayersChanged(`room${i}`, mockCallback);
        cleanupFunctions.push(cleanup);
      }

      // Wait for service interactions
      await new Promise(resolve => setTimeout(resolve, 100));

      // Some callbacks should have been called despite service issues
      expect(mockCallback).toHaveBeenCalled();

      // All cleanup functions should work
      cleanupFunctions.forEach(cleanup => {
        expect(() => cleanup()).not.toThrow();
      });
    });
  });
});