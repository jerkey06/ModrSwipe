import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import TinderCard from 'react-tinder-card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { modService } from '../services/modService';
import { voteService } from '../services/voteService';
import { Mod } from '../types';

export const SwipePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { user, room, mods, setMods, addVote } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const fetchMods = async () => {
      try {
        const proposedMods = await modService.getRoomMods(roomId);
        setMods({ ...mods, proposed: proposedMods });
      } catch (error) {
        console.error("Error fetching mods:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMods();
  }, [roomId, setMods]);

  const swiped = (direction: string, mod: Mod) => {
    if (!user || !roomId) return;

    const voteType = direction === 'right' ? 'like' : 'dislike';
    voteService.submitVote(roomId, mod.id, user.uid, voteType);
    addVote({ modId: mod.id, vote: voteType });
    setLastDirection(direction);

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    if (nextIndex >= mods.proposed.length) {
      navigate(`/room/${roomId}/results`);
    }
  };

  const swipe = (dir: 'left' | 'right') => {
    const cardsLeft = mods.proposed.filter(m => !mods.votes[m.id]);
    if (cardsLeft.length > 0) {
      const modToSwipe = cardsLeft[0];
      swiped(dir, modToSwipe);
    }
  };

  const progress = mods.proposed.length > 0 ? 
    (currentIndex / mods.proposed.length) * 100 : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-600">Loading mods...</p>
        </div>
      </Layout>
    );
  }

  if (mods.proposed.length === 0) {
    return (
      <Layout>
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              No Mods to Vote On
            </h2>
            <p className="text-gray-600 mb-6">
              The voting session hasn't started or there are no mods.
            </p>
            <Button onClick={() => navigate(`/room/${roomId}/lobby`)}>
              Back to Lobby
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }
  
  const card = mods.proposed[currentIndex];

  if (!card) {
    return (
        <Layout>
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Voting Finished!
              </h2>
              <p className="text-gray-600 mb-6">
                You have voted on all the mods.
              </p>
              <Button onClick={() => navigate(`/room/${roomId}/results`)}>
                Go to Results
              </Button>
            </Card>
          </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-green-600 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Progress Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Mod {currentIndex + 1} of {mods.proposed.length}
          </p>
        </div>

        {/* Swipe Cards */}
        <div className="relative h-96 flex items-center justify-center">
            <TinderCard
              key={card.id}
              onSwipe={(dir) => swiped(dir, card)}
              preventSwipe={['up', 'down']}
              className="absolute w-full max-w-sm"
            >
              <Card className="cursor-grab active:cursor-grabbing">
                <div className="space-y-4">
                  {card.image && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={card.image} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">{card.name}</h3>
                    <p className="text-gray-600">{card.description}</p>
                    <p className="text-sm text-gray-500">
                      Proposed by {card.proposedBy}
                    </p>
                  </div>
                </div>
              </Card>
            </TinderCard>
        </div>

        {/* Swipe Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            variant="danger"
            size="lg"
            onClick={() => swipe('left')}
            className="w-16 h-16 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <Button
            variant="success"
            size="lg"
            onClick={() => swipe('right')}
            className="w-16 h-16 rounded-full flex items-center justify-center"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Last Action Feedback */}
        {lastDirection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600">
              {lastDirection === 'right' ? '✅ Liked!' : '❌ Passed'}
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};