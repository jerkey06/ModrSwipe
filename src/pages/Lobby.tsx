import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Copy, Check } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerList } from '../components/features/PlayerList';
import { ModProposalForm } from '../components/features/ModProposalForm';
import { FirebaseErrorBoundary, useFirebaseErrorHandler } from '../components/FirebaseErrorBoundary';
import { ErrorNotification, useErrorNotification } from '../components/ErrorNotification';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useAppStore } from '../store/useAppStore';
import { roomService } from '../services/roomService';
import { modService } from '../services/modService';
import { Mod } from '../types';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { user, room, setRoom, mods, setMods, isLoading, setLoading } = useAppStore();
  const [copied, setCopied] = useState(false);
  
  // Error handling hooks
  const { error: firebaseError, handleError, retry, clearError } = useFirebaseErrorHandler();
  const { error: notificationError, showError, dismissError, retryOperation } = useErrorNotification();

  useEffect(() => {
    if (!roomId) return;

    // Set loading states
    setLoading('room', true);
    setLoading('mods', true);

    // Track if component is still mounted to prevent state updates after unmount
    let isMounted = true;

    // Setup players listener with comprehensive error handling
    const setupPlayersListener = async () => {
      try {
        const unsubscribePlayers = roomService.onPlayersChanged(roomId, (players: any) => {
          // Only update state if component is still mounted
          if (!isMounted) return;
          
          try {
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
              clearError(); // Clear any previous errors
            } else {
              console.warn('Invalid players data received:', players);
              setLoading('room', false);
            }
          } catch (error) {
            console.error('Error processing players data:', error);
            handleError(error as Error);
            setLoading('room', false);
          }
        });

        return unsubscribePlayers;
      } catch (error) {
        console.error('Error setting up players listener:', error);
        handleError(error as Error);
        setLoading('room', false);
        return () => {}; // Return no-op cleanup function
      }
    };

    // Setup mods listener with comprehensive error handling
    const setupModsListener = async () => {
      try {
        const unsubscribeMods = modService.onModsChanged(roomId, (proposedMods: any) => {
          // Only update state if component is still mounted
          if (!isMounted) return;
          
          try {
            // Defensive check: ensure proposedMods is an array before calling setMods
            if (Array.isArray(proposedMods)) {
              setMods(proposedMods);
              clearError(); // Clear any previous errors
            } else {
              console.warn('Invalid mods data received:', proposedMods);
              setMods([]); // Provide safe fallback
            }
            setLoading('mods', false);
          } catch (error) {
            console.error('Error processing mods data:', error);
            handleError(error as Error);
            setLoading('mods', false);
          }
        });

        return unsubscribeMods;
      } catch (error) {
        console.error('Error setting up mods listener:', error);
        handleError(error as Error);
        setLoading('mods', false);
        return () => {}; // Return no-op cleanup function
      }
    };

    // Initialize listeners
    let unsubscribePlayers: (() => void) | undefined;
    let unsubscribeMods: (() => void) | undefined;

    Promise.all([
      setupPlayersListener(),
      setupModsListener()
    ]).then(([playersUnsub, modsUnsub]) => {
      if (isMounted) {
        unsubscribePlayers = playersUnsub;
        unsubscribeMods = modsUnsub;
      }
    }).catch((error) => {
      console.error('Error initializing Firebase listeners:', error);
      handleError(error);
      setLoading('room', false);
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
  }, [roomId, setRoom, setMods, setLoading, handleError, clearError]);

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
      showError(error as Error);
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
        showError(error as Error);
      }
    }
  };

  // Retry function for Firebase operations
  const handleRetryFirebaseOperations = async () => {
    if (!roomId) return;
    
    try {
      setLoading('room', true);
      setLoading('mods', true);
      
      // Clear previous errors
      clearError();
      dismissError();
      
      // Force re-initialization of listeners by updating the effect dependency
      window.location.reload();
    } catch (error) {
      console.error('Error during retry:', error);
      showError(error as Error);
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
    <FirebaseErrorBoundary
      onError={(error) => {
        console.error('Lobby Firebase Error:', error);
        showError(error);
      }}
      showHomeButton={true}
    >
      <Layout>
        {/* Connection Status Indicator */}
        <ConnectionStatus showDetails={true} />
        
        {/* Error Notifications */}
        <ErrorNotification
          error={notificationError}
          onDismiss={dismissError}
          onRetry={handleRetryFirebaseOperations}
          autoHide={false}
        />

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
              <FirebaseErrorBoundary>
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
              </FirebaseErrorBoundary>
            </div>

            {/* Middle Column - Mod Proposal */}
            <div className="lg:col-span-1">
              <FirebaseErrorBoundary>
                <ModProposalForm onSubmit={handleModProposal} />
              </FirebaseErrorBoundary>
            </div>

            {/* Right Column - Proposed Mods */}
            <div className="lg:col-span-1">
              <FirebaseErrorBoundary>
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
              </FirebaseErrorBoundary>
            </div>
          </div>
        </div>
      </Layout>
    </FirebaseErrorBoundary>
  );
};