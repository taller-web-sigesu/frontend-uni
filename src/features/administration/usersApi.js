import { request } from '../../services/http.js';

// Adaptador de /admin/users y /admin/roles (backend-uni/docs/api/usuarios.md).

const base = (id) => `/admin/users/${encodeURIComponent(id)}`;

export function listUsers({ page = 0, size = 20 } = {}, signal) {
  return request('/admin/users', { query: { page, size }, signal });
}

export function getUser(id, signal) {
  return request(base(id), { signal });
}

export function createUser(data, signal) {
  return request('/admin/users', { method: 'POST', body: data, signal });
}

export function updateUser(id, patch, signal) {
  return request(base(id), { method: 'PATCH', body: patch, signal });
}

export function listRoles(signal) {
  return request('/admin/roles', { signal });
}

export function listPendingAccounts({ page = 0, size = 20 } = {}, signal) {
  return request('/admin/users/pending', { query: { page, size }, signal });
}

/** `estadoCuenta`: ACTIVA (aprobar) o RECHAZADA (con motivo). */
export function decideAccount(id, { estadoCuenta, motivo }, signal) {
  const body = { estadoCuenta };
  if (motivo !== undefined) body.motivo = motivo;
  return request(`${base(id)}/account-status`, { method: 'PATCH', body, signal });
}

/** Devuelve `{ contrasenaTemporal }`; se muestra una sola vez. */
export function resetPassword(id, signal) {
  return request(`${base(id)}/password-reset`, { method: 'POST', signal });
}
