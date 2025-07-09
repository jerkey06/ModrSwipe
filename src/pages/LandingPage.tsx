import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Users, Sparkles } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-24 h-24 bg-green-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
            >
              <Gamepad2 className="w-12 h-12 text-white" />
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-green-800 mb-4 tracking-tight">
              ModrSwipe
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Swipe mods with friends and vote for the best modpack
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Collaborate</h3>
              <p className="text-sm text-gray-600">
                Create rooms and invite friends to propose mods together
              </p>
            </Card>
            
            <Card className="text-center">
              <Sparkles className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Swipe & Vote</h3>
              <p className="text-sm text-gray-600">
                Use intuitive swipe gestures to vote on each mod proposal
              </p>
            </Card>
            
            <Card className="text-center">
              <Gamepad2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Build Modpack</h3>
              <p className="text-sm text-gray-600">
                Get collective results and download your perfect modpack
              </p>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/room/create')}
              className="px-8 py-4 text-lg"
            >
              Create Room
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/room/join')}
              className="px-8 py-4 text-lg"
            >
              Join Room
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};