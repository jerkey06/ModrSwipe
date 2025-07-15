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
import { 
  validateModData, 
  handleFirebaseError, 
  safeGetObject, 
  ValidationError,
  withRetry 
} from '../utils/validation';

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
      // Validate input parameters
      if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required and must be a string');
      }
      if (!userId || typeof userId !== 'string') {
        throw new ValidationError('userId is required and must be a string');
      }
      if (!modData || typeof modData !== 'object') {
        throw new ValidationError('modData is required and must be an object');
      }
      if (!modData.name || typeof modData.name !== 'string') {
        throw new ValidationError('modData.name is required and must be a string');
      }
      if (!modData.description || typeof modData.description !== 'string') {
        throw new ValidationError('modData.description is required and must be a string');
      }
      if (modData.url && typeof modData.url !== 'string') {
        throw new ValidationError('modData.url must be a string if provided');
      }
      if (modData.image && typeof modData.image !== 'string') {
        throw new ValidationError('modData.image must be a string if provided');
      }

      const modId = push(ref(rtdb, `rooms/${roomId}/mods`)).key;
      
      if (!modId) {
        throw new ValidationError('Failed to generate mod ID');
      }
      
      const mod: Mod = {
        id: modId,
        roomId,
        name: modData.name.trim(),
        url: modData.url?.trim() || undefined,
        description: modData.description.trim(),
        image: modData.image?.trim() || undefined,
        proposedBy: userId,
        createdAt: new Date()
      };

      // Validate the constructed mod object
      const validatedMod = validateModData(mod);

      // Guardar en Firestore para persistencia con retry
      await withRetry(
        () => setDoc(doc(db, 'mods', modId), {
          ...validatedMod,
          createdAt: validatedMod.createdAt.toISOString()
        }),
        'proposeMod-firestore'
      );

      // Guardar en Realtime Database para actualizaciones en vivo con retry
      await withRetry(
        () => set(ref(rtdb, `rooms/${roomId}/mods/${modId}`), {
          ...validatedMod,
          createdAt: validatedMod.createdAt.toISOString()
        }),
        'proposeMod-rtdb'
      );

      return validatedMod;
    } catch (error) {
      handleFirebaseError(error, 'proposeMod');
    }
  },

  // Escuchar cambios en mods propuestos
  onModsChanged(roomId: string, callback: (mods: Mod[]) => void): () => void {
    try {
      // Validate input parameters
      if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required and must be a string');
      }
      if (!callback || typeof callback !== 'function') {
        throw new ValidationError('callback is required and must be a function');
      }

      const modsRef = ref(rtdb, `rooms/${roomId}/mods`);
      
      const unsubscribe = onValue(modsRef, (snapshot) => {
        try {
          const modsData = safeGetObject(snapshot.val(), {});
          const mods: Mod[] = [];
          
          // Safely process each mod entry with validation
          Object.entries(modsData).forEach(([id, data]: [string, any]) => {
            try {
              const modWithId = { id, ...data };
              const validatedMod = validateModData(modWithId);
              mods.push(validatedMod);
            } catch (validationError) {
              console.warn(`Invalid mod data for ID ${id}:`, validationError);
              // Continue processing other mods instead of failing completely
            }
          });
          
          // Always call callback with validated array (even if empty)
          callback(mods);
        } catch (error) {
          console.error('Error processing mods data:', error);
          // Provide fallback empty array to prevent UI crashes
          callback([]);
        }
      }, (error) => {
        console.error('Firebase listener error for mods:', error);
        // Provide fallback empty array on Firebase errors
        callback([]);
      });
      
      // Return proper cleanup function that removes the specific listener
      return () => {
        try {
          off(modsRef, unsubscribe);
        } catch (error) {
          console.error('Error removing mods listener:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up mods listener:', error);
      // Return a no-op cleanup function if setup fails
      return () => {};
    }
  },

  // Obtener mods de una sala
  async getRoomMods(roomId: string): Promise<Mod[]> {
    try {
      // Validate input parameters
      if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required and must be a string');
      }

      const snapshot = await withRetry(
        () => {
          const modsQuery = query(
            collection(db, 'mods'),
            where('roomId', '==', roomId),
            orderBy('createdAt', 'asc')
          );
          return getDocs(modsQuery);
        },
        'getRoomMods'
      );
      const mods: Mod[] = [];
      
      // Safely process each document with validation
      snapshot.docs.forEach(doc => {
        try {
          const data = doc.data();
          const modWithId = { id: doc.id, ...data };
          const validatedMod = validateModData(modWithId);
          mods.push(validatedMod);
        } catch (validationError) {
          console.warn(`Invalid mod data for document ${doc.id}:`, validationError);
          // Continue processing other mods instead of failing completely
        }
      });
      
      return mods;
    } catch (error) {
      handleFirebaseError(error, 'getRoomMods');
    }
  }
};