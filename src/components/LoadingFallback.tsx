import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading...', 
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const containerClasses = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} mb-2`} />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

// Specific loading components for different data types
export const ModsLoadingFallback: React.FC = () => (
  <LoadingFallback message="Loading mods..." className="min-h-[200px]" />
);

export const PlayersLoadingFallback: React.FC = () => (
  <LoadingFallback message="Loading players..." className="min-h-[100px]" />
);

export const RoomLoadingFallback: React.FC = () => (
  <LoadingFallback message="Loading room..." size="large" className="min-h-[300px]" />
);

// Empty state components for when data is loaded but empty
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    {icon && (
      <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4 max-w-md">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

export const EmptyModsState: React.FC<{ onAddMod?: () => void }> = ({ onAddMod }) => (
  <EmptyState
    title="No mods yet"
    description="Be the first to propose a mod for this room!"
    action={onAddMod ? { label: 'Add Mod', onClick: onAddMod } : undefined}
    icon={
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    }
  />
);

export const EmptyPlayersState: React.FC = () => (
  <EmptyState
    title="No players"
    description="Waiting for players to join the room..."
    icon={
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    }
  />
);