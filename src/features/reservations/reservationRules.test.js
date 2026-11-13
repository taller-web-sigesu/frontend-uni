import { canApprove, canCancel, nowInLima, slotFits } from './reservationRules.js';

const ANA = { id: '8', rol: 'ESTUDIANTE' };
const SUPERVISOR = { id: '2', rol: 'SUPERVISOR' };
const AHORA = { fecha: '2026-11-16', hora: '09:30' };
const base = { id: '1', solicitanteId: '8', fecha: '2026-11-16', horaInicio: '10:00', horaFin: '11:00', estado: 'PENDIENTE' };

afterEach(() => vi.useRealTimers());

test('canCancel solo propietario, pendiente o confirmada y antes del inicio', () => {
  expect(canCancel(base, ANA, AHORA)).toBe(true);
  expect(canCancel({ ...base, estado: 'CONFIRMADA' }, ANA, AHORA)).toBe(true);
  expect(canCancel({ ...base, estado: 'RECHAZADA' }, ANA, AHORA)).toBe(false);
  expect(canCancel({ ...base, estado: 'CANCELADA' }, ANA, AHORA)).toBe(false);
  expect(canCancel({ ...base, solicitanteId: '9' }, ANA, AHORA)).toBe(false);
  expect(canCancel({ ...base, horaInicio: '09:30' }, ANA, AHORA)).toBe(false);
  expect(canCancel({ ...base, fecha: '2026-11-15', horaInicio: '23:00' }, ANA, AHORA)).toBe(false);
  expect(canCancel(base, null, AHORA)).toBe(false);
});

test('canCancel usa la hora de Lima', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  // 14:30 UTC = 09:30 en Lima (UTC−5), sea cual sea la zona del navegador.
  vi.setSystemTime(new Date('2026-11-16T14:30:00Z'));
  expect(nowInLima()).toEqual({ fecha: '2026-11-16', hora: '09:30' });
  expect(canCancel(base, ANA)).toBe(true);
  expect(canCancel({ ...base, horaInicio: '09:00' }, ANA)).toBe(false);
  // 03:00 UTC del 17 sigue siendo el 16 en Lima.
  vi.setSystemTime(new Date('2026-11-17T03:00:00Z'));
  expect(nowInLima()).toEqual({ fecha: '2026-11-16', hora: '22:00' });
});

test('canApprove impide la autoaprobación', () => {
  const ajena = { ...base, solicitanteId: '9' };
  expect(canApprove(ajena, SUPERVISOR)).toBe(true);
  expect(canApprove(ajena, { id: '1', rol: 'ADMINISTRADOR' })).toBe(true);
  expect(canApprove({ ...ajena, solicitanteId: '2' }, SUPERVISOR)).toBe(false);
  expect(canApprove({ ...ajena, estado: 'CONFIRMADA' }, SUPERVISOR)).toBe(false);
  expect(canApprove(ajena, ANA)).toBe(false);
});

test('slotFits exige que la franja quede dentro de una libre', () => {
  const libres = [{ horaInicio: '08:00', horaFin: '10:00' }, { horaInicio: '11:00', horaFin: '18:00' }];
  expect(slotFits(libres, '08:30', '09:30')).toBe(true);
  expect(slotFits(libres, '08:00', '10:00')).toBe(true);
  expect(slotFits(libres, '09:30', '10:30')).toBe(false);
  expect(slotFits(libres, '09:00', '12:00')).toBe(false);
  expect(slotFits(libres, '12:00', '11:30')).toBe(false);
  expect(slotFits(libres, '', '10:00')).toBe(false);
  expect(slotFits([], '08:30', '09:30')).toBe(false);
});
