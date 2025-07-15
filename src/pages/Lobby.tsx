import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Copy, Check } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerList } from '../components/features/PlayerList';
import { ModProposalForm } from '../components/features/ModProposalForm';
import { useAppStore } from '../store/useAppStore';
import { roomService } from '../services/roomService';
import { modService } from '../services/modService';
import { Mod } from '../types';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { user, room, setRoom, mods, setMods, isLoading, setLoading } = useAppStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // Set loading states
    setLoading('room', true);
    setLoading('mods', true);

    // Track if component is still mounted to prevent state updates after unmount
    let isMounted = true;

    // Setup players listener with proper error handling
    const unsubscribePlayers = roomService.onPlayersChanged(roomId, (players: any) => {
      // Only update state if component is still mounted
      if (!isMounted) return;
      
      // Defensive check: ensure players is an array
      if (Array.isArray(players)) {
        // Update room with new players data, preserving existing room data
        setRoom((currentRoom) => {
          if (currentRoom) {
            return { ...currentRoom, players };
          }
          return currentRoom;
        });
        setLoading('room', false);
      } else {
        console.warn('Invalid players data received:', players);
        setLoading('room', false);
      }
    });

    // Setup mods listener with proper error handling
    const unsubscribeMods = modService.onModsChanged(roomId, (proposedMods: any) => {
      // Only update state if component is still mounted
      if (!isMounted) return;
      
      // Defensive check: ensure proposedMods is an array before calling setMods
      if (Array.isArray(proposedMods)) {
        setMods(proposedMods);
      } else {
        console.warn('Invalid mods data received:', proposedMods);
        setMods([]); // Provide safe fallback
      }
      setLoading('mods', false);
    });

    // Cleanup function with proper listener cleanup
    return () => {
      isMounted = false;
      
      // Ensure cleanup functions exist before calling them
      if (typeof unsubscribePlayers === 'function') {
        try {
          unsubscribePlayers();
        } catch (error) {
          console.error('Error cleaning up players listener:', error);
        }
      }
      
      if (typeof unsubscribeMods === 'function') {
        try {
          unsubscribeMods();
        } catch (error) {
          console.error('Error cleaning up mods listener:', error);
        }
      }
    };
  }, [roomId, setRoom, setMods, setLoading]); // Removed 'room' from dependencies to prevent unnecessary re-runs

  const handleCopyRoomCode = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleModProposal = async (modData: Omit<Mod, 'id' | 'proposedBy' | 'createdAt' | 'roomId'>) => {
    if (!user || !roomId) return;
    
    try {
      await modService.proposeMod(roomId, user.uid, modData);
    } catch (error) {
      console.error("Error proposing mod:", error);
    }
  };

  const handleStartVoting = async () => {
    // Defensive check: ensure mods.proposed exists and is an array before checking length
    if (mods?.proposed && Array.isArray(mods.proposed) && mods.proposed.length > 0 && roomId) {
      try {
        await roomService.updateRoomStatus(roomId, 'swiping');
        navigate(`/room/${roomId}/swipe`);
      } catch (error) {
        console.error("Error starting voting:", error);
      }
    }
  };

  if (!user || !room) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Room Header */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Room {room.id}
              </h2>
              <p className="text-gray-600">
                Waiting for players to propose mods
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyRoomCode}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              {room.isHost && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartVoting}
                  disabled={!mods?.proposed || !Array.isArray(mods.proposed) || mods.proposed.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Voting
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Players */}
          <div className="lg:col-span-1">
            {isLoading.room ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading players...</p>
                </div>
              </Card>
            ) : (
              <PlayerList 
                players={room.players || []} 
                hostId={room.hostId}
                currentUserId={user.uid}
              />
            )}
          </div>

          {/* Middle Column - Mod Proposal */}
          <div className="lg:col-span-1">
            <ModProposalForm onSubmit={handleModProposal} />
          </div>

          {/* Right Column - Proposed Mods */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Proposed Mods ({mods?.proposed && Array.isArray(mods.proposed) ? mods.proposed.length : 0})
              </h3>
              {isLoading.mods ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading mods...</p>
                </div>
              ) : !mods?.proposed || !Array.isArray(mods.proposed) || mods.proposed.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No mods proposed yet. Be the first to suggest one!
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {mods.proposed.map((mod, index) => (
                    <motion.div
                      key={mod?.id || `mod-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-gray-900">{mod?.name || 'Unnamed Mod'}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {mod?.description || 'No description provided'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        by {mod?.proposedBy || 'Unknown'}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};