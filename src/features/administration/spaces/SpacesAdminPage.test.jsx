import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { db, problem } from '../../../mocks/db.js';
import { server } from '../../../mocks/server.js';
import { renderWithRouter } from '../../../test/render.jsx';
import { captureRequests, userById } from '../../../test/users.js';

const ADMIN = '1';

afterEach(() => server.events.removeAllListeners());

async function renderTab(tab) {
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/admin/ambientes', session: { user: userById(ADMIN) } });
  expect(await screen.findByRole('heading', { name: 'Espacios y horarios' })).toBeInTheDocument();
  if (tab) await user.click(screen.getByRole('tab', { name: tab }));
  return user;
}

const rowOf = async (name) => (await screen.findByRole('cell', { name })).closest('tr');
const setTime = (dialog, label, value) => fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });

async function openSchedule(user, spaceName) {
  await user.click(within(await rowOf(spaceName)).getByRole('button', { name: 'Horario' }));
  const dialog = await screen.findByRole('dialog', { name: `Horario de ${spaceName}` });
  await within(dialog).findByLabelText('Abierto el lunes');
  return dialog;
}

test('crea un espacio con aforo positivo', async () => {
  const posts = captureRequests('POST', '/api/v1/admin/spaces');
  const user = await renderTab();
  expect(within(await rowOf('Laboratorio 204')).getByText('Laboratorio')).toBeInTheDocument();
  expect(within(await rowOf('Aula antigua')).getByText('Inactivo')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Crear espacio' }));
  const dialog = await screen.findByRole('dialog', { name: 'Crear espacio' });
  expect(within(within(dialog).getByLabelText('Tipo de espacio')).queryByRole('option', { name: 'Auditorio' })).toBeNull();
  await user.type(within(dialog).getByLabelText('Código'), 'D-201');
  await user.type(within(dialog).getByLabelText('Nombre'), 'Sala de estudio');
  await user.selectOptions(within(dialog).getByLabelText('Tipo de espacio'), 'Aula');
  await user.type(within(dialog).getByLabelText('Capacidad'), '0');
  await user.type(within(dialog).getByLabelText('Pabellón (opcional)'), 'D');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  expect(await within(dialog).findByText('Usa un número entero mayor que cero.')).toBeInTheDocument();
  expect(posts).toHaveLength(0);
  await user.clear(within(dialog).getByLabelText('Capacidad'));
  await user.type(within(dialog).getByLabelText('Capacidad'), '30');
  await user.selectOptions(within(dialog).getByLabelText('Área (opcional)'), 'Biblioteca');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(posts).toHaveLength(1));
  expect(posts[0].body).toEqual({
    codigo: 'D-201', nombre: 'Sala de estudio', tipoEspacioId: '1', capacidad: 30, areaId: '4', pabellon: 'D',
  });
  expect(await screen.findByRole('cell', { name: 'Sala de estudio' })).toBeInTheDocument();
});

test('el horario envía solo días abiertos con diaSemana 1 a 7', async () => {
  const puts = captureRequests('PUT', '/api/v1/admin/spaces/5/schedule');
  const user = await renderTab();
  const dialog = await openSchedule(user, 'Aula antigua');
  expect(within(dialog).getByLabelText('Abierto el domingo')).not.toBeChecked();
  await user.click(within(dialog).getByLabelText('Abierto el lunes'));
  setTime(dialog, 'Apertura del lunes', '08:00');
  setTime(dialog, 'Cierre del lunes', '12:00');
  await user.click(within(dialog).getByLabelText('Abierto el miércoles'));
  setTime(dialog, 'Apertura del miércoles', '14:00');
  setTime(dialog, 'Cierre del miércoles', '18:30');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar horario' }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0].body).toEqual({
    franjas: [
      { diaSemana: 1, horaApertura: '08:00', horaCierre: '12:00' },
      { diaSemana: 3, horaApertura: '14:00', horaCierre: '18:30' },
    ],
  });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findByText('Horario de Aula antigua guardado')).toBeInTheDocument();
});

test('rechaza cierre anterior o igual a la apertura', async () => {
  const puts = captureRequests('PUT', '/api/v1/admin/spaces/3/schedule');
  const user = await renderTab();
  const dialog = await openSchedule(user, 'Laboratorio 204');
  expect(within(dialog).getByLabelText('Apertura del lunes')).toHaveValue('08:00');
  setTime(dialog, 'Cierre del lunes', '08:00');
  setTime(dialog, 'Apertura del martes', '19:00');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar horario' }));
  expect(await within(dialog).findAllByText('El cierre debe ser posterior a la apertura.')).toHaveLength(2);
  expect(puts).toHaveLength(0);
});

test('conserva el horario tras un 400', async () => {
  server.use(http.put('/api/v1/admin/spaces/:id/schedule', () => problem(400, 'VALIDACION', 'El horario no es válido.')));
  const user = await renderTab();
  const dialog = await openSchedule(user, 'Laboratorio 204');
  await user.click(within(dialog).getByLabelText('Abierto el domingo'));
  setTime(dialog, 'Cierre del lunes', '20:00');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar horario' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('El horario no es válido.');
  expect(within(dialog).getByLabelText('Abierto el domingo')).not.toBeChecked();
  expect(within(dialog).getByLabelText('Cierre del lunes')).toHaveValue('20:00');
  expect(screen.getByRole('dialog', { name: 'Horario de Laboratorio 204' })).toBeInTheDocument();
});

test('la política valida máximo mayor o igual al mínimo', async () => {
  const puts = captureRequests('PUT', '/api/v1/admin/reservation-policy');
  const user = await renderTab('Política de reservas');
  const max = await screen.findByLabelText('Duración máxima (min)');
  expect(max).toHaveValue(240);
  await user.clear(max);
  await user.type(max, '20');
  await user.click(screen.getByRole('button', { name: 'Guardar política' }));
  expect(await screen.findByText('Debe ser mayor o igual a la duración mínima.')).toBeInTheDocument();
  expect(puts).toHaveLength(0);
  await user.clear(max);
  await user.type(max, '180');
  const limit = screen.getByLabelText('Reservas activas por día');
  await user.clear(limit);
  await user.type(limit, '3');
  await user.click(screen.getByRole('button', { name: 'Guardar política' }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0].body).toEqual({
    duracionMinimaMinutos: 30, duracionMaximaMinutos: 180, horasAnticipacionMinima: 1, diasAnticipacionMaxima: 30, maxReservasActivasPorDia: 3,
  });
  expect(await screen.findByText('Política guardada')).toBeInTheDocument();
});

test('sin política vigente muestra el formulario vacío', async () => {
  db.reservationPolicy = null;
  await renderTab('Política de reservas');
  expect(await screen.findByText('Todavía no hay una política vigente')).toBeInTheDocument();
  expect(screen.getByLabelText('Duración mínima (min)')).toHaveValue(null);
  expect(screen.getByLabelText('Reservas activas por día')).toHaveValue(null);
  expect(screen.getByRole('button', { name: 'Guardar política' })).toBeEnabled();
});
