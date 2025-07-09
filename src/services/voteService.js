import { db, rtdb } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { ref, set, onValue, off } from 'firebase/database';

export const voteService = {
  // Registrar voto
  async submitVote(roomId, modId, userId, vote, comment = null) {
    try {
      const voteId = `${userId}_${modId}`;
      
      const voteData = {
        id: voteId,
        roomId,
        modId,
        userId,
        vote, // 'like' | 'dislike'
        comment,
        createdAt: new Date().toISOString()
      };

      // Guardar en Firestore
      await setDoc(doc(db, 'votes', voteId), voteData);

      // Guardar en Realtime Database para actualizaciones en vivo
      await set(ref(rtdb, `rooms/${roomId}/votes/${voteId}`), voteData);

      return voteData;
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  },

  // Escuchar cambios en votos
  onVotesChanged(roomId, callback) {
    const votesRef = ref(rtdb, `rooms/${roomId}/votes`);
    onValue(votesRef, (snapshot) => {
      const votes = snapshot.val() || {};
      callback(Object.entries(votes).map(([id, data]) => ({ id, ...data })));
    });
    return () => off(votesRef);
  },

  // Obtener votos de una sala
  async getRoomVotes(roomId) {
    try {
      const votesQuery = query(
        collection(db, 'votes'),
        where('roomId', '==', roomId)
      );
      
      const snapshot = await getDocs(votesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting room votes:', error);
      throw error;
    }
  },

  // Calcular resultados
  calculateResults(mods, votes) {
    const results = mods.map(mod => {
      const modVotes = votes.filter(vote => vote.modId === mod.id);
      const likes = modVotes.filter(vote => vote.vote === 'like').length;
      const dislikes = modVotes.filter(vote => vote.vote === 'dislike').length;
      const total = likes + dislikes;
      
      return {
        ...mod,
        likes,
        dislikes,
        total,
        percentage: total > 0 ? (likes / total) * 100 : 0,
        comments: modVotes.filter(vote => vote.comment).map(vote => vote.comment)
      };
    });

    return {
      approved: results.filter(mod => mod.percentage >= 50).sort((a, b) => b.likes - a.likes),
      rejected: results.filter(mod => mod.percentage < 50).sort((a, b) => b.dislikes - a.dislikes),
      controversial: results.filter(mod => 
        mod.total > 0 && Math.abs(mod.likes - mod.dislikes) <= 1
      ).sort((a, b) => b.total - a.total)
    };
  }
};