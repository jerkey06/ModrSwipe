import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import TinderCard from 'react-tinder-card';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';

export const SwipePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, room, mods, setCurrentMod, addVote } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState<string>('');

  useEffect(() => {
    if (mods.proposed.length > 0) {
      setCurrentMod(mods.proposed[0], 0);
    }
  }, [mods.proposed, setCurrentMod]);

  const handleSwipe = (direction: string, mod: any) => {
    if (!user || !room) return;

    const vote = {
      id: `vote_${Date.now()}`,
      roomId: room.id,
      modId: mod.id,
      userId: user.uid,
      vote: direction === 'right' ? 'like' as const : 'dislike' as const,
    };

    addVote(vote);
    setLastDirection(direction);

    const nextIndex = currentIndex + 1;
    if (nextIndex < mods.proposed.length) {
      setCurrentIndex(nextIndex);
      setCurrentMod(mods.proposed[nextIndex], nextIndex);
    } else {
      // All mods voted, go to results
      navigate(`/room/${id}/results`);
    }
  };

  const handleButtonClick = (direction: 'left' | 'right') => {
    if (mods.current) {
      handleSwipe(direction, mods.current);
    }
  };

  const progress = mods.proposed.length > 0 ? 
    ((currentIndex + 1) / mods.proposed.length) * 100 : 0;

  if (!user || !room) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
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
              There are no mods proposed for this room yet.
            </p>
            <Button onClick={() => navigate(`/room/${id}/lobby`)}>
              Back to Lobby
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
          {mods.proposed.slice(currentIndex, currentIndex + 2).map((mod, index) => (
            <TinderCard
              key={mod.id}
              onSwipe={(dir) => handleSwipe(dir, mod)}
              preventSwipe={['up', 'down']}
              className="absolute w-full max-w-sm"
            >
              <div className={`${index === 0 ? 'z-10' : 'z-0'}`}>
                <Card className="cursor-grab active:cursor-grabbing">
                  <div className="space-y-4">
                    {mod.image && (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={mod.image} 
                          alt={mod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">{mod.name}</h3>
                      <p className="text-gray-600">{mod.description}</p>
                      <p className="text-sm text-gray-500">
                        Proposed by {mod.proposedBy}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </TinderCard>
          ))}
        </div>

        {/* Swipe Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            variant="danger"
            size="lg"
            onClick={() => handleButtonClick('left')}
            className="w-16 h-16 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <Button
            variant="success"
            size="lg"
            onClick={() => handleButtonClick('right')}
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