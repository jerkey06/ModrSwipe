import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Copy, Check } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerList } from '../components/features/PlayerList';
import { ModProposalForm } from '../components/features/ModProposalForm';
import { ModCard } from '../components/features/ModCard';
import { useAppStore } from '../store/useAppStore';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, room, mods, setMods } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleCopyRoomCode = async () => {
    if (id) {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleModProposal = (modData: {
    name: string;
    url?: string;
    description: string;
    image?: string;
  }) => {
    if (!user || !room) return;
    
    const newMod = {
      id: `mod_${Date.now()}`,
      roomId: room.id,
      name: modData.name,
      url: modData.url,
      description: modData.description,
      image: modData.image,
      proposedBy: user.nickname,
      createdAt: new Date(),
    };
    
    setMods([...mods.proposed, newMod]);
  };

  const handleStartVoting = () => {
    if (mods.proposed.length > 0) {
      navigate(`/room/${id}/swipe`);
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
                  disabled={mods.proposed.length === 0}
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
            <PlayerList 
              players={room.players} 
              hostId={room.hostId}
              currentUserId={user.uid}
            />
          </div>

          {/* Middle Column - Mod Proposal */}
          <div className="lg:col-span-1">
            <ModProposalForm onSubmit={handleModProposal} />
          </div>

          {/* Right Column - Proposed Mods */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Proposed Mods ({mods.proposed.length})
              </h3>
              {mods.proposed.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No mods proposed yet. Be the first to suggest one!
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {mods.proposed.map((mod, index) => (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-gray-900">{mod.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {mod.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        by {mod.proposedBy}
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