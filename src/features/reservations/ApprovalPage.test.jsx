import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../mocks/db.js';
import { server } from '../../mocks/server.js';
import { renderWithRouter } from '../../test/render.jsx';
import { SUPERVISORA_TI, captureRequests, userById } from '../../test/users.js';

afterEach(() => server.events.removeAllListeners());

const seed = (id) => db.reservations.find((r) => r.id === id);
const rowOf = async (codigo) => (await screen.findByRole('cell', { name: codigo })).closest('tr');

async function openPage() {
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/reservas/aprobacion', session: { user: userById(SUPERVISORA_TI) } });
  expect(await screen.findByRole('heading', { name: 'Aprobación de reservas' })).toBeInTheDocument();
  return user;
}

async function review(user, codigo) {
  await user.click(within(await rowOf(codigo)).getByRole('button', { name: `Revisar ${codigo}` }));
  const dialog = await screen.findByRole('dialog', { name: `Revisar ${codigo}` });
  await within(dialog).findByRole('list', { name: /^Franjas del/ });
  return dialog;
}

test('lista pendientes de la vista de gestión', async () => {
  const calls = captureRequests('GET', '/api/v1/reservations');
  await openPage();
  expect(await rowOf('RES-2026-000001')).toHaveTextContent('Ana Demo');
  expect(await rowOf('RES-2026-000005')).toBeInTheDocument();
  expect(await rowOf('RES-2026-000006')).toBeInTheDocument();
  // El Laboratorio 301 es de Mantenimiento: no le corresponde.
  expect(screen.queryByRole('cell', { name: 'RES-2026-000007' })).toBeNull();
  const params = calls[0].url.searchParams;
  expect(params.get('vista')).toBe('gestion');
  expect(params.get('estado')).toBe('PENDIENTE');
  expect(screen.getByText('No puedes aprobar tus propias reservas.')).toBeInTheDocument();
});

test('aprobar envía CONFIRMADA y retira la fila', async () => {
  const patches = captureRequests('PATCH', '/api/v1/reservations/5/status');
  const user = await openPage();
  const dialog = await review(user, 'RES-2026-000005');
  expect(within(dialog).getByText('Pedro Demo')).toBeInTheDocument();
  expect(within(dialog).getByText('Clase práctica')).toBeInTheDocument();
  expect(within(dialog).getByText('14:00–16:00 ocupada por esta solicitud')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: 'Aprobar' }));
  await waitFor(() => expect(patches).toHaveLength(1));
  expect(patches[0].body).toEqual({ estado: 'CONFIRMADA' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findByText('Reserva RES-2026-000005 aprobada')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('cell', { name: 'RES-2026-000005' })).toBeNull());
  expect(seed('5').estado).toBe('CONFIRMADA');
});

test('rechazar exige motivo', async () => {
  const patches = captureRequests('PATCH', '/api/v1/reservations/1/status');
  const user = await openPage();
  const dialog = await review(user, 'RES-2026-000001');
  await user.click(within(dialog).getByRole('button', { name: 'Rechazar' }));
  const motivo = within(dialog).getByLabelText('Motivo del rechazo');
  await user.type(motivo, '   ');
  await user.click(within(dialog).getByRole('button', { name: 'Confirmar rechazo' }));
  expect(await within(dialog).findByText('Indica el motivo del rechazo.')).toBeInTheDocument();
  expect(patches).toHaveLength(0);
  await user.type(motivo, 'El laboratorio está en mantenimiento.');
  await user.click(within(dialog).getByRole('button', { name: 'Confirmar rechazo' }));
  await waitFor(() => expect(patches).toHaveLength(1));
  expect(patches[0].body).toEqual({ estado: 'RECHAZADA', motivo: 'El laboratorio está en mantenimiento.' });
  expect(await screen.findByText('Reserva RES-2026-000001 rechazada')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('cell', { name: 'RES-2026-000001' })).toBeNull());
});

test('no ofrece aprobar la propia reserva', async () => {
  const user = await openPage();
  const dialog = await review(user, 'RES-2026-000006');
  expect(within(dialog).getByText('No puedes decidir sobre tu propia reserva.')).toBeInTheDocument();
  expect(within(dialog).queryByRole('button', { name: 'Aprobar' })).toBeNull();
  expect(within(dialog).queryByRole('button', { name: 'Rechazar' })).toBeNull();
});

test('409 al aprobar recarga detalle y disponibilidad', async () => {
  const details = captureRequests('GET', '/api/v1/reservations/5');
  const availability = captureRequests('GET', '/api/v1/spaces/3/availability');
  const user = await openPage();
  const dialog = await review(user, 'RES-2026-000005');
  // Entre tanto se confirmó otra reserva que se cruza con esa franja.
  db.reservations.push({ ...seed('2'), id: '901', codigo: 'RES-2026-000901', espacioId: '3', fecha: seed('5').fecha, horaInicio: '15:00', horaFin: '17:00' });
  await user.click(within(dialog).getByRole('button', { name: 'Aprobar' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('La franja elegida ya no está disponible. Elige otra.');
  await waitFor(() => expect(details).toHaveLength(2));
  await waitFor(() => expect(availability).toHaveLength(2));
  expect(await within(dialog).findByText('15:00–17:00 ocupada')).toBeInTheDocument();
  expect(seed('5').estado).toBe('PENDIENTE');
});
