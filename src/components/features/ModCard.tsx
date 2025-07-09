import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, User } from 'lucide-react';
import { Mod } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ModCardProps {
  mod: Mod;
  onSwipe?: (direction: 'left' | 'right') => void;
  showActions?: boolean;
}

export const ModCard: React.FC<ModCardProps> = ({ 
  mod, 
  onSwipe, 
  showActions = true 
}) => {
  return (
    <Card className="max-w-md mx-auto">
      <div className="space-y-4">
        {mod.image && (
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={mod.image} 
              alt={mod.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">{mod.name}</h3>
          <p className="text-gray-600">{mod.description}</p>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>Proposed by {mod.proposedBy}</span>
          </div>
          
          {mod.url && (
            <a
              href={mod.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View on CurseForge
            </a>
          )}
        </div>
        
        {showActions && onSwipe && (
          <div className="flex gap-4 pt-4">
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={() => onSwipe('left')}
            >
              ❌ Pass
            </Button>
            <Button
              variant="success"
              size="lg"
              className="flex-1"
              onClick={() => onSwipe('right')}
            >
              ✅ Like
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};