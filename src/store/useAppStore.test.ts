import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import { Mod, User, Room, Vote } from '../types';

describe('useAppStore - Defensive Programming', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().resetState();
  });

  describe('setMods defensive handling', () => {
    it('should handle non-array input gracefully', () => {
      // Test with non-array input
      useAppStore.getState().setMods(null as any);
      expect(useAppStore.getState().mods.proposed).toEqual([]);
      
      useAppStore.getState().setMods(undefined as any);
      expect(useAppStore.getState().mods.proposed).toEqual([]);
      
      useAppStore.getState().setMods('invalid' as any);
      expect(useAppStore.getState().mods.proposed).toEqual([]);
    });

    it('should filter out invalid mod objects', () => {
      const validMod: Mod = {
        id: '1',
        roomId: 'room1',
        name: 'Test Mod',
        description: 'Test Description',
        proposedBy: 'user1',
        createdAt: new Date()
      };

      const invalidMods = [
        validMod,
        { id: '2' }, // Missing required fields
        null,
        undefined,
        'invalid',
        { id: '3', roomId: 'room1' } // Still missing required fields
      ];

      useAppStore.getState().setMods(invalidMods as any);
      
      // Should only contain the valid mod
      expect(useAppStore.getState().mods.proposed).toHaveLength(1);
      expect(useAppStore.getState().mods.proposed[0]).toEqual(validMod);
    });

    it('should handle empty array correctly', () => {
      useAppStore.getState().setMods([]);
      expect(useAppStore.getState().mods.proposed).toEqual([]);
    });
  });

  describe('setUser defensive handling', () => {
    it('should handle invalid user data', () => {
      // Test with invalid user data
      useAppStore.getState().setUser({ uid: 'test' } as any); // Missing required fields
      expect(useAppStore.getState().user).toBeNull();
      
      useAppStore.getState().setUser('invalid' as any);
      expect(useAppStore.getState().user).toBeNull();
    });

    it('should accept valid user data', () => {
      const validUser: User = {
        uid: 'user1',
        nickname: 'TestUser',
        isAnonymous: false
      };

      useAppStore.getState().setUser(validUser);
      expect(useAppStore.getState().user).toEqual(validUser);
    });

    it('should accept null user', () => {
      useAppStore.getState().setUser(null);
      expect(useAppStore.getState().user).toBeNull();
    });
  });

  describe('setRoom defensive handling', () => {
    it('should handle invalid room data', () => {
      // Test with invalid room data
      useAppStore.getState().setRoom({ id: 'room1' } as any); // Missing required fields
      expect(useAppStore.getState().room).toBeNull();
      
      useAppStore.getState().setRoom('invalid' as any);
      expect(useAppStore.getState().room).toBeNull();
    });

    it('should accept valid room data', () => {
      const validRoom: Room = {
        id: 'room1',
        hostId: 'user1',
        isHost: true,
        players: [],
        status: 'lobby',
        createdAt: new Date()
      };

      useAppStore.getState().setRoom(validRoom);
      expect(useAppStore.getState().room).toEqual(validRoom);
    });
  });

  describe('setCurrentMod defensive handling', () => {
    it('should handle invalid current mod data', () => {
      // Test with invalid mod data
      useAppStore.getState().setCurrentMod({ id: 'mod1' } as any, 1); // Missing required fields
      expect(useAppStore.getState().mods.current).toBeNull();
      expect(useAppStore.getState().mods.currentIndex).toBe(0); // Should remain unchanged
    });

    it('should handle invalid index values', () => {
      const validMod: Mod = {
        id: '1',
        roomId: 'room1',
        name: 'Test Mod',
        description: 'Test Description',
        proposedBy: 'user1',
        createdAt: new Date()
      };

      // Test with invalid index values
      useAppStore.getState().setCurrentMod(validMod, 'invalid' as any);
      expect(useAppStore.getState().mods.currentIndex).toBe(0); // Should default to 0

      useAppStore.getState().setCurrentMod(validMod, NaN);
      expect(useAppStore.getState().mods.currentIndex).toBe(0); // Should default to 0

      useAppStore.getState().setCurrentMod(validMod, 5);
      expect(useAppStore.getState().mods.currentIndex).toBe(5); // Should accept valid number
    });
  });

  describe('addVote defensive handling', () => {
    it('should handle invalid vote data', () => {
      // Test with invalid vote data
      useAppStore.getState().addVote({ id: 'vote1' } as any); // Missing required fields
      expect(Object.keys(useAppStore.getState().votes)).toHaveLength(0);
      
      useAppStore.getState().addVote('invalid' as any);
      expect(Object.keys(useAppStore.getState().votes)).toHaveLength(0);
    });

    it('should accept valid vote data', () => {
      const validVote: Vote = {
        id: 'vote1',
        roomId: 'room1',
        modId: 'mod1',
        userId: 'user1',
        vote: 'like'
      };

      useAppStore.getState().addVote(validVote);
      expect(useAppStore.getState().votes['vote1']).toEqual(validVote);
    });
  });

  describe('loading state management', () => {
    it('should initialize with all loading states false', () => {
      expect(useAppStore.getState().isLoading.user).toBe(false);
      expect(useAppStore.getState().isLoading.room).toBe(false);
      expect(useAppStore.getState().isLoading.mods).toBe(false);
    });

    it('should update loading states correctly', () => {
      useAppStore.getState().setLoading('user', true);
      expect(useAppStore.getState().isLoading.user).toBe(true);
      expect(useAppStore.getState().isLoading.room).toBe(false);
      expect(useAppStore.getState().isLoading.mods).toBe(false);

      useAppStore.getState().setLoading('mods', true);
      expect(useAppStore.getState().isLoading.user).toBe(true);
      expect(useAppStore.getState().isLoading.mods).toBe(true);

      useAppStore.getState().setLoading('user', false);
      expect(useAppStore.getState().isLoading.user).toBe(false);
      expect(useAppStore.getState().isLoading.mods).toBe(true);
    });

    it('should handle invalid setLoading parameters', () => {
      // Test with invalid parameters
      useAppStore.getState().setLoading('invalid' as any, true);
      useAppStore.getState().setLoading('user', 'invalid' as any);
      
      // Loading states should remain unchanged
      expect(useAppStore.getState().isLoading.user).toBe(false);
      expect(useAppStore.getState().isLoading.room).toBe(false);
      expect(useAppStore.getState().isLoading.mods).toBe(false);
    });
  });

  describe('resetState', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      const validUser: User = { uid: 'user1', nickname: 'Test', isAnonymous: false };
      const validMod: Mod = {
        id: '1',
        roomId: 'room1',
        name: 'Test Mod',
        description: 'Test Description',
        proposedBy: 'user1',
        createdAt: new Date()
      };
      
      useAppStore.getState().setUser(validUser);
      useAppStore.getState().setMods([validMod]);
      useAppStore.getState().setLoading('user', true);
      
      // Reset state
      useAppStore.getState().resetState();
      
      // Verify everything is reset
      expect(useAppStore.getState().user).toBeNull();
      expect(useAppStore.getState().room).toBeNull();
      expect(useAppStore.getState().mods.proposed).toEqual([]);
      expect(useAppStore.getState().mods.current).toBeNull();
      expect(useAppStore.getState().mods.currentIndex).toBe(0);
      expect(useAppStore.getState().votes).toEqual({});
      expect(useAppStore.getState().isLoading.user).toBe(false);
      expect(useAppStore.getState().isLoading.room).toBe(false);
      expect(useAppStore.getState().isLoading.mods).toBe(false);
    });
  });

  describe('Advanced defensive programming scenarios', () => {
    it('should handle extremely large mod arrays', () => {
      // Create a very large array of mods
      const largeMods: Mod[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `mod${i}`,
        roomId: 'room1',
        name: `Mod ${i}`,
        description: `Description ${i}`,
        proposedBy: `user${i % 100}`,
        createdAt: new Date()
      }));

      // Should handle large arrays without performance issues
      expect(() => useAppStore.getState().setMods(largeMods)).not.toThrow();
      expect(useAppStore.getState().mods.proposed).toHaveLength(10000);
    });

    it('should handle mods with circular references', () => {
      // Create mod with circular reference
      const circularMod: any = {
        id: 'circular1',
        roomId: 'room1',
        name: 'Circular Mod',
        description: 'Test Description',
        proposedBy: 'user1',
        createdAt: new Date()
      };
      circularMod.self = circularMod; // Create circular reference

      // Should handle circular references gracefully
      expect(() => useAppStore.getState().setMods([circularMod])).not.toThrow();
    });

    it('should handle concurrent state updates', () => {
      const validMod: Mod = {
        id: '1',
        roomId: 'room1',
        name: 'Test Mod',
        description: 'Test Description',
        proposedBy: 'user1',
        createdAt: new Date()
      };

      // Simulate rapid concurrent updates
      const updates = Array.from({ length: 100 }, (_, i) => 
        () => useAppStore.getState().setMods([{ ...validMod, id: `mod${i}` }])
      );

      // All updates should complete without errors
      expect(() => {
        updates.forEach(update => update());
      }).not.toThrow();
    });

    it('should handle memory pressure with large objects', () => {
      const memoryIntensiveMod: Mod = {
        id: 'memory-test',
        roomId: 'room1',
        name: 'x'.repeat(100000), // Very large name
        description: 'y'.repeat(500000), // Very large description
        proposedBy: 'user1',
        createdAt: new Date()
      };

      // Should handle large objects without crashing
      expect(() => useAppStore.getState().setMods([memoryIntensiveMod])).not.toThrow();
      expect(useAppStore.getState().mods.proposed).toHaveLength(1);
    });

    it('should handle mixed valid and invalid data in arrays', () => {
      const mixedData = [
        // Valid mod
        {
          id: '1',
          roomId: 'room1',
          name: 'Valid Mod',
          description: 'Valid Description',
          proposedBy: 'user1',
          createdAt: new Date()
        },
        // Invalid mod - missing fields
        {
          id: '2',
          name: 'Invalid Mod'
        },
        // Null entry
        null,
        // Undefined entry
        undefined,
        // String instead of object
        'invalid-string',
        // Number instead of object
        12345,
        // Another valid mod
        {
          id: '3',
          roomId: 'room1',
          name: 'Another Valid Mod',
          description: 'Another Valid Description',
          proposedBy: 'user2',
          createdAt: new Date()
        }
      ];

      useAppStore.getState().setMods(mixedData as any);
      
      // Should only contain valid mods
      expect(useAppStore.getState().mods.proposed).toHaveLength(2);
      expect(useAppStore.getState().mods.proposed[0].name).toBe('Valid Mod');
      expect(useAppStore.getState().mods.proposed[1].name).toBe('Another Valid Mod');
    });

    it('should handle deeply nested invalid objects', () => {
      const deeplyNestedInvalid = {
        id: 'nested',
        roomId: 'room1',
        name: {
          nested: {
            deeply: {
              invalid: 'name'
            }
          }
        },
        description: ['array', 'instead', 'of', 'string'],
        proposedBy: { object: 'instead of string' },
        createdAt: new Date()
      };

      useAppStore.getState().setMods([deeplyNestedInvalid as any]);
      
      // Should filter out invalid nested structure
      expect(useAppStore.getState().mods.proposed).toHaveLength(0);
    });

    it('should handle prototype pollution attempts', () => {
      const maliciousData = [
        {
          id: '1',
          roomId: 'room1',
          name: 'Test Mod',
          description: 'Test Description',
          proposedBy: 'user1',
          createdAt: new Date(),
          '__proto__': { polluted: true },
          'constructor': { prototype: { polluted: true } }
        }
      ];

      // Should handle potential prototype pollution gracefully
      expect(() => useAppStore.getState().setMods(maliciousData as any)).not.toThrow();
      
      // Verify prototype wasn't polluted
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('should handle state corruption scenarios', () => {
      // Corrupt the store state directly (simulating external interference)
      const store = useAppStore.getState();
      (store as any).mods = 'corrupted';
      (store as any).user = 12345;
      (store as any).room = [];

      // Store should handle corrupted state gracefully
      expect(() => {
        useAppStore.getState().setMods([]);
        useAppStore.getState().setUser(null);
        useAppStore.getState().setRoom(null);
      }).not.toThrow();
    });

    it('should handle rapid state resets', () => {
      const validMod: Mod = {
        id: '1',
        roomId: 'room1',
        name: 'Test Mod',
        description: 'Test Description',
        proposedBy: 'user1',
        createdAt: new Date()
      };

      // Rapidly set and reset state
      for (let i = 0; i < 1000; i++) {
        useAppStore.getState().setMods([{ ...validMod, id: `mod${i}` }]);
        useAppStore.getState().resetState();
      }

      // Final state should be clean
      expect(useAppStore.getState().mods.proposed).toEqual([]);
      expect(useAppStore.getState().user).toBeNull();
      expect(useAppStore.getState().room).toBeNull();
    });

    it('should handle edge cases in vote validation', () => {
      const edgeCaseVotes = [
        // Valid vote
        {
          id: 'vote1',
          roomId: 'room1',
          modId: 'mod1',
          userId: 'user1',
          vote: 'like' as const
        },
        // Invalid vote value
        {
          id: 'vote2',
          roomId: 'room1',
          modId: 'mod1',
          userId: 'user1',
          vote: 'invalid' as any
        },
        // Missing required fields
        {
          id: 'vote3',
          vote: 'dislike' as const
        } as any,
        // Null vote
        null,
        // String instead of object
        'invalid-vote'
      ];

      edgeCaseVotes.forEach(vote => {
        if (vote) {
          useAppStore.getState().addVote(vote as any);
        }
      });

      // Should only contain valid vote
      expect(Object.keys(useAppStore.getState().votes)).toHaveLength(1);
      expect(useAppStore.getState().votes['vote1']).toBeDefined();
      expect(useAppStore.getState().votes['vote1'].vote).toBe('like');
    });
  });

  describe('Type safety and validation edge cases', () => {
    it('should handle user objects with extra properties', () => {
      const userWithExtraProps = {
        uid: 'user1',
        nickname: 'TestUser',
        isAnonymous: false,
        extraProp: 'should be ignored',
        anotherExtra: { nested: 'object' }
      };

      useAppStore.getState().setUser(userWithExtraProps as any);
      expect(useAppStore.getState().user).toEqual({
        uid: 'user1',
        nickname: 'TestUser',
        isAnonymous: false
      });
    });

    it('should handle room objects with missing optional properties', () => {
      const minimalRoom = {
        id: 'room1',
        hostId: 'user1',
        isHost: true,
        players: [],
        status: 'lobby',
        createdAt: new Date()
        // Missing optional properties
      };

      useAppStore.getState().setRoom(minimalRoom);
      expect(useAppStore.getState().room).toEqual(minimalRoom);
    });

    it('should handle type coercion attempts', () => {
      // Attempt to set non-boolean values that could be coerced
      const coercibleUser = {
        uid: 'user1',
        nickname: 'TestUser',
        isAnonymous: 'false' // String instead of boolean
      };

      useAppStore.getState().setUser(coercibleUser as any);
      // Should reject due to type mismatch
      expect(useAppStore.getState().user).toBeNull();
    });

    it('should handle array-like objects that are not arrays', () => {
      const arrayLikeObject = {
        0: { id: '1', roomId: 'room1', name: 'Mod 1', description: 'Desc 1', proposedBy: 'user1', createdAt: new Date() },
        1: { id: '2', roomId: 'room1', name: 'Mod 2', description: 'Desc 2', proposedBy: 'user2', createdAt: new Date() },
        length: 2
      };

      useAppStore.getState().setMods(arrayLikeObject as any);
      // Should reject non-array input
      expect(useAppStore.getState().mods.proposed).toEqual([]);
    });
  });
});