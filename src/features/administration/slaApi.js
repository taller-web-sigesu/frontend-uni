import { request } from '../../services/http.js';

// Adaptador de /admin/sla-policies (backend-uni/docs/api/calidad-servicio.md).

export function listPolicies({ page = 0, size = 20 } = {}, signal) {
  return request('/admin/sla-policies', { query: { page, size }, signal });
}

/** Exactamente uno de `categoriaId` o `prioridadId`. */
export function createPolicy(data, signal) {
  return request('/admin/sla-policies', { method: 'POST', body: data, signal });
}

/** El alcance no se cambia: solo plazos, vigencia o `activo`. */
export function updatePolicy(id, patch, signal) {
  return request(`/admin/sla-policies/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, signal });
}
