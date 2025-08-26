import { create } from 'zustand';
import { AppState, User, Room, Mod, Vote, LoadingState } from '../types';

// Type guard functions for defensive programming
const isValidMod = (mod: any): mod is Mod => {
  return mod && 
    typeof mod.id === 'string' &&
    typeof mod.roomId === 'string' &&
    typeof mod.name === 'string' &&
    typeof mod.description === 'string' &&
    typeof mod.proposedBy === 'string';
};

const isValidUser = (user: any): user is User => {
  return user && 
    typeof user.uid === 'string' &&
    typeof user.nickname === 'string' &&
    typeof user.isAnonymous === 'boolean';
};

const isValidRoom = (room: any): room is Room => {
  return room && 
    typeof room.id === 'string' &&
    typeof room.hostId === 'string' &&
    typeof room.isHost === 'boolean' &&
    Array.isArray(room.players) &&
    typeof room.status === 'string';
};

const isValidVote = (vote: any): vote is Vote => {
  return vote && 
    typeof vote.id === 'string' &&
    typeof vote.roomId === 'string' &&
    typeof vote.modId === 'string' &&
    typeof vote.userId === 'string' &&
    (vote.vote === 'like' || vote.vote === 'dislike');
};

export const useAppStore = create<AppState>((set) => ({
  // Initialize loading states
  isLoading: {
    user: false,
    room: false,
    mods: false,
  },
  
  // Initialize data with safe defaults
  user: null,
  room: null,
  mods: {
    proposed: [],
    current: null,
    currentIndex: 0,
  },
  votes: {},
  
  // Enhanced setUser with defensive programming
  setUser: (user: User | null) => {
    // Validate user data if not null
    if (user !== null && !isValidUser(user)) {
      console.warn('Invalid user data provided to setUser:', user);
      return;
    }
    
    if (user) {
      const sanitizedUser: User = {
        uid: user.uid,
        nickname: user.nickname,
        isAnonymous: user.isAnonymous,
      };
      set({ user: sanitizedUser });
    } else {
      set({ user: null });
    }
  },
  
  // Enhanced setRoom with defensive programming
  setRoom: (room: Room | null) => {
    // Validate room data if not null
    if (room !== null && !isValidRoom(room)) {
      console.warn('Invalid room data provided to setRoom:', room);
      return;
    }
    
    set({ room });
  },
  
  // Enhanced setMods with defensive data handling
  setMods: (mods: Mod[]) => {
    // Defensive check: ensure mods is an array
    if (!Array.isArray(mods)) {
      console.warn('setMods called with non-array data:', mods);
      // Provide safe fallback
      set((state) => ({
        mods: { ...state.mods, proposed: [] }
      }));
      return;
    }
    
    // Filter out invalid mods and log warnings
    const validMods = mods.filter((mod) => {
      if (!isValidMod(mod)) {
        console.warn('Invalid mod data filtered out:', mod);
        return false;
      }
      return true;
    });
    
    set((state) => ({
      mods: { ...state.mods, proposed: validMods }
    }));
  },
  
  // Enhanced setCurrentMod with defensive programming
  setCurrentMod: (current: Mod | null, currentIndex: number) => {
    // Validate current mod if not null
    if (current !== null && !isValidMod(current)) {
      console.warn('Invalid current mod data provided:', current);
      return;
    }
    
    // Ensure currentIndex is a valid number
    const safeIndex = typeof currentIndex === 'number' && !isNaN(currentIndex) ? currentIndex : 0;
    
    set((state) => ({
      mods: { ...state.mods, current, currentIndex: safeIndex }
    }));
  },
  
  // Enhanced addVote with defensive programming
  addVote: (vote: Vote) => {
    // Validate vote data
    if (!isValidVote(vote)) {
      console.warn('Invalid vote data provided to addVote:', vote);
      return;
    }
    
    set((state) => ({
      votes: { ...state.votes, [vote.id]: vote }
    }));
  },
  
  // New setLoading action for managing loading states
  setLoading: (key: keyof LoadingState, value: boolean) => {
    // Validate key and value
    if (typeof key !== 'string' || typeof value !== 'boolean') {
      console.warn('Invalid parameters provided to setLoading:', { key, value });
      return;
    }
    
    set((state) => ({
      isLoading: { ...state.isLoading, [key]: value }
    }));
  },
  
  // Enhanced resetState with proper defaults
  resetState: () => set({
    isLoading: {
      user: false,
      room: false,
      mods: false,
    },
    user: null,
    room: null,
    mods: { proposed: [], current: null, currentIndex: 0 },
    votes: {},
  }),
}));