import { request } from '../../services/http.js';

// Adaptador de /admin/catalogs/** (backend-uni/docs/api/catalogos.md).
// `kind`: 'areas' | 'categories' | 'priorities'.

const KINDS = ['areas', 'categories', 'priorities'];

function path(kind, id) {
  if (!KINDS.includes(kind)) throw new Error(`Catálogo desconocido: ${kind}`);
  return id === undefined ? `/admin/catalogs/${kind}` : `/admin/catalogs/${kind}/${encodeURIComponent(id)}`;
}

export function list(kind, { page = 0, size = 20 } = {}, signal) {
  return request(path(kind), { query: { page, size }, signal });
}

export function create(kind, data, signal) {
  return request(path(kind), { method: 'POST', body: data, signal });
}

export function update(kind, id, patch, signal) {
  return request(path(kind, id), { method: 'PATCH', body: patch, signal });
}

/** Todos los registros (activos e inactivos) para selectores y nombres. */
export async function listAll(kind, signal) {
  const page = await list(kind, { page: 0, size: 100 }, signal);
  return page.items;
}

export function listRequestStatuses(signal) {
  return request('/admin/catalogs/request-statuses', { signal });
}

export function renameRequestStatus(id, nombre, signal) {
  return request(`/admin/catalogs/request-statuses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { nombre },
    signal,
  });
}
