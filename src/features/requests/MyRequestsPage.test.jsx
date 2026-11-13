import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { db } from '../../mocks/db.js';
import { renderWithRouter } from '../../test/render.jsx';
import { ANA, captureRequests, PEDRO, userById } from '../../test/users.js';

afterEach(() => server.events.removeAllListeners());

const openList = (id = ANA) => renderWithRouter(null, { route: '/solicitudes', session: { user: userById(id) } });

test('lista con etiquetas legibles y abre el detalle', async () => {
  const user = userEvent.setup();
  const { router } = openList();
  expect(await screen.findByRole('heading', { name: 'Mis solicitudes' })).toBeInTheDocument();
  const row = (await screen.findByText('SOL-2026-000003')).closest('tr');
  expect(within(row).getByText('Conectividad')).toBeInTheDocument();
  expect(within(row).getByText('Media')).toBeInTheDocument();
  expect(within(row).getByText('En proceso')).toBeInTheDocument();
  expect(within(row).getByText('04/11/2026 09:00')).toBeInTheDocument();
  expect(screen.queryByText('SOL-2026-000007')).not.toBeInTheDocument();
  await user.click(row);
  await waitFor(() => expect(router.state.location.pathname).toBe('/solicitudes/3'));
});

test('estado vacío ofrece registrar', async () => {
  const user = userEvent.setup();
  db.requests = db.requests.filter((r) => r.solicitanteId !== PEDRO);
  const { router } = openList(PEDRO);
  expect(await screen.findByText('Aún no tienes solicitudes registradas')).toBeInTheDocument();
  const actions = screen.getAllByRole('link', { name: 'Registrar nueva solicitud' });
  await user.click(actions.at(-1));
  await waitFor(() => expect(router.state.location.pathname).toBe('/solicitudes/nueva'));
});

test('cambiar de página pide page=1', async () => {
  const user = userEvent.setup();
  const template = db.requests.find((r) => r.id === '1');
  for (let i = 0; i < 10; i += 1) {
    db.requests.push({ ...template, id: String(500 + i), codigo: `SOL-2026-000${500 + i}`, creadoEn: '2026-10-01T14:00:00Z' });
  }
  const calls = captureRequests('GET', '/api/v1/requests');
  openList();
  expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
  expect(calls.at(-1).url.searchParams.get('page')).toBe('1');
});

test('error de carga muestra Reintentar y recupera', async () => {
  const user = userEvent.setup();
  server.use(http.get('/api/v1/requests', () => HttpResponse.error(), { once: true }));
  openList();
  expect(await screen.findByText('No hay conexión con el servidor.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('SOL-2026-000001')).toBeInTheDocument();
});
