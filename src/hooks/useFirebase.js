import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { roomService } from '../services/roomService';
import { modService } from '../services/modService';
import { voteService } from '../services/voteService';

export const useFirebase = () => {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [mods, setMods] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInAnonymous = async () => {
    try {
      await authService.signInAnonymous();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const createRoom = async (nickname) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const roomData = await roomService.createRoom(user.uid, nickname);
      setRoom(roomData);
      
      // Configurar listeners
      setupRoomListeners(roomData.roomId);
      
      return roomData;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  const joinRoom = async (roomId, nickname) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const roomData = await roomService.joinRoom(roomId, user.uid, nickname);
      setRoom({ ...roomData, roomId });
      
      // Configurar listeners
      setupRoomListeners(roomId);
      
      return roomData;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  };

  const setupRoomListeners = (roomId) => {
    // Escuchar cambios en jugadores
    roomService.onPlayersChanged(roomId, setPlayers);
    
    // Escuchar cambios en mods
    modService.onModsChanged(roomId, setMods);
    
    // Escuchar cambios en votos
    voteService.onVotesChanged(roomId, setVotes);
  };

  const proposeMod = async (modData) => {
    try {
      if (!user || !room) throw new Error('User or room not available');
      
      return await modService.proposeMod(room.roomId, user.uid, modData);
    } catch (error) {
      console.error('Error proposing mod:', error);
      throw error;
    }
  };

  const submitVote = async (modId, vote, comment) => {
    try {
      if (!user || !room) throw new Error('User or room not available');
      
      return await voteService.submitVote(room.roomId, modId, user.uid, vote, comment);
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  };

  const getResults = () => {
    return voteService.calculateResults(mods, votes);
  };

  return {
    user,
    room,
    players,
    mods,
    votes,
    loading,
    signInAnonymous,
    createRoom,
    joinRoom,
    proposeMod,
    submitVote,
    getResults
  };
};