import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';

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
    if (!formData.nickname.trim() || !formData.roomCode.trim()) return;

    setIsJoining(true);
    setError('');
    
    try {
      // Simulate room joining
      const userId = `user_${Date.now()}`;
      
      const user = {
        uid: userId,
        nickname: formData.nickname.trim(),
        isAnonymous: true,
      };
      
      // In a real app, you would fetch the room data from Firebase
      const room = {
        id: formData.roomCode.toUpperCase(),
        hostId: 'host_id', // Would be fetched from Firebase
        isHost: false,
        players: [user], // Would include existing players
        status: 'lobby' as const,
        createdAt: new Date(),
      };
      
      setUser(user);
      setRoom(room);
      
      navigate(`/room/${formData.roomCode.toUpperCase()}/lobby`);
    } catch (err) {
      setError('Failed to join room. Please check the room code.');
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