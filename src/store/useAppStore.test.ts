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
});