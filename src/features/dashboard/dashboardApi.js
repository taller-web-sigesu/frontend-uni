import { request } from '../../services/http.js';

// Adaptador de /dashboard/** (backend-uni/docs/api/dashboard.md). Rango en
// instantes UTC: inicio inclusivo, fin exclusivo. Sin `areaId` = todas (admin)
// o la del supervisor.

export function getSummary({ fechaDesde, fechaHasta, areaId }, signal) {
  return request('/dashboard/summary', { query: { fechaDesde, fechaHasta, areaId }, signal });
}

/** CSV con los mismos filtros: devuelve `{ blob, filename }`. */
export function downloadReport({ tipo, fechaDesde, fechaHasta, areaId }, signal) {
  return request('/dashboard/reports', {
    query: { tipo, fechaDesde, fechaHasta, areaId },
    responseType: 'blob',
    signal,
  });
}
