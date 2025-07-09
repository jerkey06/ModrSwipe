import React from 'react';
import { motion } from 'framer-motion';
import { User, Crown } from 'lucide-react';
import { User as UserType } from '../../types';
import { Card } from '../ui/Card';

interface PlayerListProps {
  players: UserType[];
  hostId: string;
  currentUserId?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  hostId, 
  currentUserId 
}) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Players ({players.length})
      </h3>
      <div className="space-y-3">
        {players.map((player, index) => (
          <motion.div
            key={player.uid}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {player.nickname}
                </span>
                {player.uid === hostId && (
                  <Crown className="w-4 h-4 text-yellow-500" />
                )}
                {player.uid === currentUserId && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};