import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './app/router.jsx';
import { SessionProvider } from './features/auth/SessionProvider.jsx';
import { appGuards } from './features/auth/guards.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';

async function enableMocking() {
  if (import.meta.env.VITE_API_MODE !== 'mock') return;
  const [{ worker }, { db }, { registerMockData }, { restoreMockState, saveMockState }] = await Promise.all([
    import('./mocks/browser.js'),
    import('./mocks/state.js'),
    import('./services/pendingContract.js'),
    import('./mocks/persistence.js'),
  ]);
  restoreMockState(window.sessionStorage);
  // Solo en modo simulado: los recorridos E2E simulan con esto a «otra persona».
  window.__mockDb = db;
  registerMockData(db);
  worker.events.on('response:mocked', () => saveMockState(window.sessionStorage));
  await worker.start({ onUnhandledRequest: 'warn', quiet: true });
}

const router = createAppRouter(appGuards);

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </React.StrictMode>,
  );
});
