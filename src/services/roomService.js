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

export const roomService = {
  // Crear nueva sala
  async createRoom(hostId, hostNickname) {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const roomData = {
        id: roomId,
        hostId,
        createdAt: new Date().toISOString(),
        status: 'lobby',
        settings: {
          votingType: 'majority',
          allowComments: true,
          timePerSwipe: 30
        }
      };

      // Guardar en Firestore
      await setDoc(doc(db, 'rooms', roomId), roomData);

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
  async joinRoom(roomId, userId, nickname) {
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

      return roomDoc.data();
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },

  // Escuchar cambios en jugadores
  onPlayersChanged(roomId, callback) {
    const playersRef = ref(rtdb, `rooms/${roomId}/players`);
    onValue(playersRef, (snapshot) => {
      const players = snapshot.val() || {};
      callback(Object.entries(players).map(([id, data]) => ({ id, ...data })));
    });
    return () => off(playersRef);
  },

  // Actualizar estado de sala
  async updateRoomStatus(roomId, status) {
    try {
      await updateDoc(doc(db, 'rooms', roomId), { status });
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  },

  // Salir de sala
  async leaveRoom(roomId, userId) {
    try {
      await remove(ref(rtdb, `rooms/${roomId}/players/${userId}`));
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  }
};