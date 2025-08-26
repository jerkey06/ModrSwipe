import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Users } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { authService } from '../services/authService';
import { roomService } from '../services/roomService';

export const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setRoom } = useAppStore();
  const [nickname, setNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setError(null); // Clear previous errors
    setIsCreating(true);

    try {
      let user = authService.getCurrentUser();
      if (!user) {
        user = await authService.signInAnonymous();
      }

      const userData = {
        uid: user.uid,
        nickname: nickname.trim(),
        isAnonymous: user.isAnonymous,
      };

      setUser(userData);

      const newRoom = await roomService.createRoom(user.uid, nickname.trim());

      setRoom({
        ...newRoom,
        isHost: true,
        players: [userData],
        status: 'lobby',
      });

      setRoomCode(newRoom.roomId);
    } catch (error) {
      console.error("Error creating room:", error);
      setError('Failed to create room. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinLobby = () => {
    navigate(`/room/${roomCode}/lobby`);
  };

  if (roomCode) {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-600 rounded-full mx-auto flex items-center justify-center"
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Room Created!
                </h2>
                <p className="text-gray-600">
                  Share this code with your friends to join
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-green-600">
                    {roomCode}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyCode}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleJoinLobby}
                className="w-full"
              >
                Enter Lobby
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create Room
            </h2>
            <p className="text-gray-600">
              Start a new mod voting session
            </p>
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <Input
              label="Your Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              required
              maxLength={20}
            />

            {error && (
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!nickname.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};