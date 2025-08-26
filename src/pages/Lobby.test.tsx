/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Lobby } from './Lobby';
import { useAppStore } from '../store/useAppStore';
import { Mod, User, Room } from '../types';

// Mock the store
vi.mock('../store/useAppStore');

// Mock services
vi.mock('../services/roomService', () => ({
  roomService: {
    onPlayersChanged: vi.fn(() => vi.fn()),
    updateRoomStatus: vi.fn()
  }
}));

vi.mock('../services/modService', () => ({
  modService: {
    onModsChanged: vi.fn(() => vi.fn()),
    proposeMod: vi.fn()
  }
}));

// Mock components to focus on data handling logic
vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
}));

vi.mock('../components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>
}));

vi.mock('../components/ui/Button', () => ({
  Button: ({ children, disabled, onClick }: any) => (
    <button disabled={disabled} onClick={onClick} data-testid="button">
      {children}
    </button>
  )
}));

vi.mock('../components/features/PlayerList', () => ({
  PlayerList: ({ players }: { players: any[] }) => (
    <div data-testid="player-list">Players: {players?.length || 0}</div>
  )
}));

vi.mock('../components/features/ModProposalForm', () => ({
  ModProposalForm: ({ onSubmit }: { onSubmit: Function }) => (
    <div data-testid="mod-proposal-form">Mod Proposal Form</div>
  )
}));

vi.mock('../components/FirebaseErrorBoundary', () => ({
  FirebaseErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
  useFirebaseErrorHandler: () => ({
    error: null,
    handleError: vi.fn(),
    retry: vi.fn(),
    clearError: vi.fn()
  })
}));

vi.mock('../components/ErrorNotification', () => ({
  ErrorNotification: () => <div data-testid="error-notification" />,
  useErrorNotification: () => ({
    error: null,
    showError: vi.fn(),
    dismissError: vi.fn(),
    retryOperation: vi.fn()
  })
}));

vi.mock('../components/ConnectionStatus', () => ({
  ConnectionStatus: () => <div data-testid="connection-status" />
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-room-id' }),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  };
});

describe('Lobby Component - Defensive Rendering', () => {
  const mockStore = {
    user: null,
    room: null,
    mods: { proposed: [], current: null, currentIndex: 0 },
    isLoading: { user: false, room: false, mods: false },
    setRoom: vi.fn(),
    setMods: vi.fn(),
    setLoading: vi.fn()
  };

  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue(mockStore as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading states', () => {
    it('should show loading message when user or room is null', () => {
      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading indicators for room and mods data', () => {
      const validUser: User = { uid: 'user1', nickname: 'TestUser', isAnonymous: false };
      const validRoom: Room = {
        id: 'room1',
        hostId: 'user1',
        isHost: true,
        players: [],
        status: 'lobby',
        createdAt: new Date()
      };

      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        isLoading: { user: false, room: true, mods: true }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading players...')).toBeInTheDocument();
      expect(screen.getByText('Loading mods...')).toBeInTheDocument();
    });
  });

  describe('Defensive mods rendering', () => {
    const validUser: User = { uid: 'user1', nickname: 'TestUser', isAnonymous: false };
    const validRoom: Room = {
      id: 'room1',
      hostId: 'user1',
      isHost: true,
      players: [],
      status: 'lobby',
      createdAt: new Date()
    };

    it('should handle null mods.proposed gracefully', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: null as any, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Proposed Mods (0)')).toBeInTheDocument();
      expect(screen.getByText('No mods proposed yet. Be the first to suggest one!')).toBeInTheDocument();
    });

    it('should handle undefined mods.proposed gracefully', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: undefined as any, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Proposed Mods (0)')).toBeInTheDocument();
      expect(screen.getByText('No mods proposed yet. Be the first to suggest one!')).toBeInTheDocument();
    });

    it('should handle non-array mods.proposed gracefully', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: 'invalid' as any, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Proposed Mods (0)')).toBeInTheDocument();
      expect(screen.getByText('No mods proposed yet. Be the first to suggest one!')).toBeInTheDocument();
    });

    it('should handle empty mods array', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: [], current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Proposed Mods (0)')).toBeInTheDocument();
      expect(screen.getByText('No mods proposed yet. Be the first to suggest one!')).toBeInTheDocument();
    });

    it('should render valid mods with defensive property access', () => {
      const validMods: Mod[] = [
        {
          id: 'mod1',
          roomId: 'room1',
          name: 'Test Mod 1',
          description: 'Test Description 1',
          proposedBy: 'user1',
          createdAt: new Date()
        },
        {
          id: 'mod2',
          roomId: 'room1',
          name: 'Test Mod 2',
          description: 'Test Description 2',
          proposedBy: 'user2',
          createdAt: new Date()
        }
      ];

      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: validMods, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Proposed Mods (2)')).toBeInTheDocument();
      expect(screen.getByText('Test Mod 1')).toBeInTheDocument();
      expect(screen.getByText('Test Mod 2')).toBeInTheDocument();
      expect(screen.getByText('Test Description 1')).toBeInTheDocument();
      expect(screen.getByText('Test Description 2')).toBeInTheDocument();
    });

    it('should handle mods with missing properties gracefully', () => {
      const modsWithMissingProps = [
        {
          id: 'mod1',
          roomId: 'room1',
          name: 'Valid Mod',
          description: 'Valid Description',
          proposedBy: 'user1',
          createdAt: new Date()
        },
        {
          id: 'mod2',
          roomId: 'room1',
          // Missing name
          description: 'Description without name',
          proposedBy: 'user2',
          createdAt: new Date()
        } as any,
        {
          id: 'mod3',
          roomId: 'room1',
          name: 'Mod without description',
          // Missing description
          proposedBy: 'user3',
          createdAt: new Date()
        } as any
      ];

      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: modsWithMissingProps, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      expect(screen.getByText('Proposed Mods (3)')).toBeInTheDocument();
      expect(screen.getByText('Valid Mod')).toBeInTheDocument();
      expect(screen.getByText('Unnamed Mod')).toBeInTheDocument(); // Fallback for missing name
      expect(screen.getByText('No description provided')).toBeInTheDocument(); // Fallback for missing description
    });

    it('should use unique keys for mod list items', () => {
      const modsWithAndWithoutIds = [
        {
          id: 'mod1',
          roomId: 'room1',
          name: 'Mod with ID',
          description: 'Description',
          proposedBy: 'user1',
          createdAt: new Date()
        },
        {
          // Missing id
          roomId: 'room1',
          name: 'Mod without ID',
          description: 'Description',
          proposedBy: 'user2',
          createdAt: new Date()
        } as any
      ];

      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: modsWithAndWithoutIds, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      const { container } = render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      // Check that elements are rendered (defensive key handling should prevent crashes)
      expect(screen.getByText('Mod with ID')).toBeInTheDocument();
      expect(screen.getByText('Mod without ID')).toBeInTheDocument();
      
      // Verify no React key warnings by checking that both items render
      const modElements = container.querySelectorAll('[class*="bg-gray-50"]');
      expect(modElements).toHaveLength(2);
    });
  });

  describe('Start Voting button defensive logic', () => {
    const validUser: User = { uid: 'user1', nickname: 'TestUser', isAnonymous: false };
    const validRoom: Room = {
      id: 'room1',
      hostId: 'user1',
      isHost: true,
      players: [],
      status: 'lobby',
      createdAt: new Date()
    };

    it('should disable Start Voting button when mods.proposed is null', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: null as any, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      const startButton = screen.getByText('Start Voting').closest('button');
      expect(startButton).toBeDisabled();
    });

    it('should disable Start Voting button when mods.proposed is undefined', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: undefined as any, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      const startButton = screen.getByText('Start Voting').closest('button');
      expect(startButton).toBeDisabled();
    });

    it('should disable Start Voting button when mods.proposed is not an array', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: 'invalid' as any, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      const startButton = screen.getByText('Start Voting').closest('button');
      expect(startButton).toBeDisabled();
    });

    it('should disable Start Voting button when mods.proposed is empty array', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: [], current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      const startButton = screen.getByText('Start Voting').closest('button');
      expect(startButton).toBeDisabled();
    });

    it('should enable Start Voting button when mods.proposed has valid items', () => {
      const validMods: Mod[] = [
        {
          id: 'mod1',
          roomId: 'room1',
          name: 'Test Mod',
          description: 'Test Description',
          proposedBy: 'user1',
          createdAt: new Date()
        }
      ];

      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: validRoom,
        mods: { proposed: validMods, current: null, currentIndex: 0 },
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      const startButton = screen.getByText('Start Voting').closest('button');
      expect(startButton).not.toBeDisabled();
    });
  });

  describe('Player list defensive rendering', () => {
    const validUser: User = { uid: 'user1', nickname: 'TestUser', isAnonymous: false };

    it('should handle room with null players array', () => {
      const roomWithNullPlayers: Room = {
        id: 'room1',
        hostId: 'user1',
        isHost: true,
        players: null as any,
        status: 'lobby',
        createdAt: new Date()
      };

      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: roomWithNullPlayers,
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      // Should render PlayerList with fallback empty array
      expect(screen.getByTestId('player-list')).toBeInTheDocument();
      expect(screen.getByText('Players: 0')).toBeInTheDocument();
    });

    it('should handle room with undefined players array', () => {
      const roomWithUndefinedPlayers: Room = {
        id: 'room1',
        hostId: 'user1',
        isHost: true,
        players: undefined as any,
        status: 'lobby',
        createdAt: new Date()
      };

      vi.mocked(useAppStore).mockReturnValue({
        ...mockStore,
        user: validUser,
        room: roomWithUndefinedPlayers,
        isLoading: { user: false, room: false, mods: false }
      } as any);

      render(
        <BrowserRouter>
          <Lobby />
        </BrowserRouter>
      );

      // Should render PlayerList with fallback empty array
      expect(screen.getByTestId('player-list')).toBeInTheDocument();
      expect(screen.getByText('Players: 0')).toBeInTheDocument();
    });
  });
});