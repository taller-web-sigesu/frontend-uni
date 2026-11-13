import { request } from '../../services/http.js';

// Adaptador de /spaces y /reservations (backend-uni/docs/api/reservas.md).
// Fechas `YYYY-MM-DD` y horas `HH:mm` de Lima viajan tal cual.

const enc = encodeURIComponent;

export function listSpaces({ tipoEspacioId, pabellon, capacidadMinima, fecha, page = 0, size = 20 } = {}, signal) {
  return request('/spaces', { query: { tipoEspacioId, pabellon, capacidadMinima, fecha, page, size }, signal });
}

export function getAvailability(espacioId, fecha, signal) {
  return request(`/spaces/${enc(espacioId)}/availability`, { query: { fecha }, signal });
}

export function createReservation(data, signal) {
  return request('/reservations', { method: 'POST', body: data, signal });
}

export function listReservations({ vista, estado, fechaDesde, fechaHasta, page = 0, size = 20 } = {}, signal) {
  return request('/reservations', { query: { vista, estado, fechaDesde, fechaHasta, page, size }, signal });
}

export function getReservation(id, signal) {
  return request(`/reservations/${enc(id)}`, { signal });
}

export function listReservationHistory(id, signal) {
  return request(`/reservations/${enc(id)}/history`, { query: { page: 0, size: 100 }, signal });
}

export function changeReservationStatus(id, { estado, motivo }, signal) {
  const body = motivo ? { estado, motivo } : { estado };
  return request(`/reservations/${enc(id)}/status`, { method: 'PATCH', body, signal });
}
