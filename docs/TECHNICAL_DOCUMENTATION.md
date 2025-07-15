
# ModrSwipe - Formal Technical Documentation

**Version:** 1.0
**Date:** 2025-07-15

## 1. System Overview

ModrSwipe is a real-time, collaborative web application engineered to facilitate group decisions on game modifications. It leverages a modern, decoupled architecture with a Single Page Application (SPA) frontend and a Backend-as-a-Service (BaaS) provider. The system is designed for high interactivity and low-latency updates, providing a seamless user experience for real-time collaboration.

### 1.1. Architectural Paradigm

The system follows a client-server model. The client is a feature-rich SPA built with React, responsible for rendering the UI and managing user interactions. The backend is powered by Google's Firebase platform, which provides database, authentication, and real-time messaging services.

### 1.2. Core Technology Stack

- **Frontend Framework:** React v18 with Vite
- **Language:** TypeScript
- **UI & Styling:** Tailwind CSS
- **Client-Side Routing:** React Router v6
- **State Management:** Zustand
- **Backend Services:** Firebase (Authentication, Firestore, Realtime Database)

## 2. Data Models and Schemas

All data models are defined in `src/types/index.ts`. The system employs a hybrid data storage strategy, using Firestore for persistent records and the Realtime Database for ephemeral, high-frequency data.

### 2.1. Firestore Schemas

#### `rooms` collection

Stores the canonical record for each room.

| Field       | Type      | Description                                       |
|-------------|-----------|---------------------------------------------------|
| `id`        | `string`  | **Primary Key.** Unique room identifier (e.g., `A9B2C4`). |
| `hostId`    | `string`  | The UID of the user who created the room.         |
| `createdAt` | `Date`    | Timestamp of room creation.                       |
| `status`    | `string`  | The current state of the room (`lobby`, `voting`, `results`). |
| `settings`  | `object`  | Room configuration (voting type, timers, etc.).   |

#### `mods` collection

Stores a persistent record of every mod proposed across all rooms.

| Field         | Type      | Description                                       |
|---------------|-----------|---------------------------------------------------|
| `id`          | `string`  | **Primary Key.** Unique mod identifier.           |
| `roomId`      | `string`  | **Foreign Key.** The room this mod belongs to.    |
| `name`        | `string`  | The name of the mod.                              |
| `description` | `string`  | A description of the mod.                         |
| `url`         | `string`  | (Optional) A URL to the mod's webpage.            |
| `image`       | `string`  | (Optional) A URL to an image of the mod.          |
| `proposedBy`  | `string`  | The UID of the user who proposed the mod.         |
| `createdAt`   | `Date`    | Timestamp of when the mod was proposed.           |

#### `votes` collection

Stores individual votes for auditing and result calculation.

| Field       | Type      | Description                                       |
|-------------|-----------|---------------------------------------------------|
| `id`        | `string`  | **Primary Key.** Composite key (`userId_modId`).  |
| `roomId`    | `string`  | **Foreign Key.** The room where the vote was cast. |
| `modId`     | `string`  | **Foreign Key.** The mod being voted on.          |
| `userId`    | `string`  | **Foreign Key.** The user who cast the vote.      |
| `vote`      | `string`  | The vote itself (`like` or `dislike`).            |
| `comment`   | `string`  | (Optional) A comment associated with the vote.    |
| `createdAt` | `Date`    | Timestamp of when the vote was cast.              |

### 2.2. Realtime Database (RTDB) Structure

The RTDB is used for data that requires low-latency synchronization.

```json
{
  "rooms": {
    "<roomId>": {
      "players": {
        "<userId>": {
          "nickname": "string",
          "isHost": "boolean",
          "isOnline": "boolean",
          "joinedAt": "string (ISO 8601)"
        }
      },
      "mods": {
        "<modId>": { ... } // A mirror of the mod data from Firestore
      },
      "votes": {
        "<voteId>": { ... } // A mirror of the vote data from Firestore
      }
    }
  },
  "users": {
    "<userId>": {
      "status": "online" | "offline",
      "lastSeen": "string (ISO 8601)"
    }
  }
}
```

## 3. Service Layer API

The `src/services` directory contains modules that encapsulate all backend communication. This abstraction layer decouples the UI components from the data source and provides a consistent API for data manipulation.

### `authService.js`

- `signInAnonymous(): Promise<User>`
- `signOut(): Promise<void>`
- `onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe`
- `getCurrentUser(): User | null`

### `roomService.ts`

- `createRoom(hostId: string, hostNickname: string): Promise<RoomData>`
- `joinRoom(roomId: string, userId: string, nickname: string): Promise<RoomData>`
- `onPlayersChanged(roomId: string, callback: (players: Player[]) => void): Unsubscribe`
- `updateRoomStatus(roomId: string, status: 'lobby' | 'voting' | 'results'): Promise<void>`
- `leaveRoom(roomId: string, userId: string): Promise<void>`

### `modService.ts`

- `proposeMod(roomId: string, userId: string, modData: ModData): Promise<Mod>`
- `onModsChanged(roomId: string, callback: (mods: Mod[]) => void): Unsubscribe`
- `getRoomMods(roomId: string): Promise<Mod[]>`

### `voteService.js`

- `submitVote(roomId: string, modId: string, userId: string, vote: 'like' | 'dislike', comment?: string): Promise<Vote>`
- `onVotesChanged(roomId: string, callback: (votes: Vote[]) => void): Unsubscribe`
- `getRoomVotes(roomId: string): Promise<Vote[]>`
- `calculateResults(mods: Mod[], votes: Vote[]): Results`

## 4. State Management Architecture

Global client-side state is managed by Zustand, located in `src/store/useAppStore.ts`. The store is designed to be the single source of truth for the application's UI state.

### 4.1. State Slices

- **`user`**: Holds the authenticated user's profile.
- **`room`**: Contains the current room's state, including players and status.
- **`mods`**: Manages the list of proposed mods and the current swiping index.
- **`votes`**: Caches votes to provide immediate feedback to the user.
- **`isLoading`**: Tracks the loading status of various asynchronous operations.

### 4.2. Data Flow and Reactivity

1.  **Component Interaction:** A user action in a component (e.g., clicking a button) triggers a call to a service layer function.
2.  **Service Execution:** The service function communicates with the Firebase backend.
3.  **Real-time Updates:** Firebase listeners (e.g., `onPlayersChanged`) are triggered by data changes in the RTDB.
4.  **State Mutation:** The listener's callback invokes an action in the Zustand store, updating the state.
5.  **Component Re-rendering:** Components subscribed to the store re-render with the new state.

## 5. Core Components

### 5.1. `ModCard.tsx`

A presentational component that displays a single mod's information. It is used in the `SwipePage` to show the current mod being voted on.

### 5.2. `SwipePage.tsx`

A container component that orchestrates the main voting experience. It is responsible for:

- Fetching the list of proposed mods.
- Managing the swiping state (current index, last direction).
- Handling the swipe events and calling the `voteService`.
- Navigating to the results page when all mods have been voted on.

## 6. Error Handling and Validation

The system employs a robust error handling and data validation strategy, primarily implemented in `src/utils/validation.ts`.

- **Validation Classes:** Custom error classes like `ValidationError` and `FirebaseError` provide detailed error information.
- **Type Guards:** Data received from Firebase is validated against TypeScript interfaces to ensure type safety.
- **Retry Logic:** A `withRetry` utility automatically retries failed Firebase operations with exponential backoff for transient network errors.
- **User-Facing Messages:** A `getErrorMessage` function translates system errors into user-friendly messages.
