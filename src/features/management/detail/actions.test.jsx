import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../mocks/server.js';
import { db } from '../../../mocks/db.js';
import { renderWithRouter } from '../../../test/render.jsx';
import { captureRequests, SUPERVISORA_TI, TECNICO_TI, userById } from '../../../test/users.js';
import * as pendingContract from '../../../services/pendingContract.js';

const CONFLICT = 'La solicitud cambió mientras la revisabas. Se cargó su estado actual.';
// Todos los cuerpos enviados a PATCH /status en este archivo (ver la última prueba).
const statusBodies = [];

beforeEach(() => {
  server.events.on('request:start', async ({ request }) => {
    if (request.method === 'PATCH' && new URL(request.url).pathname.endsWith('/status')) {
      statusBodies.push(await request.clone().json());
    }
  });
});

afterEach(() => {
  server.events.removeAllListeners();
  vi.restoreAllMocks();
});

async function openDetail(id, userId) {
  const user = userEvent.setup();
  renderWithRouter(null, { route: `/solicitudes/${id}`, session: { user: userById(userId) } });
  await screen.findByRole('heading', { name: `SOL-2026-${id.padStart(6, '0')}` });
  return user;
}

const statusOf = (id) => db.requests.find((r) => r.id === id).estado;

test('el técnico inicia desde ASIGNADO y resuelve desde EN_PROCESO', async () => {
  const calls = captureRequests('PATCH', '/api/v1/requests/2/status');
  const user = await openDetail('2', TECNICO_TI);
  expect(screen.queryByRole('button', { name: 'Marcar como resuelta' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Iniciar atención' }));
  await user.click(await screen.findByRole('button', { name: 'Marcar como resuelta' }));
  await waitFor(() => expect(statusOf('2')).toBe('RESUELTO'));
  expect(calls.map((c) => c.body)).toEqual([{ estado: 'EN_PROCESO' }, { estado: 'RESUELTO' }]);
  expect(await screen.findAllByText('Resuelto')).not.toHaveLength(0);
  expect(screen.queryByRole('button', { name: 'Marcar como resuelta' })).not.toBeInTheDocument();
});

test('el supervisor cierra desde RESUELTO', async () => {
  const calls = captureRequests('PATCH', '/api/v1/requests/4/status');
  const user = await openDetail('4', SUPERVISORA_TI);
  await user.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));
  await waitFor(() => expect(statusOf('4')).toBe('CERRADO'));
  expect(calls.map((c) => c.body)).toEqual([{ estado: 'CERRADO' }]);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Cerrar solicitud' })).not.toBeInTheDocument());
  expect(screen.getByText('Último responsable')).toBeInTheDocument();
});

test('rechazar exige motivo', async () => {
  const calls = captureRequests('PATCH', '/api/v1/requests/1/status');
  const user = await openDetail('1', SUPERVISORA_TI);
  await user.click(screen.getByRole('button', { name: 'Rechazar solicitud' }));
  const dialog = screen.getByRole('dialog', { name: 'Rechazar solicitud' });
  await user.type(within(dialog).getByLabelText('Motivo'), '   ');
  await user.click(within(dialog).getByRole('button', { name: 'Rechazar solicitud' }));
  expect(within(dialog).getByText('Indica el motivo del rechazo.')).toBeInTheDocument();
  expect(calls).toHaveLength(0);
  await user.clear(within(dialog).getByLabelText('Motivo'));
  await user.type(within(dialog).getByLabelText('Motivo'), 'Corresponde a otra sede.');
  await user.click(within(dialog).getByRole('button', { name: 'Rechazar solicitud' }));
  await waitFor(() => expect(statusOf('1')).toBe('RECHAZADO'));
  expect(calls.map((c) => c.body)).toEqual([{ estado: 'RECHAZADO', motivo: 'Corresponde a otra sede.' }]);
  expect(await screen.findByText('Motivo: Corresponde a otra sede.')).toBeInTheDocument();
});

test('recarga y recalcula tras 409', async () => {
  const user = await openDetail('4', SUPERVISORA_TI);
  // Otro supervisor la cerró mientras esta pantalla estaba abierta.
  const solicitud = db.requests.find((r) => r.id === '4');
  solicitud.estado = 'CERRADO';
  solicitud.ultimoResponsableId = solicitud.responsableId;
  solicitud.responsableId = null;
  await user.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));
  expect(await screen.findByText(CONFLICT)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Cerrar solicitud' })).not.toBeInTheDocument());
  expect(screen.queryByRole('button', { name: 'Reasignar' })).not.toBeInTheDocument();
  expect(screen.getAllByText('Cerrado').length).toBeGreaterThan(0);
});

test('asigna un técnico elegible', async () => {
  const calls = captureRequests('POST', '/api/v1/requests/1/assignments');
  const user = await openDetail('1', SUPERVISORA_TI);
  await user.click(screen.getByRole('button', { name: 'Asignar responsable' }));
  const dialog = screen.getByRole('dialog', { name: 'Asignar responsable' });
  await within(dialog).findByRole('option', { name: 'Técnica TI Demo' });
  expect(within(dialog).queryByRole('option', { name: 'Técnico Mantenimiento Demo' })).not.toBeInTheDocument();
  await user.selectOptions(within(dialog).getByLabelText('Técnico'), 'Técnica TI Demo');
  await user.click(within(dialog).getByRole('button', { name: 'Asignar' }));
  await waitFor(() => expect(statusOf('1')).toBe('ASIGNADO'));
  expect(calls.map((c) => c.body)).toEqual([{ tecnicoId: '6' }]);
  const summary = await screen.findByRole('region', { name: 'Datos de la solicitud' });
  await waitFor(() => expect(within(summary).getByText('Técnica TI Demo')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Reasignar' })).toBeInTheDocument();
});

test('el control de prioridad se oculta sin opciones', async () => {
  vi.spyOn(pendingContract, 'listPriorityOptions').mockResolvedValue(null);
  await openDetail('1', SUPERVISORA_TI);
  await screen.findByRole('button', { name: 'Asignar responsable' });
  await waitFor(() => expect(pendingContract.listPriorityOptions).toHaveBeenCalled());
  expect(screen.queryByRole('button', { name: 'Guardar prioridad' })).not.toBeInTheDocument();
});

test('el supervisor cambia la prioridad', async () => {
  const calls = captureRequests('PATCH', '/api/v1/requests/1');
  const user = await openDetail('1', SUPERVISORA_TI);
  const control = await screen.findByRole('region', { name: 'Prioridad' });
  await user.selectOptions(within(control).getByLabelText('Nueva prioridad'), 'Alta');
  await user.click(within(control).getByRole('button', { name: 'Guardar prioridad' }));
  await waitFor(() => expect(db.requests.find((r) => r.id === '1').prioridadId).toBe('5'));
  expect(calls.map((c) => c.body)).toEqual([{ prioridadId: '5' }]);
});

test('la auditoría lista los cambios', async () => {
  await openDetail('2', SUPERVISORA_TI);
  const panel = await screen.findByRole('region', { name: 'Auditoría' });
  const row = (await within(panel).findByText('prioridad')).closest('tr');
  expect(row).toHaveTextContent('Media');
  expect(row).toHaveTextContent('Alta');
  expect(row).toHaveTextContent('03/11/2026 10:30');
});

test('el técnico no ve la auditoría', async () => {
  const audits = captureRequests('GET', /\/audit-events$/);
  await openDetail('2', TECNICO_TI);
  expect(screen.queryByRole('region', { name: 'Auditoría' })).not.toBeInTheDocument();
  expect(audits).toHaveLength(0);
});

test('nunca envía ASIGNADO por PATCH /status', () => {
  expect(statusBodies.length).toBeGreaterThan(0);
  expect(statusBodies.filter((body) => body.estado === 'ASIGNADO')).toEqual([]);
});

test('la auditoría nombra al usuario en sesión en sus propios cambios', async () => {
  await openDetail('2', SUPERVISORA_TI);
  const panel = await screen.findByRole('region', { name: 'Auditoría' });
  const row = (await within(panel).findByText('prioridad')).closest('tr');
  expect(row).toHaveTextContent('Supervisora TI Demo');
});
