// Fonts (self-hosted — UI-8 compliance, no CDN deps)
import '@fontsource-variable/outfit';
import '@fontsource-variable/jetbrains-mono';

// Styles (Tailwind v4 + safe-area utilities + Phase 10.5 accessibility)
import '../styles/tailwind.css';
import '../styles/safe-area.css';
import '../styles/accessibility.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in index.html');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
