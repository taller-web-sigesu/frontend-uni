import { db } from '../../mocks/db.js';
import { server } from '../../mocks/server.js';
import { signInAs } from '../../test/session.js';
import { captureRequests } from '../../test/users.js';
import { getPolicy, putSchedule } from '../administration/spacesAdminApi.js';
import {
  changeReservationStatus, createReservation, getAvailability, listReservations, listSpaces,
} from './reservationsApi.js';

const ANA = 'ana.demo@universidad.example';
const PEDRO = 'pedro.demo@universidad.example';
const SUPERVISOR_TI = 'supervisor.ti.demo@universidad.example';
const ADMIN = 'admin.demo@universidad.example';

afterEach(() => server.events.removeAllListeners());

const seed = (id) => db.reservations.find((r) => r.id === id);

test('getAvailability envía la fecha tal cual', async () => {
  signInAs(ANA);
  const calls = captureRequests('GET', '/api/v1/spaces/3/availability');
  const { fecha } = seed('1');
  const result = await getAvailability('3', fecha);
  expect(calls[0].url.searchParams.get('fecha')).toBe(fecha);
  expect(result.fecha).toBe(fecha);
  expect(result.ocupadas).toEqual(expect.arrayContaining([{ horaInicio: '10:00', horaFin: '11:00' }]));
  expect(result.libres[0]).toEqual({ horaInicio: '08:00', horaFin: '10:00' });

  const spaces = await listSpaces({ tipoEspacioId: '2', fecha });
  expect(spaces.items.map((s) => s.nombre)).toEqual(['Laboratorio 204', 'Laboratorio 301']);
  expect(spaces.items[0]).toEqual(expect.objectContaining({ tipo: { id: '2', nombre: 'Laboratorio' }, capacidad: 24 }));
});

test('createReservation solapada devuelve 409', async () => {
  signInAs(ANA);
  const { fecha } = seed('1');
  const body = { espacioId: '3', fecha, horaInicio: '10:30', horaFin: '11:30', motivo: 'Práctica' };
  await expect(createReservation(body)).rejects.toMatchObject({ status: 409, codigo: 'FRANJA_OCUPADA' });
  const created = await createReservation({ ...body, horaInicio: '12:00', horaFin: '13:00', numAsistentes: 10 });
  expect(created).toEqual(expect.objectContaining({ estado: 'PENDIENTE', codigo: expect.stringMatching(/^RES-2026-/) }));
  await expect(createReservation({ ...body, horaInicio: '12:30', horaFin: '13:30' })).rejects.toMatchObject({ status: 409 });
});

test('vista gestion para estudiante devuelve 403', async () => {
  signInAs(ANA);
  await expect(listReservations({ vista: 'gestion' })).rejects.toMatchObject({ status: 403 });
  const own = await listReservations({});
  expect(own.items.every((r) => seed(r.id).solicitanteId === '8')).toBe(true);
  // Quien no ve la reserva recibe 404; quien la gestiona sin ser dueño, 403 al cancelar.
  signInAs(PEDRO);
  await expect(changeReservationStatus('1', { estado: 'CANCELADA' })).rejects.toMatchObject({ status: 404 });
  signInAs(SUPERVISOR_TI);
  await expect(changeReservationStatus('1', { estado: 'CANCELADA' })).rejects.toMatchObject({ status: 403, codigo: 'CANCELACION_NO_PERMITIDA' });
  // La supervisora no aprueba su propia reserva.
  const calls = captureRequests('GET', '/api/v1/reservations');
  const pending = await listReservations({ vista: 'gestion', estado: 'PENDIENTE' });
  expect(calls[0].url.searchParams.get('vista')).toBe('gestion');
  expect(pending.items.length).toBeGreaterThan(0);
  const mine = pending.items.find((r) => seed(r.id).solicitanteId === '2');
  await expect(changeReservationStatus(mine.id, { estado: 'CONFIRMADA' })).rejects.toMatchObject({ status: 403 });
  // El administrador sin política vigente recibe 404; el horario se sustituye.
  signInAs(ADMIN);
  db.reservationPolicy = null;
  await expect(getPolicy()).rejects.toMatchObject({ status: 404 });
  const saved = await putSchedule('1', [{ diaSemana: 1, horaApertura: '08:00', horaCierre: '12:00' }]);
  expect(saved.franjas).toEqual([{ diaSemana: 1, horaApertura: '08:00', horaCierre: '12:00' }]);
});
