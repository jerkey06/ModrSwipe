import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, RotateCcw, Trophy, X, Scale } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { modService } from '../services/modService';
import { voteService } from '../services/voteService';
import { Mod, Vote } from '../types';

interface Result { 
    approved: any[];
    rejected: any[];
    controversial: any[];
}

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { user, room } = useAppStore();
  const [results, setResults] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const fetchResults = async () => {
      try {
        const [mods, votes] = await Promise.all([
          modService.getRoomMods(roomId),
          voteService.getRoomVotes(roomId),
        ]);
        
        const calculatedResults = voteService.calculateResults(mods, votes as Vote[]);
        setResults(calculatedResults);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [roomId]);

  const handleDownloadResults = () => {
    if (!results || !room) return;

    const resultsData = {
      room: room.id,
      timestamp: new Date().toISOString(),
      results: {
        approved: results.approved.map(r => ({ name: r.name, url: r.url, likes: r.likes, dislikes: r.dislikes })),
        rejected: results.rejected.map(r => ({ name: r.name, url: r.url, likes: r.likes, dislikes: r.dislikes })),
        controversial: results.controversial.map(r => ({ name: r.name, url: r.url, likes: r.likes, dislikes: r.dislikes })),
      },
    };
    
    const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modpack-results-${room.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ResultCard = ({ result, icon, iconColor, index }: { result: any; icon: React.ReactNode; iconColor: string; index: number; }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{result.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{result.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-green-600">👍 {result.likes}</span>
            <span className="text-red-600">👎 {result.dislikes}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-600">Calculating results...</p>
        </div>
      </Layout>
    );
  }

  if (!results) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-600">Could not load results.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Voting Results
            </h1>
            <p className="text-gray-600">
              Room {room.id} • {mods.proposed.length} mods voted on
            </p>
          </div>
        </Card>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approved Mods */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Approved ({results.approved.length})
              </h2>
            </div>
            {results.approved.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No mods were approved
              </p>
            ) : (
              <div className="space-y-3">
                {results.approved.map((result, index) => (
                  <ResultCard
                    key={result.mod.id}
                    result={result}
                    icon={<Trophy className="w-4 h-4" />}
                    iconColor="bg-green-100 text-green-600"
                    index={index}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Controversial Mods */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Controversial ({results.controversial.length})
              </h2>
            </div>
            {results.controversial.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No tied votes
              </p>
            ) : (
              <div className="space-y-3">
                {results.controversial.map((result, index) => (
                  <ResultCard
                    key={result.mod.id}
                    result={result}
                    icon={<Scale className="w-4 h-4" />}
                    iconColor="bg-yellow-100 text-yellow-600"
                    index={index}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Rejected Mods */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <X className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Rejected ({results.rejected.length})
              </h2>
            </div>
            {results.rejected.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No mods were rejected
              </p>
            ) : (
              <div className="space-y-3">
                {results.rejected.map((result, index) => (
                  <ResultCard
                    key={result.mod.id}
                    result={result}
                    icon={<X className="w-4 h-4" />}
                    iconColor="bg-red-100 text-red-600"
                    index={index}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleDownloadResults}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Results
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate(`/room/${id}/lobby`)}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            New Round
          </Button>
        </div>
      </div>
    </Layout>
  );
};