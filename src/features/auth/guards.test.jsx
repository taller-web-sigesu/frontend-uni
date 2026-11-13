import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http } from 'msw';
import { server } from '../../mocks/server.js';
import { db } from '../../mocks/db.js';
import { renderWithRouter } from '../../test/render.jsx';
import { homePathFor } from './guards.jsx';

const userById = (id) => {
  const { nombreCompleto, rol, areaId } = db.users.find((u) => u.id === id);
  return { id, nombreCompleto, rol, areaId };
};

afterEach(() => server.events.removeAllListeners());

test('homePathFor', () => {
  expect(homePathFor('SUPERVISOR')).toBe('/indicadores');
  expect(homePathFor('DOCENTE')).toBe('/inicio');
  expect(homePathFor('ADMINISTRADOR')).toBe('/inicio');
});

test('sin sesión redirige a /login', async () => {
  const { router } = renderWithRouter(null, { route: '/solicitudes', session: 'restore' });
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  expect(router.state.location.state.from.pathname).toBe('/solicitudes');
});

test('mientras restaura muestra carga y no redirige', async () => {
  server.use(http.post('/api/v1/auth/refresh', () => delay('infinite')));
  const { router } = renderWithRouter(null, { route: '/solicitudes', session: 'restore' });
  expect(await screen.findByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/solicitudes');
});

test('primer ingreso solo permite /cambiar-contrasena', async () => {
  const { router } = renderWithRouter(null, {
    route: '/solicitudes',
    session: { user: userById('10'), mustChangePassword: true },
  });
  await waitFor(() => expect(router.state.location.pathname).toBe('/cambiar-contrasena'));
  expect(await screen.findByRole('heading', { name: 'Cambiar contraseña' })).toBeInTheDocument();
});

test('bloquea un rol no autorizado', async () => {
  const adminRequests = [];
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname.startsWith('/api/v1/admin')) adminRequests.push(request.url);
  });
  renderWithRouter(null, { route: '/admin/usuarios', session: { user: userById('5') } });
  expect(await screen.findByText('No tienes permiso para ver esta página')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ir a mi inicio' })).toHaveAttribute('href', '/inicio');
  expect(adminRequests).toEqual([]);
});

test('con sesión, /login redirige al inicio del rol', async () => {
  const { router } = renderWithRouter(null, { route: '/login', session: { user: userById('2') } });
  await waitFor(() => expect(router.state.location.pathname).toBe('/indicadores'));
});

test('Cerrar sesión desde el topbar vuelve a /login', async () => {
  const user = userEvent.setup();
  const { router } = renderWithRouter(null, { route: '/inicio', session: { user: userById('8') } });
  await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  expect(db.sessions.at(-1).revoked).toBe(true);
});
