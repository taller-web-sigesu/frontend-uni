// Reglas puras de reservas. Fechas y horas son texto de Lima
// (`YYYY-MM-DD`, `HH:mm`) y se comparan como texto, sin pasar por `Date`.

const limaClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const DECIDERS = ['SUPERVISOR', 'ADMINISTRADOR'];
const CANCELLABLE = ['PENDIENTE', 'CONFIRMADA'];

/** Fecha y hora actuales en Lima, sea cual sea la zona del navegador. */
export function nowInLima(now = new Date()) {
  const p = Object.fromEntries(limaClock.formatToParts(now).map((part) => [part.type, part.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

/** Solo el propietario, con la reserva pendiente o confirmada y antes de su inicio. */
export function canCancel(reserva, usuario, ahora = nowInLima()) {
  if (!reserva || !usuario || reserva.solicitanteId !== usuario.id) return false;
  if (!CANCELLABLE.includes(reserva.estado)) return false;
  return `${reserva.fecha} ${reserva.horaInicio}` > `${ahora.fecha} ${ahora.hora}`;
}

/**
 * Supervisor o administrador sobre una pendiente ajena. El servidor impide
 * decidir (aprobar o rechazar) la propia reserva y limita al área.
 */
export function canApprove(detalle, usuario) {
  if (!detalle || !usuario || !DECIDERS.includes(usuario.rol)) return false;
  return detalle.estado === 'PENDIENTE' && detalle.solicitanteId !== usuario.id;
}

/** La franja `[horaInicio, horaFin)` cabe entera dentro de alguna franja libre. */
export function slotFits(libres, horaInicio, horaFin) {
  if (!horaInicio || !horaFin || horaInicio >= horaFin) return false;
  return (libres || []).some((libre) => libre.horaInicio <= horaInicio && horaFin <= libre.horaFin);
}
