import { http, HttpResponse } from 'msw';
import { db, problem, requireUser } from '../db.js';

const PENDING = ['NUEVO', 'ASIGNADO', 'EN_PROCESO'];
const ATTENDED = ['RESUELTO', 'CERRADO'];
const REQUEST_HEADER = 'codigo,categoria,area,estado,prioridad,responsable,creadoEn';

const forbidden = () => problem(403, 'ACCESO_DENEGADO', 'No tienes permiso para consultar esa área.');

/** Filtros efectivos o la respuesta de error (400 rango, 403 alcance). */
function filtersFrom(request) {
  const user = requireUser(request, ['SUPERVISOR', 'ADMINISTRADOR']);
  if (user instanceof Response) return { error: user };
  const params = new URL(request.url).searchParams;
  const fechaDesde = params.get('fechaDesde');
  const fechaHasta = params.get('fechaHasta');
  const from = Date.parse(fechaDesde);
  const to = Date.parse(fechaHasta);
  if (Number.isNaN(from) || Number.isNaN(to) || from >= to) {
    return { error: problem(400, 'RANGO_INVALIDO', 'El intervalo de fechas está vacío o invertido.') };
  }
  let areaId = params.get('areaId') || null;
  if (user.rol === 'SUPERVISOR') {
    if (areaId && areaId !== user.areaId) return { error: forbidden() };
    areaId = user.areaId;
  }
  const rows = db.requests.filter((r) => {
    const created = Date.parse(r.creadoEn);
    return created >= from && created < to && (!areaId || r.areaId === areaId);
  });
  return { filtros: { fechaDesde, fechaHasta, areaId }, rows, params };
}

function groupBy(rows, key) {
  const totals = new Map();
  rows.forEach((row) => {
    const id = key(row) ?? null;
    totals.set(id, (totals.get(id) || 0) + 1);
  });
  return [...totals].map(([id, total]) => ({ id, total }));
}

const responsibleOf = (r) => r.responsableId || r.ultimoResponsableId || null;

function hoursToResolve(r) {
  const start = r.history[0]?.fecha;
  const end = r.history.find((h) => h.estado === 'RESUELTO')?.fecha;
  return start && end ? (Date.parse(end) - Date.parse(start)) / 3600000 : null;
}

function summarize({ filtros, rows }) {
  const attended = rows.filter((r) => ATTENDED.includes(r.estado));
  const hours = rows.map(hoursToResolve).filter((h) => h !== null);
  const round1 = (value) => Math.round(value * 10) / 10;
  return {
    filtros,
    registradas: rows.length,
    pendientes: rows.filter((r) => PENDING.includes(r.estado)).length,
    atendidas: attended.length,
    porCategoria: groupBy(rows, (r) => r.categoriaId),
    porPrioridad: groupBy(rows, (r) => r.prioridadId),
    porResponsable: groupBy(rows, responsibleOf),
    promedioHorasAtencion: hours.length ? round1(hours.reduce((a, b) => a + b, 0) / hours.length) : 0,
    porcentajeResueltas: rows.length ? round1((attended.length / rows.length) * 100) : 0,
    vencidas: {
      total: rows.filter((r) => r.sla?.estado === 'VENCIDA').length,
      porVencer: rows.filter((r) => r.sla?.estado === 'POR_VENCER').length,
      disponible: db.slaPolicies.some((p) => p.activo),
    },
  };
}

/** Campo CSV con comillas si hace falta y prefijo contra fórmulas. */
function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const nameIn = (list, id) => list.find((item) => item.id === id)?.nombre ?? '';

function requestsCsv(rows) {
  const lines = rows.map((r) => [
    r.codigo,
    nameIn(db.categories, r.categoriaId),
    nameIn(db.areas, r.areaId),
    r.estado,
    nameIn(db.priorities, r.prioridadId),
    db.users.find((u) => u.id === responsibleOf(r))?.nombreCompleto ?? '',
    r.creadoEn,
  ].map(csvCell).join(','));
  return [REQUEST_HEADER, ...lines].join('\n');
}

function indicatorsCsv(summary) {
  const lines = ['indicador,grupo,valor'];
  ['registradas', 'pendientes', 'atendidas', 'promedioHorasAtencion', 'porcentajeResueltas'].forEach((key) => {
    lines.push(`${key},,${summary[key]}`);
  });
  ['porCategoria', 'porPrioridad', 'porResponsable'].forEach((key) => {
    summary[key].forEach(({ id, total }) => lines.push(`${key},${id ?? ''},${total}`));
  });
  return lines.join('\n');
}

export const dashboardHandlers = [
  http.get('/api/v1/dashboard/summary', ({ request }) => {
    const result = filtersFrom(request);
    if (result.error) return result.error;
    return HttpResponse.json(summarize(result));
  }),

  http.get('/api/v1/dashboard/reports', ({ request }) => {
    const result = filtersFrom(request);
    if (result.error) return result.error;
    const tipo = result.params.get('tipo');
    if (!['solicitudes', 'indicadores'].includes(tipo)) {
      return problem(400, 'VALIDACION', 'El tipo de reporte no es válido.', [{ campo: 'tipo', mensaje: 'Usa solicitudes o indicadores.' }]);
    }
    const body = tipo === 'solicitudes' ? requestsCsv(result.rows) : indicatorsCsv(summarize(result));
    return new HttpResponse(body, {
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': `attachment; filename="${tipo}.csv"`,
      },
    });
  }),
];
