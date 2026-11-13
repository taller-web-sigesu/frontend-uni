import { request } from '../../services/http.js';

// Adaptador de /requests/** (backend-uni/docs/api/solicitudes.md, atencion.md y
// calidad-servicio.md). Todas devuelven el JSON del contrato tal cual.

const base = (id) => `/requests/${encodeURIComponent(id)}`;

export function listRequests({ page = 0, size = 20, estado, categoriaId, prioridadId } = {}, signal) {
  return request('/requests', { query: { page, size, estado, categoriaId, prioridadId }, signal });
}

export function getRequest(id, signal) {
  return request(base(id), { signal });
}

export function createRequest({ categoriaId, ubicacion, descripcion }, signal) {
  return request('/requests', { method: 'POST', body: { categoriaId, ubicacion, descripcion }, signal });
}

export function listHistory(id, { page = 0, size = 100 } = {}, signal) {
  return request(`${base(id)}/history`, { query: { page, size }, signal });
}

export function listComments(id, { page = 0, size = 100 } = {}, signal) {
  return request(`${base(id)}/comments`, { query: { page, size }, signal });
}

export function addComment(id, contenido, signal) {
  return request(`${base(id)}/comments`, { method: 'POST', body: { contenido }, signal });
}

export function listAttachments(id, signal) {
  return request(`${base(id)}/attachments`, { signal });
}

export function uploadAttachment(id, file, signal) {
  const formData = new FormData();
  formData.append('archivo', file, file.name);
  return request(`${base(id)}/attachments`, { method: 'POST', formData, signal });
}

/** Descarga con Bearer: devuelve `{ blob, filename }`. */
export function downloadAttachment(id, attachmentId, signal) {
  return request(`${base(id)}/attachments/${encodeURIComponent(attachmentId)}/content`, {
    responseType: 'blob',
    signal,
  });
}

export function deleteAttachment(id, attachmentId, signal) {
  return request(`${base(id)}/attachments/${encodeURIComponent(attachmentId)}`, { method: 'DELETE', signal });
}

export function listEligibleTechnicians(id, signal) {
  return request(`${base(id)}/eligible-technicians`, { query: { page: 0, size: 100 }, signal });
}

export function assign(id, { tecnicoId, prioridadId }, signal) {
  const body = { tecnicoId };
  if (prioridadId) body.prioridadId = prioridadId;
  return request(`${base(id)}/assignments`, { method: 'POST', body, signal });
}

export function changePriority(id, prioridadId, signal) {
  return request(base(id), { method: 'PATCH', body: { prioridadId }, signal });
}

/** Solo transiciones de estado: la asignación va por `assign` (nunca `ASIGNADO` aquí). */
export function changeStatus(id, { estado, motivo }, signal) {
  const body = { estado };
  if (motivo !== undefined) body.motivo = motivo;
  return request(`${base(id)}/status`, { method: 'PATCH', body, signal });
}

export function listAuditEvents(id, { page = 0, size = 20 } = {}, signal) {
  return request(`${base(id)}/audit-events`, { query: { page, size }, signal });
}

export function submitSurvey(id, { calificacion, comentario }, signal) {
  const body = { calificacion };
  if (comentario?.trim()) body.comentario = comentario.trim();
  return request(`${base(id)}/survey`, { method: 'POST', body, signal });
}
