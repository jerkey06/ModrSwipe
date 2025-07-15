import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw, Pickaxe } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Minecraft-style 404 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <div className="text-8xl md:text-9xl font-minecraft text-[#F2E205] drop-shadow-[4px_4px_0_#403C01] mb-4">
              404
            </div>
            <div className="text-2xl md:text-3xl font-minecraft text-[#F2E205] drop-shadow-[2px_2px_0_#403C01] mb-2">
              Chunk Not Found
            </div>
            <div className="text-lg md:text-xl font-minecraft text-[#E1E0E1] drop-shadow-[2px_2px_0_#393938]">
              This area hasn't been generated yet!
            </div>
          </motion.div>

          {/* Minecraft block animation */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-center items-center gap-2 mb-6">
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  y: [0, -10, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 bg-gradient-to-br from-[#8B4513] to-[#654321] border-4 border-[#2D1810] relative"
                style={{
                  boxShadow: 'inset 4px 4px 0 0 #A0522D, inset -4px -4px 0 0 #5D4037'
                }}
              >
                <Pickaxe className="w-8 h-8 text-[#C0C0C0] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </motion.div>
            </div>
          </motion.div>

          <Card className="bg-[#2D2D2D] border-4 border-[#8B8B8B] shadow-[inset_4px_4px_0_0_#C6C6C6,inset_-4px_-4px_0_0_#404040]">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-minecraft text-[#E1E0E1] drop-shadow-[2px_2px_0_#393938] mb-4">
                  Looks like you've wandered into uncharted territory!
                </h2>
                <p className="text-[#C6C6C6] font-minecraft text-sm drop-shadow-[1px_1px_0_#393938]">
                  The page you're looking for doesn't exist in this world.
                  <br />
                  Maybe it was destroyed by a Creeper? 💥
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Return to Spawn
                </Button>
                
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Go Back
                </Button>
              </div>

              {/* Minecraft-style tips */}
              <div className="bg-[#1A1A1A] border-2 border-[#555555] p-4 rounded">
                <div className="text-[#55FF55] font-minecraft text-sm drop-shadow-[1px_1px_0_#003300] mb-2">
                  💡 Tip:
                </div>
                <div className="text-[#C6C6C6] font-minecraft text-xs drop-shadow-[1px_1px_0_#393938]">
                  Try using the navigation menu or create a new room to start your mod voting adventure!
                </div>
              </div>
            </div>
          </Card>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-[#F2E205] opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, -100],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};