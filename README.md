# ModrSwipe

## Introduction

ModrSwipe is a web application designed to facilitate the process of choosing Minecraft mods for a server or modpack. It provides a collaborative and interactive platform where users can vote on proposed mods in a "swipe-style" interface, similar to popular dating apps. This approach simplifies the decision-making process, making it fun and efficient for a group of players to agree on a mod list.

The application allows users to create or join rooms, where a designated admin can propose mods. Other members in the room can then vote "yes" or "no" on each mod. The final results are displayed, showing which mods were approved by the group.

## Features

*   **Room Creation & Management:** Create private rooms for your group.
*   **User Authentication:** Simple player identification system.
*   **Mod Proposal System:** Admins can propose mods to be voted on.
*   **Interactive Swiping Interface:** Users vote on mods by swiping left (no) or right (yes).
*   **Real-time Voting:** See voting progress in real-time.
*   **Results Page:** View the final list of approved mods.
*   **Customizable Panorama Background:** Features a Minecraft-style panoramic background.

## Tech Stack

This project is built with a modern web development stack:

*   **Frontend:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with `clsx` and `tailwind-merge` for utility class management.
*   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) for lightweight global state management.
*   **Routing:** [React Router](https://reactrouter.com/) for client-side routing.
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Realtime Database, or other services) for room management, voting, and user data.
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) and [React Spring](https://www.react-spring.dev/) for UI animations.
*   **3D Rendering:** [Three.js](https://threejs.org/) for the panoramic background.

## Project Structure

The project follows a component-based architecture, with a clear separation of concerns.

```
/
├── public/              # Static assets (images, fonts)
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── features/    # Components related to specific app features
│   │   ├── layout/      # Layout components (e.g., Panorama, main Layout)
│   │   └── ui/          # Generic, reusable UI elements (Button, Card)
│   ├── config/          # Configuration files (e.g., Firebase)
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Top-level page components for each route
│   ├── services/        # Business logic and API interactions (Firebase services)
│   ├── store/           # Zustand store for global state
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── .gitignore           # Git ignore file
├── index.html           # Main HTML entry point
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [npm](https://www.npmjs.com/) or a compatible package manager
*   A [Firebase](https://firebase.google.com/) project

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/ModrSwipe.git
    cd ModrSwipe
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Configure Firebase:**
    *   Navigate to `src/config/`.
    *   You will find a `firebase.js` file. This file is set up to initialize Firebase, but you need to provide your own project credentials.
    *   Replace the placeholder configuration object with your Firebase project's configuration. You can get this from the Firebase console (`Project Settings > General > Your apps > SDK setup and configuration`).

    ```javascript
    // src/config/firebase.js
    import { initializeApp } from "firebase/app";

    // TODO: Replace with your app's Firebase project configuration
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    export default app;
    ```

### Running the Application

Once the installation and configuration are complete, you can run the development server:

```sh
npm run dev
```

This will start the Vite development server, and you can view the application by navigating to `http://localhost:5173` (or the port specified in the console output).

## Available Scripts

The `package.json` file includes the following scripts:

*   `npm run dev`: Starts the development server with Hot Module Replacement (HMR).
*   `npm run build`: Compiles and bundles the application for production into the `dist/` directory.
*   `npm run lint`: Lints the codebase using ESLint to check for code quality and style issues.
*   `npm run preview`: Serves the production build locally to preview the final application.
