import React from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showHeader = true 
}) => {
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/backgrounds/Dirt_background_JE2.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {showHeader && (
        <header className="bg-white shadow-sm border-b border-gray-200 bg-opacity-90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a
                href="/"
                className="text-2xl font-bold text-green-800 transition-colors hover:text-green-600"
                aria-label="Ir al menú principal"
              >
                ModrSwipe
              </a>
            </div>
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};