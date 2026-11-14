import { request } from '../../services/http.js';

// Adaptador de /admin/spaces*, /admin/space-types y /admin/reservation-policy
// (backend-uni/docs/api/reservas.md).

const enc = encodeURIComponent;

/** Áreas (activas e inactivas) para el selector del espacio. */
export async function listAreas(signal) {
  const page = await request('/admin/catalogs/areas', { query: { page: 0, size: 100 }, signal });
  return page.items;
}

export function listSpaces({ page = 0, size = 20 } = {}, signal) {
  return request('/admin/spaces', { query: { page, size }, signal });
}

export function createSpace(data, signal) {
  return request('/admin/spaces', { method: 'POST', body: data, signal });
}

export function updateSpace(id, patch, signal) {
  return request(`/admin/spaces/${enc(id)}`, { method: 'PATCH', body: patch, signal });
}

export function listSpaceTypes({ page = 0, size = 20 } = {}, signal) {
  return request('/admin/space-types', { query: { page, size }, signal });
}

export function createSpaceType(data, signal) {
  return request('/admin/space-types', { method: 'POST', body: data, signal });
}

export function updateSpaceType(id, patch, signal) {
  return request(`/admin/space-types/${enc(id)}`, { method: 'PATCH', body: patch, signal });
}

export function getSchedule(id, signal) {
  return request(`/admin/spaces/${enc(id)}/schedule`, { signal });
}

/** Sustituye el horario semanal completo; los días omitidos quedan cerrados. */
export function putSchedule(id, franjas, signal) {
  return request(`/admin/spaces/${enc(id)}/schedule`, { method: 'PUT', body: { franjas }, signal });
}

export function getPolicy(signal) {
  return request('/admin/reservation-policy', { signal });
}

export function putPolicy(data, signal) {
  return request('/admin/reservation-policy', { method: 'PUT', body: data, signal });
}
