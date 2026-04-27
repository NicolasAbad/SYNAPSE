// Pre-launch audit Day 2 — `isEU` lives in its own module so GdprModal.tsx
// can stay a pure-component file (react-refresh/only-export-components).
//
// Evaluated once at module-load (cached by detectEU itself).

import { detectEU } from '../../platform/euDetection';

export const isEU = detectEU();
