import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './app/router.jsx';
import { SessionProvider } from './features/auth/SessionProvider.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';

async function enableMocking() {
  if (import.meta.env.VITE_API_MODE !== 'mock') return;
  const { worker } = await import('./mocks/browser.js');
  await worker.start({ onUnhandledRequest: 'warn' });
}

const router = createAppRouter();

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </React.StrictMode>,
  );
});
