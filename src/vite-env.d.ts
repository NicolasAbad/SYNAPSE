/// <reference types="vite/client" />

// CSS side-effect imports (Tailwind entry + safe-area utilities).
declare module '*.css';

// Fontsource packages ship CSS only (no TypeScript types).
// Side-effect imports register @font-face rules globally.
declare module '@fontsource-variable/outfit';
declare module '@fontsource-variable/jetbrains-mono';
