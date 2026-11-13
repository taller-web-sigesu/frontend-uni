import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../mocks/server.js';
import { renderWithRouter } from '../../../test/render.jsx';
import { captureRequests, userById } from '../../../test/users.js';

const ADMIN = '1';
const PRECEDENCE = 'Si una solicitud tiene política por categoría y por prioridad, se aplica la de categoría.';

afterEach(() => server.events.removeAllListeners());

async function renderPage() {
  renderWithRouter(null, { route: '/admin/sla', session: { user: userById(ADMIN) } });
  expect(await screen.findByRole('heading', { name: 'Políticas SLA' })).toBeInTheDocument();
}

async function openCreate(user) {
  await user.click(await screen.findByRole('button', { name: 'Nueva política' }));
  return screen.findByRole('dialog', { name: 'Nueva política' });
}

async function fillHours(user, dialog, objetivo, aviso) {
  await user.type(within(dialog).getByLabelText('Horas objetivo'), String(objetivo));
  await user.type(within(dialog).getByLabelText('Horas de aviso'), String(aviso));
}

test('el alta envía solo categoriaId o solo prioridadId', async () => {
  const calls = captureRequests('POST', '/api/v1/admin/sla-policies');
  const user = userEvent.setup();
  await renderPage();
  expect(await screen.findByText(PRECEDENCE)).toBeInTheDocument();
  const row = (await screen.findByRole('cell', { name: 'Categoría: Conectividad' })).closest('tr');
  expect(within(row).getByText('24 h')).toBeInTheDocument();
  expect(within(row).getByText('01/11/2026 – sin fecha de fin')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Prioridad: Alta' })).toBeInTheDocument();

  const dialog = await openCreate(user);
  await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Equipos de cómputo');
  await user.click(within(dialog).getByRole('radio', { name: 'Por prioridad' }));
  expect(within(dialog).queryByLabelText('Categoría')).toBeNull();
  await user.selectOptions(within(dialog).getByLabelText('Prioridad'), 'Media');
  await fillHours(user, dialog, 12, 3);
  await user.type(within(dialog).getByLabelText('Vigente desde (opcional)'), '2026-12-01T08:00');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ prioridadId: '4', horasObjetivo: 12, horasAviso: 3, vigenteDesde: '2026-12-01T13:00:00Z' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findByRole('cell', { name: 'Prioridad: Media' })).toBeInTheDocument();
});

test('horas de aviso mayores que el objetivo no se envían', async () => {
  const calls = captureRequests('POST', '/api/v1/admin/sla-policies');
  const user = userEvent.setup();
  await renderPage();
  const dialog = await openCreate(user);
  await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Infraestructura');
  await fillHours(user, dialog, 4, 6);
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  expect(await within(dialog).findByText('Debe ser menor que las horas objetivo.')).toBeInTheDocument();
  expect(calls).toHaveLength(0);
});

test('la edición no permite cambiar el alcance', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/sla-policies/1');
  const user = userEvent.setup();
  await renderPage();
  const row = (await screen.findByRole('cell', { name: 'Categoría: Conectividad' })).closest('tr');
  await user.click(within(row).getByRole('button', { name: 'Editar' }));
  const dialog = await screen.findByRole('dialog', { name: 'Editar política' });
  expect(within(dialog).queryByRole('radio')).toBeNull();
  expect(within(dialog).queryByRole('combobox')).toBeNull();
  expect(within(dialog).getByText('Alcance: Categoría: Conectividad')).toBeInTheDocument();
  expect(within(dialog).getByLabelText('Vigente desde (opcional)')).toHaveValue('2026-11-01T00:00');
  const objetivo = within(dialog).getByLabelText('Horas objetivo');
  await user.clear(objetivo);
  await user.type(objetivo, '36');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ horasObjetivo: 36 });
  expect(await within(row).findByText('36 h')).toBeInTheDocument();
});

test('muestra el conflicto de vigencia junto al formulario', async () => {
  const user = userEvent.setup();
  await renderPage();
  const dialog = await openCreate(user);
  await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Conectividad');
  await fillHours(user, dialog, 12, 2);
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Ya hay una política activa para ese alcance en esas fechas.');
  expect(within(dialog).getByLabelText('Horas objetivo')).toHaveValue(12);
});
