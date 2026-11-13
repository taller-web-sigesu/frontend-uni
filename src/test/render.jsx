import { render } from '@testing-library/react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import { buildRouteObjects } from '../app/router.jsx';
import { UserContext } from '../app/userContext.js';

/**
 * Renderiza `ui` dentro de un router en memoria, o (con `ui = null`) la tabla
 * de rutas completa en `route`.
 */
export function renderWithRouter(ui, { route = '/', routes, user = null, guard } = {}) {
  if (ui) {
    return render(
      <UserContext.Provider value={user}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </UserContext.Provider>,
    );
  }
  const router = createMemoryRouter(buildRouteObjects({ routes, guard }), { initialEntries: [route] });
  return {
    router,
    ...render(
      <UserContext.Provider value={user}>
        <RouterProvider router={router} />
      </UserContext.Provider>,
    ),
  };
}
