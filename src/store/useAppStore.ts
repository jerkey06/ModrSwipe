import { create } from 'zustand';
import { AppState, User, Room, Mod, Vote } from '../types';

export const useAppStore = create<AppState>((set) => ({
  user: null,
  room: null,
  mods: {
    proposed: [],
    current: null,
    currentIndex: 0,
  },
  votes: {},
  
  setUser: (user: User | null) => set({ user }),
  
  setRoom: (room: Room | null) => set({ room }),
  
  setMods: (proposed: Mod[]) => set((state) => ({
    mods: { ...state.mods, proposed }
  })),
  
  setCurrentMod: (current: Mod | null, currentIndex: number) => set((state) => ({
    mods: { ...state.mods, current, currentIndex }
  })),
  
  addVote: (vote: Vote) => set((state) => ({
    votes: { ...state.votes, [vote.id]: vote }
  })),
  
  resetState: () => set({
    user: null,
    room: null,
    mods: { proposed: [], current: null, currentIndex: 0 },
    votes: {},
  }),
}));