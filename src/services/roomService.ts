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

      // Guardar en Firestore
      await setDoc(doc(db, 'rooms', roomId), {
        ...roomData,
        createdAt: roomData.createdAt.toISOString()
      });

      // Agregar host como primer jugador en Realtime Database
      await set(ref(rtdb, `rooms/${roomId}/players/${hostId}`), {
        nickname: hostNickname,
        isHost: true,
        joinedAt: new Date().toISOString(),
        isOnline: true
      });

      return { roomId, ...roomData };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  // Unirse a sala
  async joinRoom(roomId: string, userId: string, nickname: string): Promise<RoomData> {
    try {
      // Verificar si la sala existe
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error('Room not found');
      }

      // Agregar jugador a Realtime Database
      await set(ref(rtdb, `rooms/${roomId}/players/${userId}`), {
        nickname,
        isHost: false,
        joinedAt: new Date().toISOString(),
        isOnline: true
      });

      const data = roomDoc.data();
      return {
        ...data,
        createdAt: new Date(data.createdAt)
      } as RoomData;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },

  // Escuchar cambios en jugadores
  onPlayersChanged(roomId: string, callback: (players: Player[]) => void): () => void {
    const playersRef = ref(rtdb, `rooms/${roomId}/players`);
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const playersData = snapshot.val() || {};
      const players: Player[] = Object.entries(playersData).map(([id, data]: [string, any]) => ({
        id,
        ...data,
        joinedAt: new Date(data.joinedAt)
      }));
      callback(players);
    });
    
    return () => off(playersRef);
  },

  // Actualizar estado de sala
  async updateRoomStatus(roomId: string, status: 'lobby' | 'voting' | 'results'): Promise<void> {
    try {
      await updateDoc(doc(db, 'rooms', roomId), { status });
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  },

  // Salir de sala
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      await remove(ref(rtdb, `rooms/${roomId}/players/${userId}`));
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  }
};