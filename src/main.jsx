import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './app/router.jsx';
import { UserContext } from './app/userContext.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';

async function enableMocking() {
  if (import.meta.env.VITE_API_MODE !== 'mock') return null;
  const [{ worker }, { db }] = await Promise.all([import('./mocks/browser.js'), import('./mocks/state.js')]);
  await worker.start({ onUnhandledRequest: 'warn' });
  // Provisional hasta la sesión de la fase 02: en modo simulado, `?rol=TECNICO`
  // elige el usuario de demostración con el que se revisan las pantallas.
  const rol = new URLSearchParams(window.location.search).get('rol') || 'ESTUDIANTE';
  return db.users.find((user) => user.rol === rol) || null;
}

enableMocking().then((previewUser) => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <UserContext.Provider value={previewUser}>
        <RouterProvider router={createAppRouter()} />
      </UserContext.Provider>
    </React.StrictMode>,
  );
});
