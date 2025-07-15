import { db, rtdb } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  remove 
} from 'firebase/database';
import { Room, User } from '../types';
import { 
  validatePlayerData, 
  validateRoomData, 
  handleFirebaseError, 
  safeGetObject, 
  ValidationError,
  withRetry 
} from '../utils/validation';

// Type definitions for service parameters and responses
export interface RoomSettings {
  votingType: 'majority' | 'unanimous';
  allowComments: boolean;
  timePerSwipe: number;
}

export interface RoomData {
  id: string;
  hostId: string;
  createdAt: Date;
  status: 'lobby' | 'voting' | 'results';
  settings: RoomSettings;
}

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  joinedAt: Date;
  isOnline: boolean;
}

export interface RoomServiceInterface {
  createRoom(hostId: string, hostNickname: string): Promise<{ roomId: string } & RoomData>;
  joinRoom(roomId: string, userId: string, nickname: string): Promise<RoomData>;
  onPlayersChanged(roomId: string, callback: (players: Player[]) => void): () => void;
  updateRoomStatus(roomId: string, status: 'lobby' | 'voting' | 'results'): Promise<void>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
}

export const roomService: RoomServiceInterface = {
  // Crear nueva sala
  async createRoom(hostId: string, hostNickname: string): Promise<{ roomId: string } & RoomData> {
    try {
      // Validate input parameters
      if (!hostId || typeof hostId !== 'string') {
        throw new ValidationError('hostId is required and must be a string');
      }
      if (!hostNickname || typeof hostNickname !== 'string') {
        throw new ValidationError('hostNickname is required and must be a string');
      }
      if (hostNickname.trim().length === 0) {
        throw new ValidationError('hostNickname cannot be empty');
      }

      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const roomData: RoomData = {
        id: roomId,
        hostId,
        createdAt: new Date(),
        status: 'lobby',
        settings: {
          votingType: 'majority',
          allowComments: true,
          timePerSwipe: 30
        }
      };

      // Validate the constructed room data
      const validatedRoomData = validateRoomData(roomData);

      // Guardar en Firestore con retry
      await withRetry(
        () => setDoc(doc(db, 'rooms', roomId), {
          ...validatedRoomData,
          createdAt: validatedRoomData.createdAt.toISOString()
        }),
        'createRoom-firestore'
      );

      // Validate and prepare host player data
      const hostPlayerData = {
        nickname: hostNickname.trim(),
        isHost: true,
        joinedAt: new Date().toISOString(),
        isOnline: true
      };

      // Agregar host como primer jugador en Realtime Database con retry
      await withRetry(
        () => set(ref(rtdb, `rooms/${roomId}/players/${hostId}`), hostPlayerData),
        'createRoom-rtdb'
      );

      return { roomId, ...validatedRoomData };
    } catch (error) {
      handleFirebaseError(error, 'createRoom');
    }
  },

  // Unirse a sala
  async joinRoom(roomId: string, userId: string, nickname: string): Promise<RoomData> {
    try {
      // Validate input parameters
      if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required and must be a string');
      }
      if (!userId || typeof userId !== 'string') {
        throw new ValidationError('userId is required and must be a string');
      }
      if (!nickname || typeof nickname !== 'string') {
        throw new ValidationError('nickname is required and must be a string');
      }
      if (nickname.trim().length === 0) {
        throw new ValidationError('nickname cannot be empty');
      }

      // Verificar si la sala existe con retry
      const roomDoc = await withRetry(
        () => getDoc(doc(db, 'rooms', roomId)),
        'joinRoom-getRoom'
      );
      
      if (!roomDoc.exists()) {
        throw new ValidationError('Room not found');
      }

      const roomData = roomDoc.data();
      if (!roomData) {
        throw new ValidationError('Room data is invalid');
      }

      // Validate room data before proceeding
      const validatedRoomData = validateRoomData({ id: roomId, ...roomData });

      // Validate and prepare player data
      const playerData = {
        nickname: nickname.trim(),
        isHost: false,
        joinedAt: new Date().toISOString(),
        isOnline: true
      };

      // Agregar jugador a Realtime Database con retry
      await withRetry(
        () => set(ref(rtdb, `rooms/${roomId}/players/${userId}`), playerData),
        'joinRoom-addPlayer'
      );

      return validatedRoomData;
    } catch (error) {
      handleFirebaseError(error, 'joinRoom');
    }
  },

  // Escuchar cambios en jugadores
  onPlayersChanged(roomId: string, callback: (players: Player[]) => void): () => void {
    try {
      // Validate input parameters
      if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required and must be a string');
      }
      if (!callback || typeof callback !== 'function') {
        throw new ValidationError('callback is required and must be a function');
      }

      const playersRef = ref(rtdb, `rooms/${roomId}/players`);
      
      const unsubscribe = onValue(playersRef, (snapshot) => {
        try {
          const playersData = safeGetObject(snapshot.val(), {});
          const players: Player[] = [];
          
          // Safely process each player entry with validation
          Object.entries(playersData).forEach(([id, data]: [string, any]) => {
            try {
              const validatedPlayer = validatePlayerData(data, id);
              players.push({
                id,
                nickname: validatedPlayer.nickname,
                isHost: validatedPlayer.isHost,
                joinedAt: validatedPlayer.joinedAt,
                isOnline: validatedPlayer.isOnline
              });
            } catch (validationError) {
              console.warn(`Invalid player data for ID ${id}:`, validationError);
              // Continue processing other players instead of failing completely
            }
          });
          
          // Always call callback with validated array (even if empty)
          callback(players);
        } catch (error) {
          console.error('Error processing players data:', error);
          // Provide fallback empty array to prevent UI crashes
          callback([]);
        }
      }, (error) => {
        console.error('Firebase listener error for players:', error);
        // Provide fallback empty array on Firebase errors
        callback([]);
      });
      
      // Return proper cleanup function that removes the specific listener
      return () => {
        try {
          off(playersRef, unsubscribe);
        } catch (error) {
          console.error('Error removing players listener:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up players listener:', error);
      // Return a no-op cleanup function if setup fails
      return () => {};
    }
  },

  // Actualizar estado de sala
  async updateRoomStatus(roomId: string, status: 'lobby' | 'voting' | 'results'): Promise<void> {
    try {
      // Validate input parameters
      if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required and must be a string');
      }
      if (!status || !['lobby', 'voting', 'results'].includes(status)) {
        throw new ValidationError('status must be one of: lobby, voting, results');
      }

      await withRetry(
        () => updateDoc(doc(db, 'rooms', roomId), { status }),
        'updateRoomStatus'
      );
    } catch (error) {
      handleFirebaseError(error, 'updateRoomStatus');
    }
  },

  // Salir de sala
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      // Validate input parameters
      if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required and must be a string');
      }
      if (!userId || typeof userId !== 'string') {
        throw new ValidationError('userId is required and must be a string');
      }

      await withRetry(
        () => remove(ref(rtdb, `rooms/${roomId}/players/${userId}`)),
        'leaveRoom'
      );
    } catch (error) {
      handleFirebaseError(error, 'leaveRoom');
    }
  }
};