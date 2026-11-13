import { render } from '@testing-library/react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import { buildRouteObjects } from '../app/router.jsx';
import { UserContext } from '../app/userContext.js';
import { SessionProvider } from '../features/auth/SessionProvider.jsx';
import { appGuards } from '../features/auth/guards.jsx';
import { db, signInMock } from '../mocks/db.js';

/**
 * Proveedor para la prueba:
 * - `session: { user, mustChangePassword }` monta una sesión ya autenticada; si
 *   el usuario existe en la API simulada, su JWT es válido para los handlers.
 * - `session: 'restore'` monta el proveedor real, que intenta restaurar.
 * - sin `session`, solo `UserContext` con `user` (pantallas sin sesión).
 */
function Providers({ session, user, children }) {
  if (session === 'restore') return <SessionProvider locks={null}>{children}</SessionProvider>;
  if (session) {
    const known = db.users.find((u) => u.id === session.user.id);
    const token = known ? signInMock(known.correo) : 'token-de-prueba';
    return (
      <SessionProvider locks={null} initialSession={{ ...session, token }}>
        {children}
      </SessionProvider>
    );
  }
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/**
 * Renderiza `ui` dentro de un router en memoria, o (con `ui = null`) la tabla
 * de rutas completa en `route`.
 */
export function renderWithRouter(ui, { route = '/', routes, user = null, guard, session } = {}) {
  if (ui) {
    return render(
      <Providers session={session} user={user}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Providers>,
    );
  }
  // Con sesión se usan las guardas reales de la app; sin ella, solo `guard` si se pasa.
  const guards = session ? { ...appGuards, ...(guard && { guard }) } : { guard };
  const router = createMemoryRouter(buildRouteObjects({ routes, ...guards }), { initialEntries: [route] });
  return {
    router,
    ...render(
      <Providers session={session} user={user}>
        <RouterProvider router={router} />
      </Providers>,
    ),
  };
}
