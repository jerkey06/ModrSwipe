import { db, rtdb } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { ref, set, onValue, off, push } from 'firebase/database';
import { Mod } from '../types';

// Type definitions for service parameters
export interface ModData {
  name: string;
  url?: string;
  description: string;
  image?: string;
}

export interface ModServiceInterface {
  proposeMod(roomId: string, userId: string, modData: ModData): Promise<Mod>;
  onModsChanged(roomId: string, callback: (mods: Mod[]) => void): () => void;
  getRoomMods(roomId: string): Promise<Mod[]>;
}

export const modService: ModServiceInterface = {
  // Proponer nuevo mod
  async proposeMod(roomId: string, userId: string, modData: ModData): Promise<Mod> {
    try {
      const modId = push(ref(rtdb, `rooms/${roomId}/mods`)).key;
      
      if (!modId) {
        throw new Error('Failed to generate mod ID');
      }
      
      const mod: Mod = {
        id: modId,
        roomId,
        name: modData.name,
        url: modData.url,
        description: modData.description,
        image: modData.image || undefined,
        proposedBy: userId,
        createdAt: new Date()
      };

      // Guardar en Firestore para persistencia
      await setDoc(doc(db, 'mods', modId), {
        ...mod,
        createdAt: mod.createdAt.toISOString()
      });

      // Guardar en Realtime Database para actualizaciones en vivo
      await set(ref(rtdb, `rooms/${roomId}/mods/${modId}`), {
        ...mod,
        createdAt: mod.createdAt.toISOString()
      });

      return mod;
    } catch (error) {
      console.error('Error proposing mod:', error);
      throw error;
    }
  },

  // Escuchar cambios en mods propuestos
  onModsChanged(roomId: string, callback: (mods: Mod[]) => void): () => void {
    const modsRef = ref(rtdb, `rooms/${roomId}/mods`);
    
    const unsubscribe = onValue(modsRef, (snapshot) => {
      const modsData = snapshot.val() || {};
      const mods: Mod[] = Object.entries(modsData).map(([id, data]: [string, any]) => ({
        id,
        ...data,
        createdAt: new Date(data.createdAt)
      }));
      callback(mods);
    });
    
    return () => off(modsRef);
  },

  // Obtener mods de una sala
  async getRoomMods(roomId: string): Promise<Mod[]> {
    try {
      const modsQuery = query(
        collection(db, 'mods'),
        where('roomId', '==', roomId),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(modsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: new Date(data.createdAt)
        } as Mod;
      });
    } catch (error) {
      console.error('Error getting room mods:', error);
      throw error;
    }
  }
};