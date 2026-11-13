import {
  formatDateTime,
  formatDate,
  todayInLima,
  limaDaysToUtcRange,
  currentMonthInLima,
  formatBytes,
  REQUEST_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  ROLE_LABELS,
  statusTone,
} from './format.js';

afterEach(() => vi.useRealTimers());

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
