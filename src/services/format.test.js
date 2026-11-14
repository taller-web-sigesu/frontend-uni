import { limaLocalToUtc, utcToLimaLocal,
  formatDateTime,
  formatDate,
  todayInLima,
  limaDaysToUtcRange,
  currentMonthInLima,
  formatBytes,
  REQUEST_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  ROLE_LABELS,
  countLabel,
  statusTone,
} from './format.js';

afterEach(() => vi.useRealTimers());

test('countLabel usa singular solo para uno', () => {
  expect(countLabel(0, 'solicitud')).toBe('0 solicitudes');
  expect(countLabel(1, 'solicitud')).toBe('1 solicitud');
  expect(countLabel(2, 'solicitud')).toBe('2 solicitudes');
  expect(countLabel(1, 'registrada', 'registradas')).toBe('1 registrada');
});

test('limaDaysToUtcRange convierte días de Lima a UTC con fin exclusivo', () => {
  expect(limaDaysToUtcRange('2026-11-01', '2026-11-30'))
    .toEqual({ fechaDesde: '2026-11-01T05:00:00Z', fechaHasta: '2026-12-01T05:00:00Z' });
});

test('limaDaysToUtcRange cruza fin de año', () => {
  expect(limaDaysToUtcRange('2026-12-31', '2026-12-31'))
    .toEqual({ fechaDesde: '2026-12-31T05:00:00Z', fechaHasta: '2027-01-01T05:00:00Z' });
});

test('formatDateTime muestra hora de Lima', () => {
  expect(formatDateTime('2026-11-06T15:00:00Z')).toBe('06/11/2026 10:00');
});

test('formatDate usa el día de Lima', () => {
  expect(formatDate('2026-11-07T03:00:00Z')).toBe('06/11/2026');
});

test('todayInLima y currentMonthInLima usan la fecha de Lima', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-12-01T03:00:00Z')); // 30/11 22:00 en Lima
  expect(todayInLima()).toBe('2026-11-30');
  expect(currentMonthInLima()).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' });
});

test('formatBytes', () => {
  expect(formatBytes(2097152)).toBe('2 MB');
  expect(formatBytes(1536)).toBe('1.5 KB');
  expect(formatBytes(500)).toBe('500 B');
});

test('etiquetas de códigos', () => {
  expect(REQUEST_STATUS_LABELS.EN_PROCESO).toBe('En proceso');
  expect(RESERVATION_STATUS_LABELS.CONFIRMADA).toBe('Confirmada');
  expect(ROLE_LABELS.TECNICO).toBe('Técnico');
  expect(statusTone('RECHAZADO')).toBe('danger');
  expect(statusTone('CERRADO')).toBe('success');
  expect(statusTone('DESCONOCIDO')).toBe('neutral');
});

test('limaLocalToUtc convierte datetime-local de Lima a UTC', () => {
  expect(limaLocalToUtc('2026-12-01T08:00')).toBe('2026-12-01T13:00:00Z');
  expect(limaLocalToUtc('2026-12-31T22:30')).toBe('2027-01-01T03:30:00Z');
  expect(limaLocalToUtc('')).toBeNull();
});

test('utcToLimaLocal da el valor de datetime-local en Lima', () => {
  expect(utcToLimaLocal('2026-11-01T05:00:00Z')).toBe('2026-11-01T00:00');
  expect(utcToLimaLocal('2027-01-01T03:30:00Z')).toBe('2026-12-31T22:30');
  expect(utcToLimaLocal(null)).toBe('');
});
