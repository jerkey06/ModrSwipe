export interface User {
  uid: string;
  nickname: string;
  isAnonymous: boolean;
}

export interface Room {
  id: string;
  hostId: string;
  isHost: boolean;
  players: User[];
  status: 'lobby' | 'voting' | 'results';
  createdAt: Date;
}

export interface Mod {
  id: string;
  roomId: string;
  name: string;
  url?: string;
  description: string;
  image?: string;
  proposedBy: string;
  createdAt: Date;
}

export interface Vote {
  id: string;
  roomId: string;
  modId: string;
  userId: string;
  vote: 'like' | 'dislike';
  comment?: string;
}

export interface LoadingState {
  user: boolean;
  room: boolean;
  mods: boolean;
}

export interface AppState {
  // Loading states
  isLoading: LoadingState;
  
  // Data with proper defaults
  user: User | null;
  room: Room | null;
  mods: {
    proposed: Mod[];
    current: Mod | null;
    currentIndex: number;
  };
  votes: Record<string, Vote>;
  
  // Enhanced actions with defensive programming
  setUser: (user: User | null) => void;
  setRoom: (room: Room | null) => void;
  setMods: (mods: Mod[]) => void;
  setCurrentMod: (mod: Mod | null, index: number) => void;
  addVote: (vote: Vote) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  resetState: () => void;
}