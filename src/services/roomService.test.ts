import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { roomService } from './roomService';
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
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  push: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  remove: vi.fn()
}));

vi.mock('../utils/validation', () => ({
  validatePlayerData: vi.fn((data: any, id: string) => ({ ...data, uid: id })),
  validateRoomData: vi.fn((data: any) => data),
  handleFirebaseError: vi.fn((error: any) => { throw error; }),
  safeGetObject: vi.fn((data: any, defaultValue: any) => data || defaultValue),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  withRetry: vi.fn((fn: any) => fn())
}));

describe('roomService - Firebase Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRoom error handling', () => {
    it('should handle invalid hostId parameter', async () => {
      await expect(roomService.createRoom('', 'TestHost'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.createRoom(null as any, 'TestHost'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.createRoom(123 as any, 'TestHost'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid hostNickname parameter', async () => {
      await expect(roomService.createRoom('host1', ''))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.createRoom('host1', '   '))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.createRoom('host1', null as any))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.createRoom('host1', 123 as any))
        .rejects.toThrow(ValidationError);
    });

    it('should handle Firestore write errors', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockRejectedValueOnce(new Error('Firestore write failed'));

      await expect(roomService.createRoom('host1', 'TestHost'))
        .rejects.toThrow('Firestore write failed');
    });

    it('should handle Realtime Database write errors', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry)
        .mockResolvedValueOnce(undefined) // First call (Firestore) succeeds
        .mockRejectedValueOnce(new Error('RTDB write failed')); // Second call (RTDB) fails

      await expect(roomService.createRoom('host1', 'TestHost'))
        .rejects.toThrow('RTDB write failed');
    });
  });

  describe('joinRoom error handling', () => {
    it('should handle invalid roomId parameter', async () => {
      await expect(roomService.joinRoom('', 'user1', 'TestUser'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.joinRoom(null as any, 'user1', 'TestUser'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.joinRoom(123 as any, 'user1', 'TestUser'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid userId parameter', async () => {
      await expect(roomService.joinRoom('room1', '', 'TestUser'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.joinRoom('room1', null as any, 'TestUser'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.joinRoom('room1', 123 as any, 'TestUser'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid nickname parameter', async () => {
      await expect(roomService.joinRoom('room1', 'user1', ''))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.joinRoom('room1', 'user1', '   '))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.joinRoom('room1', 'user1', null as any))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.joinRoom('room1', 'user1', 123 as any))
        .rejects.toThrow(ValidationError);
    });

    it('should handle room not found scenario', async () => {
      const { withRetry } = await import('../utils/validation');
      const mockDoc = { exists: () => false };
      vi.mocked(withRetry).mockResolvedValueOnce(mockDoc);

      await expect(roomService.joinRoom('nonexistent', 'user1', 'TestUser'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid room data', async () => {
      const { withRetry } = await import('../utils/validation');
      const mockDoc = { 
        exists: () => true, 
        data: () => null 
      };
      vi.mocked(withRetry).mockResolvedValueOnce(mockDoc);

      await expect(roomService.joinRoom('room1', 'user1', 'TestUser'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle Firebase read errors', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockRejectedValueOnce(new Error('Firebase read failed'));

      await expect(roomService.joinRoom('room1', 'user1', 'TestUser'))
        .rejects.toThrow('Firebase read failed');
    });
  });

  describe('onPlayersChanged error handling', () => {
    it('should handle invalid roomId parameter', () => {
      expect(() => roomService.onPlayersChanged('', vi.fn())).toThrow(ValidationError);
      expect(() => roomService.onPlayersChanged(null as any, vi.fn())).toThrow(ValidationError);
      expect(() => roomService.onPlayersChanged(123 as any, vi.fn())).toThrow(ValidationError);
    });

    it('should handle invalid callback parameter', () => {
      expect(() => roomService.onPlayersChanged('room1', null as any)).toThrow(ValidationError);
      expect(() => roomService.onPlayersChanged('room1', 'invalid' as any)).toThrow(ValidationError);
      expect(() => roomService.onPlayersChanged('room1', 123 as any)).toThrow(ValidationError);
    });

    it('should handle Firebase listener setup errors', async () => {
      const { onValue } = await import('firebase/database');
      vi.mocked(onValue).mockImplementationOnce(() => {
        throw new Error('Firebase listener setup failed');
      });

      const cleanup = roomService.onPlayersChanged('room1', vi.fn());
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    it('should handle malformed player data gracefully', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject, validatePlayerData } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Mock safeGetObject to return malformed data
      vi.mocked(safeGetObject).mockReturnValueOnce({
        'player1': { nickname: 'Valid Player', isHost: true, isOnline: true, joinedAt: new Date() },
        'player2': { nickname: 'Invalid Player' }, // Missing required fields
        'player3': null, // Invalid player - null value
        'player4': 'invalid' // Invalid player - string instead of object
      });

      vi.mocked(validatePlayerData).mockImplementation((data: any, id: string) => {
        if (!data || !data.nickname || typeof data.isHost !== 'boolean') {
          throw new ValidationError('Invalid player data');
        }
        return { ...data, uid: id };
      });

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      roomService.onPlayersChanged('room1', mockCallback);

      // Simulate Firebase data update
      const mockSnapshot = { val: () => ({}) };
      listenerCallback!(mockSnapshot);

      // Should call callback with only valid players (filtered array)
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

      roomService.onPlayersChanged('room1', mockCallback);

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

      const cleanup = roomService.onPlayersChanged('room1', vi.fn());
      
      // Should not throw error during cleanup
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('updateRoomStatus error handling', () => {
    it('should handle invalid roomId parameter', async () => {
      await expect(roomService.updateRoomStatus('', 'voting'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.updateRoomStatus(null as any, 'voting'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.updateRoomStatus(123 as any, 'voting'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid status parameter', async () => {
      await expect(roomService.updateRoomStatus('room1', '' as any))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.updateRoomStatus('room1', 'invalid' as any))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.updateRoomStatus('room1', null as any))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.updateRoomStatus('room1', 123 as any))
        .rejects.toThrow(ValidationError);
    });

    it('should handle Firebase update errors', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockRejectedValueOnce(new Error('Firebase update failed'));

      await expect(roomService.updateRoomStatus('room1', 'voting'))
        .rejects.toThrow('Firebase update failed');
    });
  });

  describe('leaveRoom error handling', () => {
    it('should handle invalid roomId parameter', async () => {
      await expect(roomService.leaveRoom('', 'user1'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.leaveRoom(null as any, 'user1'))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.leaveRoom(123 as any, 'user1'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle invalid userId parameter', async () => {
      await expect(roomService.leaveRoom('room1', ''))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.leaveRoom('room1', null as any))
        .rejects.toThrow(ValidationError);
      
      await expect(roomService.leaveRoom('room1', 123 as any))
        .rejects.toThrow(ValidationError);
    });

    it('should handle Firebase remove errors', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockRejectedValueOnce(new Error('Firebase remove failed'));

      await expect(roomService.leaveRoom('room1', 'user1'))
        .rejects.toThrow('Firebase remove failed');
    });
  });

  describe('Network and connection error scenarios', () => {
    it('should handle network timeout errors', async () => {
      const { withRetry } = await import('../utils/validation');
      const timeoutError = new Error('Network timeout');
      (timeoutError as any).code = 'timeout';
      
      vi.mocked(withRetry).mockRejectedValueOnce(timeoutError);

      await expect(roomService.createRoom('host1', 'TestHost'))
        .rejects.toThrow('Network timeout');
    });

    it('should handle permission denied errors', async () => {
      const { withRetry } = await import('../utils/validation');
      const permissionError = new Error('Permission denied');
      (permissionError as any).code = 'permission-denied';
      
      vi.mocked(withRetry).mockRejectedValueOnce(permissionError);

      await expect(roomService.joinRoom('room1', 'user1', 'TestUser'))
        .rejects.toThrow('Permission denied');
    });

    it('should handle service unavailable errors', async () => {
      const { withRetry } = await import('../utils/validation');
      const unavailableError = new Error('Service unavailable');
      (unavailableError as any).code = 'unavailable';
      
      vi.mocked(withRetry).mockRejectedValueOnce(unavailableError);

      await expect(roomService.updateRoomStatus('room1', 'voting'))
        .rejects.toThrow('Service unavailable');
    });
  });

  describe('Data corruption and edge cases', () => {
    it('should handle corrupted Firebase snapshot data', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Mock corrupted data that causes safeGetObject to throw
      vi.mocked(safeGetObject).mockImplementationOnce(() => {
        throw new Error('Data corruption detected');
      });

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      roomService.onPlayersChanged('room1', mockCallback);

      // Simulate corrupted Firebase data
      const corruptedSnapshot = { val: () => 'corrupted-data' };
      listenerCallback!(corruptedSnapshot);

      // Should provide fallback empty array even with data corruption
      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should handle extremely large player datasets gracefully', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject, validatePlayerData } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Create a large dataset with mixed valid/invalid players
      const largePlayerSet: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largePlayerSet[`player${i}`] = i % 3 === 0 ? 
          { nickname: `Player${i}`, isHost: false, isOnline: true, joinedAt: new Date() } : // Valid
          { nickname: `Player${i}` }; // Invalid - missing fields
      }
      
      vi.mocked(safeGetObject).mockReturnValueOnce(largePlayerSet);
      vi.mocked(validatePlayerData).mockImplementation((data: any, id: string) => {
        if (!data || !data.nickname || typeof data.isHost !== 'boolean') {
          throw new ValidationError('Invalid player data');
        }
        return { ...data, uid: id };
      });

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      roomService.onPlayersChanged('room1', mockCallback);

      // Simulate large dataset update
      const mockSnapshot = { val: () => largePlayerSet };
      listenerCallback!(mockSnapshot);

      // Should handle large dataset and filter out invalid entries
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
      const callArgs = mockCallback.mock.calls[0][0];
      expect(Array.isArray(callArgs)).toBe(true);
      // Should have filtered out invalid entries (only ~333 valid out of 1000)
      expect(callArgs.length).toBeLessThan(1000);
    });

    it('should handle circular reference data structures', async () => {
      const { onValue } = await import('firebase/database');
      const { safeGetObject } = await import('../utils/validation');
      const mockCallback = vi.fn();
      
      // Create circular reference (this would normally cause JSON.stringify to fail)
      const circularData: any = { player1: { nickname: 'Test' } };
      circularData.player1.self = circularData.player1;
      
      vi.mocked(safeGetObject).mockReturnValueOnce(circularData);

      let listenerCallback: Function;
      vi.mocked(onValue).mockImplementationOnce((ref: any, callback: Function) => {
        listenerCallback = callback;
        return vi.fn();
      });

      roomService.onPlayersChanged('room1', mockCallback);

      // Should handle circular references without crashing
      const mockSnapshot = { val: () => circularData };
      expect(() => listenerCallback!(mockSnapshot)).not.toThrow();
      
      // Should provide fallback array
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('Concurrent operation handling', () => {
    it('should handle multiple simultaneous listener setups', async () => {
      const { onValue } = await import('firebase/database');
      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();
      const mockCallback3 = vi.fn();
      
      vi.mocked(onValue).mockReturnValue(vi.fn());

      // Setup multiple listeners simultaneously
      const cleanup1 = roomService.onPlayersChanged('room1', mockCallback1);
      const cleanup2 = roomService.onPlayersChanged('room1', mockCallback2);
      const cleanup3 = roomService.onPlayersChanged('room1', mockCallback3);

      // All should return cleanup functions
      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');
      expect(typeof cleanup3).toBe('function');

      // Cleanup should not throw errors
      expect(() => {
        cleanup1();
        cleanup2();
        cleanup3();
      }).not.toThrow();
    });

    it('should handle rapid successive room operations', async () => {
      const { withRetry } = await import('../utils/validation');
      vi.mocked(withRetry).mockResolvedValue(undefined);

      // Perform multiple operations rapidly
      const operations = [
        roomService.updateRoomStatus('room1', 'voting'),
        roomService.updateRoomStatus('room1', 'results'),
        roomService.updateRoomStatus('room1', 'lobby')
      ];

      // All operations should complete without throwing
      await expect(Promise.all(operations)).resolves.not.toThrow();
    });
  });
});