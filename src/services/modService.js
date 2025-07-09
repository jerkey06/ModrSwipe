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

export const modService = {
  // Proponer nuevo mod
  async proposeMod(roomId, userId, modData) {
    try {
      const modId = push(ref(rtdb, `rooms/${roomId}/mods`)).key;
      
      const mod = {
        id: modId,
        roomId,
        name: modData.name,
        url: modData.url,
        description: modData.description,
        image: modData.image || null,
        proposedBy: userId,
        createdAt: new Date().toISOString()
      };

      // Guardar en Firestore para persistencia
      await setDoc(doc(db, 'mods', modId), mod);

      // Guardar en Realtime Database para actualizaciones en vivo
      await set(ref(rtdb, `rooms/${roomId}/mods/${modId}`), mod);

      return mod;
    } catch (error) {
      console.error('Error proposing mod:', error);
      throw error;
    }
  },

  // Escuchar cambios en mods propuestos
  onModsChanged(roomId, callback) {
    const modsRef = ref(rtdb, `rooms/${roomId}/mods`);
    onValue(modsRef, (snapshot) => {
      const mods = snapshot.val() || {};
      callback(Object.entries(mods).map(([id, data]) => ({ id, ...data })));
    });
    return () => off(modsRef);
  },

  // Obtener mods de una sala
  async getRoomMods(roomId) {
    try {
      const modsQuery = query(
        collection(db, 'mods'),
        where('roomId', '==', roomId),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(modsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting room mods:', error);
      throw error;
    }
  }
};