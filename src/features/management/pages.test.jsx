import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { db } from '../../mocks/db.js';
import { renderWithRouter } from '../../test/render.jsx';
import { captureRequests, SUPERVISORA_TI, TECNICO_TI, userById } from '../../test/users.js';

afterEach(() => server.events.removeAllListeners());

const codes = () => screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent);

test('la bandeja conserva el orden del servidor', async () => {
  const item = (id, prioridadId, creadoEn) => ({
    id, codigo: `SOL-2026-00000${id}`, categoriaId: '3', areaId: '1', prioridadId, estado: 'ASIGNADO', creadoEn,
  });
  // Orden que el cliente no debe tocar (ni por fecha ni por código).
  const items = [item('3', '5', '2026-11-09T14:00:00Z'), item('1', '4', '2026-11-01T14:00:00Z'), item('2', '3', '2026-11-05T14:00:00Z')];
  server.use(http.get('/api/v1/requests', () => HttpResponse.json({ items, page: 0, size: 10, totalElements: 3 })));
  const user = userEvent.setup();
  const { router } = renderWithRouter(null, { route: '/bandeja', session: { user: userById(TECNICO_TI) } });
  expect(await screen.findByRole('heading', { name: 'Mis asignaciones' })).toBeInTheDocument();
  await screen.findByText('SOL-2026-000003');
  expect(codes()).toEqual(['SOL-2026-000003', 'SOL-2026-000001', 'SOL-2026-000002']);
  await user.click(screen.getByText('SOL-2026-000001').closest('tr'));
  await waitFor(() => expect(router.state.location.pathname).toBe('/solicitudes/1'));
});

test('gestión envía los filtros y vuelve a la página 0', async () => {
  const template = db.requests.find((r) => r.id === '2');
  for (let i = 0; i < 12; i += 1) db.requests.push({ ...template, id: String(600 + i), codigo: `SOL-2026-000${600 + i}` });
  const calls = captureRequests('GET', '/api/v1/requests');
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/gestion', session: { user: userById(SUPERVISORA_TI) } });
  expect(await screen.findByRole('heading', { name: 'Gestión de área' })).toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Siguiente' }));
  await waitFor(() => expect(calls.at(-1).url.searchParams.get('page')).toBe('1'));

  await user.selectOptions(screen.getByLabelText('Estado'), 'Nuevo');
  await waitFor(() => expect(calls.at(-1).url.searchParams.get('estado')).toBe('NUEVO'));
  expect(calls.at(-1).url.searchParams.get('page')).toBe('0');
  await screen.findByText('SOL-2026-000001');
  expect(codes().every((code) => ['SOL-2026-000001', 'SOL-2026-000009'].includes(code))).toBe(true);

  await user.selectOptions(screen.getByLabelText('Categoría'), 'Equipos de cómputo');
  await user.selectOptions(screen.getByLabelText('Prioridad'), 'Baja');
  await waitFor(() => expect(calls.at(-1).url.searchParams.get('prioridadId')).toBe('3'));
  expect(calls.at(-1).url.searchParams.get('categoriaId')).toBe('5');
  expect(await screen.findByText('SOL-2026-000009')).toBeInTheDocument();
  expect(codes()).toEqual(['SOL-2026-000009']);
});

test('una respuesta tardía de un filtro anterior no reemplaza la actual', async () => {
  server.use(http.get('/api/v1/requests', async ({ request }) => {
    if (new URL(request.url).searchParams.get('estado') === 'ASIGNADO') {
      await delay(150);
      return HttpResponse.json({
        items: [{ id: '2', codigo: 'TARDIA', categoriaId: '5', areaId: '1', prioridadId: '5', estado: 'ASIGNADO', creadoEn: '2026-11-03T14:00:00Z' }],
        page: 0, size: 10, totalElements: 1,
      });
    }
    return undefined;
  }));
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/gestion', session: { user: userById(SUPERVISORA_TI) } });
  await screen.findByText('SOL-2026-000001');
  await user.selectOptions(screen.getByLabelText('Estado'), 'Asignado');
  await user.selectOptions(screen.getByLabelText('Estado'), 'Resuelto');
  expect(await screen.findByText('SOL-2026-000004')).toBeInTheDocument();
  await new Promise((resolve) => { setTimeout(resolve, 250); });
  expect(screen.queryByText('TARDIA')).not.toBeInTheDocument();
  expect(codes()).toEqual(['SOL-2026-000004']);
});
