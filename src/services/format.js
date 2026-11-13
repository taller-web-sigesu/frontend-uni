const LIMA = 'America/Lima';
// Lima no tiene horario de verano: siempre UTC−5.
const LIMA_OFFSET_HOURS = 5;

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: LIMA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function limaParts(date) {
  return Object.fromEntries(
    partsFormatter.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );
}

export function formatDateTime(isoUtc) {
  if (!isoUtc) return '';
  const p = limaParts(new Date(isoUtc));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

export function formatDate(isoUtc) {
  if (!isoUtc) return '';
  const p = limaParts(new Date(isoUtc));
  return `${p.day}/${p.month}/${p.year}`;
}

export function todayInLima(now = new Date()) {
  const p = limaParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}

function limaMidnightUtc(day, addDays = 0) {
  const [year, month, date] = day.split('-').map(Number);
  const instant = new Date(Date.UTC(year, month - 1, date + addDays, LIMA_OFFSET_HOURS));
  return instant.toISOString().replace('.000Z', 'Z');
}

/** Días de Lima a instantes UTC: inicio inclusivo, fin exclusivo (día siguiente a `hasta`). */
export function limaDaysToUtcRange(desde, hasta) {
  return { fechaDesde: limaMidnightUtc(desde), fechaHasta: limaMidnightUtc(hasta, 1) };
}

/** `YYYY-MM-DDTHH:mm` (datetime-local, hora de Lima) a instante UTC; vacío = `null`. */
export function limaLocalToUtc(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + LIMA_OFFSET_HOURS, minute)).toISOString().replace('.000Z', 'Z');
}

/** Instante UTC al valor de un datetime-local en hora de Lima; sin valor = ''. */
export function utcToLimaLocal(isoUtc) {
  if (!isoUtc) return '';
  const p = limaParts(new Date(isoUtc));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function currentMonthInLima(now = new Date()) {
  const [year, month] = todayInLima(now).split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, '0');
  return { desde: `${year}-${mm}-01`, hasta: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} ${units[unit]}`;
}

export const REQUEST_STATUS_LABELS = {
  NUEVO: 'Nuevo',
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  RECHAZADO: 'Rechazado',
};

export const RESERVATION_STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

export const ROLE_LABELS = {
  ESTUDIANTE: 'Estudiante',
  DOCENTE: 'Docente',
  TECNICO: 'Técnico',
  SUPERVISOR: 'Supervisor',
  ADMINISTRADOR: 'Administrador',
};

const TONES = {
  NUEVO: 'info',
  ASIGNADO: 'info',
  EN_PROCESO: 'warning',
  RESUELTO: 'success',
  CERRADO: 'success',
  RECHAZADO: 'danger',
  PENDIENTE: 'warning',
  CONFIRMADA: 'success',
  RECHAZADA: 'danger',
  CANCELADA: 'neutral',
};

export function statusTone(code) {
  return TONES[code] || 'neutral';
}
