import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { authService } from '../services/authService';
import roomService from '../services/roomService';

export const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setRoom } = useAppStore();
  const [formData, setFormData] = useState({
    nickname: '',
    roomCode: '',
  });
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nickname, roomCode } = formData;
    if (!nickname.trim() || !roomCode.trim()) return;

    setIsJoining(true);
    setError('');
    
    try {
      let user = authService.getCurrentUser();
      if (!user) {
        user = await authService.signInAnonymous();
      }

      const roomData = await roomService.joinRoom(roomCode.toUpperCase(), user.uid, nickname.trim());

      const userData = {
        uid: user.uid,
        nickname: nickname.trim(),
        isAnonymous: user.isAnonymous,
      };

      setUser(userData);
      setRoom({
        ...roomData,
        id: roomCode.toUpperCase(),
        isHost: false, // Un usuario que se une nunca es el host
      });
      
      navigate(`/room/${roomCode.toUpperCase()}/lobby`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room. Please check the room code.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Join Room
            </h2>
            <p className="text-gray-600">
              Enter the room code to join a session
            </p>
          </div>
          
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <Input
              label="Your Nickname"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="Enter your nickname"
              required
              maxLength={20}
            />
            
            <Input
              label="Room Code"
              value={formData.roomCode}
              onChange={(e) => setFormData(prev => ({ ...prev, roomCode: e.target.value.toUpperCase() }))}
              placeholder="Enter room code"
              required
              maxLength={6}
              error={error}
            />
            
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!formData.nickname.trim() || !formData.roomCode.trim() || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};