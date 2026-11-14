import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../mocks/db.js';
import { server } from '../../mocks/server.js';
import { renderWithRouter } from '../../test/render.jsx';
import { ANA, PEDRO, captureRequests, userById } from '../../test/users.js';
import { HomePage } from '../home/HomePage.jsx';

afterEach(() => server.events.removeAllListeners());

const seed = (id) => db.reservations.find((r) => r.id === id);
const dayLabel = (day) => day.split('-').reverse().join('/');
const rowOf = async (codigo) => (await screen.findByRole('cell', { name: codigo })).closest('tr');

function openDetail(id, userId = ANA) {
  const user = userEvent.setup();
  renderWithRouter(null, { route: `/reservas/${id}`, session: { user: userById(userId) } });
  return user;
}

test('lista mis reservas con nombre de espacio y estado', async () => {
  renderWithRouter(null, { route: '/reservas', session: { user: userById(ANA) } });
  expect(await screen.findByRole('heading', { name: 'Mis reservas' })).toBeInTheDocument();
  const row = await rowOf('RES-2026-000001');
  expect(within(row).getByText('Laboratorio 204')).toBeInTheDocument();
  expect(within(row).getByText(dayLabel(seed('1').fecha))).toBeInTheDocument();
  expect(within(row).getByText('10:00–11:00')).toBeInTheDocument();
  expect(within(row).getByText('Pendiente')).toBeInTheDocument();
  expect(within(await rowOf('RES-2026-000003')).getByText('Rechazada')).toBeInTheDocument();
  expect(screen.queryByRole('cell', { name: 'RES-2026-000005' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Registrar reserva' })).toHaveAttribute('href', '/reservas/nueva');
});

test('filtrar por estado vuelve a la página 0', async () => {
  // Más reservas propias que una página, para poder avanzar.
  for (let i = 0; i < 12; i += 1) {
    db.reservations.push({ ...seed('4'), id: String(200 + i), codigo: `RES-2026-000${200 + i}` });
  }
  const calls = captureRequests('GET', '/api/v1/reservations');
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/reservas', session: { user: userById(ANA) } });
  await rowOf('RES-2026-000001');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() => expect(calls.at(-1).url.searchParams.get('page')).toBe('1'));
  await user.selectOptions(screen.getByLabelText('Estado'), 'Confirmada');
  await waitFor(() => expect(calls.at(-1).url.searchParams.get('estado')).toBe('CONFIRMADA'));
  expect(calls.at(-1).url.searchParams.get('page')).toBe('0');
  expect(await rowOf('RES-2026-000002')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('cell', { name: 'RES-2026-000001' })).toBeNull());
});

test('cancelar pide confirmación y actualiza el estado', async () => {
  const patches = captureRequests('PATCH', '/api/v1/reservations/2/status');
  const user = openDetail('2');
  expect(await screen.findByRole('heading', { name: 'RES-2026-000002' })).toBeInTheDocument();
  expect(screen.getByText('Repaso de cálculo')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
  const dialog = await screen.findByRole('dialog', { name: 'Cancelar reserva' });
  expect(patches).toHaveLength(0);
  await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }));
  await waitFor(() => expect(patches).toHaveLength(1));
  expect(patches[0].body).toEqual({ estado: 'CANCELADA' });
  expect(await screen.findByText('Reserva cancelada')).toBeInTheDocument();
  expect(screen.getByText('Cancelada', { selector: '.badge' })).toBeInTheDocument();
  expect(await screen.findByText('Confirmada → Cancelada')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();
});

test('no ofrece cancelar una reserva rechazada', async () => {
  openDetail('3');
  expect(await screen.findByRole('heading', { name: 'RES-2026-000003' })).toBeInTheDocument();
  expect(screen.getByText('El aula está reservada para exámenes.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();
});

test('no ofrece cancelar la reserva de otra persona', async () => {
  // La supervisora de TI gestiona el Laboratorio 204 y ve la reserva de Pedro, pero no es suya.
  openDetail('5', '2');
  expect(await screen.findByRole('heading', { name: 'RES-2026-000005' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();
});

test('409 al cancelar recarga y avisa', async () => {
  const gets = captureRequests('GET', '/api/v1/reservations/1');
  const user = openDetail('1');
  await screen.findByRole('heading', { name: 'RES-2026-000001' });
  // Mientras tanto la reserva se canceló en otra pestaña.
  seed('1').estado = 'CANCELADA';
  await user.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar reserva' }));
  expect(await screen.findByText('La reserva ya no se puede cancelar')).toBeInTheDocument();
  await waitFor(() => expect(gets).toHaveLength(2));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findByText('Cancelada', { selector: '.badge' })).toBeInTheDocument();
});

test('el inicio muestra las próximas reservas', async () => {
  renderWithRouter(<HomePage user={userById(PEDRO)} />, { session: { user: userById(PEDRO) } });
  const section = await screen.findByRole('region', { name: 'Próximas reservas' });
  const rows = await within(section).findAllByRole('row');
  // Pedro tiene dos pendientes desde hoy (más el encabezado).
  expect(rows).toHaveLength(3);
  expect(within(section).getByText('Laboratorio 301')).toBeInTheDocument();
  expect(within(section).getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/reservas');
});
