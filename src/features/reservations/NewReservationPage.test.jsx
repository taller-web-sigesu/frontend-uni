import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { db } from '../../mocks/db.js';
import { server } from '../../mocks/server.js';
import { todayInLima } from '../../services/format.js';
import { renderWithRouter } from '../../test/render.jsx';
import { ANA, captureRequests, userById } from '../../test/users.js';

afterEach(() => server.events.removeAllListeners());

const plusDays = (days) => {
  const [y, m, d] = todayInLima().split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** Próximo domingo (al menos dentro de 2 días, para la anticipación). */
function nextSunday() {
  for (let i = 2; i < 10; i += 1) {
    const day = plusDays(i);
    const [y, m, d] = day.split('-').map(Number);
    if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0) return day;
  }
  return null;
}

async function openPage() {
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/reservas/nueva', session: { user: userById(ANA) } });
  await screen.findByRole('heading', { name: 'Reservar ambiente' });
  await screen.findByRole('option', { name: 'Laboratorio' });
  return user;
}

const setValue = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const spaceList = () => screen.getByRole('list', { name: 'Espacios disponibles' });

async function chooseSpace(user, name, fecha = plusDays(3)) {
  setValue('Fecha', fecha);
  const item = (await within(spaceList()).findByText(name)).closest('li');
  await user.click(within(item).getByRole('button', { name: `Elegir ${name}` }));
  return screen.findByRole('list', { name: /^Franjas del/ });
}

test('filtra espacios y muestra su horario', async () => {
  const calls = captureRequests('GET', '/api/v1/spaces');
  const user = await openPage();
  setValue('Fecha', plusDays(3));
  await user.selectOptions(screen.getByLabelText('Tipo de espacio'), 'Laboratorio');
  await user.type(screen.getByLabelText('Capacidad mínima'), '22');
  await waitFor(() => expect(within(spaceList()).getAllByRole('listitem')).toHaveLength(1));
  const item = within(spaceList()).getByRole('listitem');
  expect(item).toHaveTextContent('Laboratorio 204');
  expect(item).toHaveTextContent('Laboratorio · B · Capacidad 24');
  expect(item).toHaveTextContent('Horario 08:00–18:00');
  const last = calls.at(-1).url.searchParams;
  expect(last.get('tipoEspacioId')).toBe('2');
  expect(last.get('capacidadMinima')).toBe('22');
  expect(last.get('fecha')).toBe(plusDays(3));
});

test('muestra franjas libres y ocupadas como texto', async () => {
  const user = await openPage();
  const slots = await chooseSpace(user, 'Laboratorio 204');
  const texts = within(slots).getAllByRole('listitem').map((li) => li.textContent);
  expect(texts).toEqual([
    '08:00–10:00 libre',
    '10:00–11:00 ocupada',
    '11:00–14:00 libre',
    '14:00–16:00 ocupada',
    '16:00–18:00 libre',
  ]);
});

test('no envía una franja fuera de las libres', async () => {
  const posts = captureRequests('POST', '/api/v1/reservations');
  const user = await openPage();
  await chooseSpace(user, 'Laboratorio 204');
  setValue('Hora de inicio', '09:30');
  setValue('Hora de fin', '10:30');
  await user.type(screen.getByLabelText('Motivo'), 'Práctica');
  await user.click(screen.getByRole('button', { name: 'Registrar reserva' }));
  expect(await screen.findByText('La franja debe quedar dentro de un horario libre.')).toBeInTheDocument();
  expect(posts).toHaveLength(0);
});

test('registra y muestra el código pendiente', async () => {
  const posts = captureRequests('POST', '/api/v1/reservations');
  const user = await openPage();
  await chooseSpace(user, 'Laboratorio 204');
  setValue('Hora de inicio', '11:00');
  setValue('Hora de fin', '12:30');
  await user.type(screen.getByLabelText('Motivo'), '  Sesión de repaso ');
  await user.type(screen.getByLabelText('Asistentes (opcional)'), '12');
  await user.click(screen.getByRole('button', { name: 'Registrar reserva' }));
  const status = await screen.findByRole('status');
  expect(status).toHaveTextContent('Reserva registrada, pendiente de aprobación');
  expect(status).toHaveTextContent(/RES-2026-\d{6}/);
  expect(within(status).getByRole('link', { name: 'Ver mis reservas' })).toHaveAttribute('href', '/reservas');
  expect(posts[0].body).toEqual({
    espacioId: '3', fecha: plusDays(3), horaInicio: '11:00', horaFin: '12:30', motivo: 'Sesión de repaso', numAsistentes: 12,
  });
});

test('conserva datos y recarga tras 409', async () => {
  const availability = captureRequests('GET', '/api/v1/spaces/3/availability');
  const user = await openPage();
  await chooseSpace(user, 'Laboratorio 204');
  setValue('Hora de inicio', '12:00');
  setValue('Hora de fin', '13:00');
  await user.type(screen.getByLabelText('Motivo'), 'Práctica');
  await user.type(screen.getByLabelText('Asistentes (opcional)'), '10');
  // Otra persona ocupa la franja entre la consulta y el envío.
  db.reservations.push({
    ...db.reservations.find((r) => r.id === '5'), id: '900', codigo: 'RES-2026-000900', horaInicio: '12:00', horaFin: '13:00',
  });
  await user.click(screen.getByRole('button', { name: 'Registrar reserva' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('La franja elegida ya no está disponible. Elige otra.');
  expect(screen.getByLabelText('Motivo')).toHaveValue('Práctica');
  expect(screen.getByLabelText('Asistentes (opcional)')).toHaveValue(10);
  expect(screen.getByLabelText('Hora de inicio')).toHaveValue('');
  expect(screen.getByLabelText('Hora de fin')).toHaveValue('');
  await waitFor(() => expect(availability).toHaveLength(2));
  expect(await screen.findByText('12:00–13:00 ocupada')).toBeInTheDocument();
});

test('día cerrado sin franjas', async () => {
  const posts = captureRequests('POST', '/api/v1/reservations');
  const user = await openPage();
  const sunday = nextSunday();
  setValue('Fecha', sunday);
  const item = (await within(spaceList()).findByText('Aula 101')).closest('li');
  expect(item).toHaveTextContent('Cerrado este día');
  await user.click(within(item).getByRole('button', { name: 'Elegir Aula 101' }));
  expect(await screen.findByText('No hay disponibilidad para la fecha seleccionada')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Registrar reserva' })).toBeDisabled();
  expect(posts).toHaveLength(0);
});

test('asistentes debe ser positivo', async () => {
  const posts = captureRequests('POST', '/api/v1/reservations');
  const user = await openPage();
  await chooseSpace(user, 'Laboratorio 204');
  setValue('Hora de inicio', '08:00');
  setValue('Hora de fin', '09:00');
  await user.type(screen.getByLabelText('Motivo'), 'Práctica');
  await user.type(screen.getByLabelText('Asistentes (opcional)'), '0');
  await user.click(screen.getByRole('button', { name: 'Registrar reserva' }));
  expect(await screen.findByText('Usa un número entero mayor que cero.')).toBeInTheDocument();
  expect(posts).toHaveLength(0);
});

test('no usa la disponibilidad de otro espacio mientras carga', async () => {
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  server.use(http.get('/api/v1/spaces/4/availability', async () => {
    await held;
    return HttpResponse.json({ espacioId: '4', fecha: plusDays(3), horario: null, libres: [], ocupadas: [] });
  }));
  const user = await openPage();
  await chooseSpace(user, 'Laboratorio 204');
  expect(screen.getByText('10:00–11:00 ocupada')).toBeInTheDocument();
  const item = within(spaceList()).getByText('Laboratorio 301').closest('li');
  await user.click(within(item).getByRole('button', { name: 'Elegir Laboratorio 301' }));
  // Mientras llega la del Laboratorio 301 no se muestran ni se usan las franjas del 204.
  await waitFor(() => expect(screen.queryByText('10:00–11:00 ocupada')).toBeNull());
  expect(screen.getByRole('button', { name: 'Registrar reserva' })).toBeDisabled();
  release();
  expect(await screen.findByText('No hay disponibilidad para la fecha seleccionada')).toBeInTheDocument();
});

test('muestra el pabellón tal como lo guarda el backend', async () => {
  db.spaces.find((s) => s.id === '3').pabellon = 'Pabellón nuevo';
  db.spaces.find((s) => s.id === '4').pabellon = '';
  await openPage();
  setValue('Tipo de espacio', '2');
  const lab204 = (await within(spaceList()).findByText('Laboratorio 204')).closest('li');
  expect(lab204).toHaveTextContent('Laboratorio · Pabellón nuevo · Capacidad 24');
  const lab301 = within(spaceList()).getByText('Laboratorio 301').closest('li');
  expect(lab301).toHaveTextContent('Laboratorio · Capacidad 20');
});
