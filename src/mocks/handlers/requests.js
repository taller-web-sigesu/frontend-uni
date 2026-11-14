import { http, HttpResponse } from 'msw';
import { db, nextId, paginate, problem, requireUser } from '../db.js';

const TERMINAL = ['CERRADO', 'RECHAZADO'];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const FLOW_ROLES = ['ESTUDIANTE', 'DOCENTE', 'TECNICO', 'SUPERVISOR'];
const REQUESTERS = ['ESTUDIANTE', 'DOCENTE'];

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const person = (id) => {
  const user = db.users.find((u) => u.id === id);
  return user ? { id: user.id, nombreCompleto: user.nombreCompleto } : null;
};
const priorityLevel = (id) => db.priorities.find((p) => p.id === id)?.nivel ?? 0;
const notFound = () => problem(404, 'NO_ENCONTRADO', 'No encontramos la solicitud.');
const conflict = (codigo, detail) => problem(409, codigo, detail);
const validation = (errores, detail = 'Revisa los datos ingresados.') => problem(400, 'VALIDACION', detail, errores);

/** Alcance del contrato: propietario, técnico con asignación vigente o supervisor del área. */
function canSee(user, solicitud) {
  if (REQUESTERS.includes(user.rol)) return solicitud.solicitanteId === user.id;
  if (user.rol === 'TECNICO') return solicitud.responsableId === user.id;
  if (user.rol === 'SUPERVISOR') return solicitud.areaId === user.areaId;
  return false;
}

/** Usuario + solicitud visibles, o la respuesta de error (403 para el administrador, 404 fuera de alcance). */
function access(request, params, roles = FLOW_ROLES) {
  const user = requireUser(request);
  if (user instanceof Response) return { error: user };
  if (!FLOW_ROLES.includes(user.rol)) {
    return { error: problem(403, 'ACCESO_DENEGADO', 'No tienes permiso para realizar esta operación.') };
  }
  const solicitud = db.requests.find((r) => r.id === params.id);
  if (!solicitud || !canSee(user, solicitud)) return { error: notFound() };
  if (!roles.includes(user.rol)) {
    return { error: problem(403, 'ACCESO_DENEGADO', 'No tienes permiso para realizar esta operación.') };
  }
  return { user, solicitud };
}

function summary(r) {
  return {
    id: r.id,
    codigo: r.codigo,
    categoriaId: r.categoriaId,
    areaId: r.areaId,
    area: db.areas.find((a) => a.id === r.areaId)?.nombre ?? null,
    prioridadId: r.prioridadId,
    estado: r.estado,
    creadoEn: r.creadoEn,
  };
}

function detail(r) {
  return {
    ...summary(r),
    solicitante: person(r.solicitanteId),
    ubicacion: r.ubicacion,
    descripcion: r.descripcion,
    responsableActual: r.responsableId ? person(r.responsableId) : null,
    ultimoResponsable: TERMINAL.includes(r.estado) && r.ultimoResponsableId ? person(r.ultimoResponsableId) : null,
    sla: { ...r.sla },
  };
}

function withResponsible(r) {
  return { ...summary(r), responsableActual: r.responsableId ? person(r.responsableId) : null };
}

function attachmentJson(a, solicitud, user) {
  const autor = person(a.autorId);
  return {
    id: a.id,
    nombre: a.nombre,
    tamanoBytes: a.tamanoBytes,
    tipoMime: a.tipoMime,
    autorId: a.autorId,
    autorNombre: autor?.nombreCompleto ?? '',
    creadoEn: a.creadoEn,
    puedeEliminar: a.autorId === user.id && !TERMINAL.includes(solicitud.estado),
  };
}

/** Tipo por firma del contenido, como el backend (no por extensión ni Content-Type). */
function detectMime(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
  return null;
}

function moveTo(solicitud, estado, actorId, motivo = null) {
  solicitud.history.push({ estadoAnterior: solicitud.estado, estado, actorId, fecha: now(), motivo });
  solicitud.estado = estado;
  if (TERMINAL.includes(estado)) {
    solicitud.sla = { ...solicitud.sla, estado: 'CERRADA' };
    solicitud.ultimoResponsableId = solicitud.responsableId;
    solicitud.responsableId = null;
  }
}

function audit(solicitud, campo, valorAnterior, valorNuevo, actorId) {
  solicitud.audit.push({ id: nextId(), campo, valorAnterior, valorNuevo, actorId, fecha: now() });
}

const priorityName = (id) => db.priorities.find((p) => p.id === id)?.nombre ?? id;

/** Transiciones de PATCH /status: rol requerido por estado de origen → destino. */
const TRANSITIONS = {
  EN_PROCESO: { from: ['ASIGNADO'], rol: 'TECNICO' },
  RESUELTO: { from: ['EN_PROCESO'], rol: 'TECNICO' },
  CERRADO: { from: ['RESUELTO'], rol: 'SUPERVISOR' },
  RECHAZADO: { from: ['NUEVO', 'ASIGNADO', 'EN_PROCESO'], rol: 'SUPERVISOR' },
};

export const requestHandlers = [
  http.get('/api/v1/requests', ({ request }) => {
    const user = requireUser(request, FLOW_ROLES);
    if (user instanceof Response) return user;
    const params = new URL(request.url).searchParams;
    let items = db.requests.filter((r) => canSee(user, r));
    if (user.rol === 'SUPERVISOR') {
      ['estado', 'categoriaId', 'prioridadId'].forEach((key) => {
        const value = params.get(key);
        if (value) items = items.filter((r) => r[key] === value);
      });
    }
    if (user.rol === 'TECNICO') {
      items = [...items].sort((a, b) => priorityLevel(b.prioridadId) - priorityLevel(a.prioridadId)
        || a.creadoEn.localeCompare(b.creadoEn));
    } else {
      items = [...items].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    }
    return HttpResponse.json(paginate(items.map(summary), request.url));
  }),

  http.post('/api/v1/requests', async ({ request }) => {
    const user = requireUser(request, REQUESTERS);
    if (user instanceof Response) return user;
    const body = await request.json().catch(() => ({}));
    const errores = ['categoriaId', 'ubicacion', 'descripcion']
      .filter((campo) => !String(body?.[campo] ?? '').trim())
      .map((campo) => ({ campo, mensaje: 'Este campo es obligatorio.' }));
    if (errores.length) return validation(errores);
    const category = db.categories.find((c) => c.id === body.categoriaId && c.activo);
    if (!category) return validation([{ campo: 'categoriaId', mensaje: 'La categoría no está habilitada.' }]);
    const id = nextId();
    const creadoEn = now();
    const solicitud = {
      id,
      codigo: `SOL-2026-${id.padStart(6, '0')}`,
      solicitanteId: user.id,
      categoriaId: category.id,
      areaId: category.areaId,
      prioridadId: category.prioridadPredeterminadaId,
      estado: 'NUEVO',
      ubicacion: body.ubicacion.trim(),
      descripcion: body.descripcion.trim(),
      responsableId: null,
      ultimoResponsableId: null,
      creadoEn,
      sla: { estado: 'EN_PLAZO', fechaAviso: creadoEn, fechaLimite: creadoEn },
      history: [{ estadoAnterior: null, estado: 'NUEVO', actorId: user.id, fecha: creadoEn, motivo: null }],
      comments: [],
      attachments: [],
      audit: [],
      survey: null,
    };
    db.requests.push(solicitud);
    return HttpResponse.json(summary(solicitud), { status: 201, headers: { Location: `/api/v1/requests/${id}` } });
  }),

  http.get('/api/v1/requests/:id', ({ request, params }) => {
    const { error, solicitud } = access(request, params);
    return error || HttpResponse.json(detail(solicitud));
  }),

  http.patch('/api/v1/requests/:id', async ({ request, params }) => {
    const { error, user, solicitud } = access(request, params, ['SUPERVISOR']);
    if (error) return error;
    const body = await request.json().catch(() => ({}));
    const priority = db.priorities.find((p) => p.id === body?.prioridadId && p.activo);
    if (!priority) return validation([{ campo: 'prioridadId', mensaje: 'Prioridad inválida.' }]);
    if (TERMINAL.includes(solicitud.estado)) return conflict('SOLICITUD_FINALIZADA', 'La solicitud ya está cerrada o rechazada.');
    if (priority.id !== solicitud.prioridadId) {
      audit(solicitud, 'prioridad', priorityName(solicitud.prioridadId), priority.nombre, user.id);
      solicitud.prioridadId = priority.id;
    }
    return HttpResponse.json(withResponsible(solicitud));
  }),

  http.patch('/api/v1/requests/:id/status', async ({ request, params }) => {
    const { error, user, solicitud } = access(request, params, ['TECNICO', 'SUPERVISOR']);
    if (error) return error;
    const body = await request.json().catch(() => ({}));
    if (body?.estado === 'ASIGNADO') {
      return problem(400, 'USAR_ASIGNACION', 'La asignación se hace con POST /requests/{id}/assignments.');
    }
    const rule = TRANSITIONS[body?.estado];
    if (!rule) return validation([{ campo: 'estado', mensaje: 'Estado inválido.' }]);
    if (rule.rol !== user.rol) return problem(403, 'ACCESO_DENEGADO', 'No tienes permiso para realizar esta operación.');
    if (body.estado === 'RECHAZADO' && !String(body.motivo ?? '').trim()) {
      return validation([{ campo: 'motivo', mensaje: 'Indica el motivo del rechazo.' }]);
    }
    if (!rule.from.includes(solicitud.estado)) {
      return conflict('TRANSICION_INVALIDA', 'La solicitud cambió de estado.');
    }
    moveTo(solicitud, body.estado, user.id, body.estado === 'RECHAZADO' ? body.motivo.trim() : null);
    return HttpResponse.json(withResponsible(solicitud));
  }),

  http.get('/api/v1/requests/:id/history', ({ request, params }) => {
    const { error, solicitud } = access(request, params);
    return error || HttpResponse.json(paginate(solicitud.history, request.url));
  }),

  http.get('/api/v1/requests/:id/comments', ({ request, params }) => {
    const { error, solicitud } = access(request, params);
    if (error) return error;
    const items = solicitud.comments.map((c) => ({
      id: c.id, contenido: c.contenido, autor: person(c.autorId), creadoEn: c.creadoEn,
    }));
    return HttpResponse.json(paginate(items, request.url));
  }),

  http.post('/api/v1/requests/:id/comments', async ({ request, params }) => {
    const { error, user, solicitud } = access(request, params);
    if (error) return error;
    const body = await request.json().catch(() => ({}));
    const contenido = String(body?.contenido ?? '').trim();
    if (!contenido) return validation([{ campo: 'contenido', mensaje: 'Escribe un comentario.' }]);
    const comment = { id: nextId(), contenido, autorId: user.id, creadoEn: now() };
    solicitud.comments.push(comment);
    return HttpResponse.json(
      { id: comment.id, contenido, autor: person(user.id), creadoEn: comment.creadoEn },
      { status: 201 },
    );
  }),

  http.get('/api/v1/requests/:id/attachments', ({ request, params }) => {
    const { error, user, solicitud } = access(request, params);
    if (error) return error;
    return HttpResponse.json(
      solicitud.attachments.filter((a) => !a.eliminado).map((a) => attachmentJson(a, solicitud, user)),
    );
  }),

  http.post('/api/v1/requests/:id/attachments', async ({ request, params }) => {
    const { error, user, solicitud } = access(request, params);
    if (error) return error;
    if (TERMINAL.includes(solicitud.estado)) return conflict('SOLICITUD_FINALIZADA', 'La solicitud ya está cerrada o rechazada.');
    const form = await request.formData().catch(() => null);
    const file = form?.get('archivo');
    if (!file || typeof file === 'string') {
      return validation([{ campo: 'archivo', mensaje: 'Selecciona un archivo.' }]);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0) return validation([{ campo: 'archivo', mensaje: 'El archivo está vacío.' }], 'El archivo está vacío.');
    if (bytes.length > MAX_BYTES) return validation([{ campo: 'archivo', mensaje: 'El tamaño máximo es 5 MB.' }], 'El tamaño máximo es 5 MB.');
    const tipoMime = detectMime(bytes);
    if (!tipoMime) {
      return validation([{ campo: 'archivo', mensaje: 'Solo se aceptan archivos JPG, PNG o PDF.' }], 'Solo se aceptan archivos JPG, PNG o PDF.');
    }
    if (solicitud.attachments.filter((a) => !a.eliminado).length >= MAX_ATTACHMENTS) {
      return conflict('LIMITE_EVIDENCIAS', 'Ya hay 5 evidencias. Elimina una para adjuntar otra.');
    }
    const attachment = {
      id: nextId(),
      nombre: String(file.name || 'archivo').split(/[\\/]/).pop(),
      tamanoBytes: bytes.length,
      tipoMime,
      autorId: user.id,
      creadoEn: now(),
      eliminado: false,
      bytes,
    };
    solicitud.attachments.push(attachment);
    return HttpResponse.json(attachmentJson(attachment, solicitud, user), {
      status: 201,
      headers: { Location: `/api/v1/requests/${solicitud.id}/attachments/${attachment.id}/content` },
    });
  }),

  http.get('/api/v1/requests/:id/attachments/:attachmentId/content', ({ request, params }) => {
    const { error, solicitud } = access(request, params);
    if (error) return error;
    const attachment = solicitud.attachments.find((a) => a.id === params.attachmentId && !a.eliminado);
    if (!attachment) return notFound();
    return new HttpResponse(attachment.bytes || new Uint8Array(attachment.tamanoBytes > 0 ? 8 : 0), {
      headers: {
        'Content-Type': attachment.tipoMime,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.nombre)}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  }),

  http.delete('/api/v1/requests/:id/attachments/:attachmentId', ({ request, params }) => {
    const { error, user, solicitud } = access(request, params);
    if (error) return error;
    const attachment = solicitud.attachments.find((a) => a.id === params.attachmentId && !a.eliminado);
    if (!attachment) return notFound();
    if (attachment.autorId !== user.id) return problem(403, 'SOLO_EL_AUTOR', 'Solo el autor puede eliminar la evidencia.');
    if (TERMINAL.includes(solicitud.estado)) return conflict('SOLICITUD_FINALIZADA', 'La solicitud ya está cerrada o rechazada.');
    attachment.eliminado = true;
    audit(solicitud, 'ELIMINAR_ADJUNTO', attachment.nombre, null, user.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/v1/requests/:id/eligible-technicians', ({ request, params }) => {
    const { error, solicitud } = access(request, params, ['SUPERVISOR']);
    if (error) return error;
    const items = db.users
      .filter((u) => u.rol === 'TECNICO' && u.activo && u.areaId === solicitud.areaId)
      .map(({ id, nombreCompleto, areaId }) => ({ id, nombreCompleto, areaId }));
    return HttpResponse.json(paginate(items, request.url));
  }),

  http.post('/api/v1/requests/:id/assignments', async ({ request, params }) => {
    const { error, user, solicitud } = access(request, params, ['SUPERVISOR']);
    if (error) return error;
    const body = await request.json().catch(() => ({}));
    const tecnico = db.users.find((u) => u.id === body?.tecnicoId && u.rol === 'TECNICO' && u.activo
      && u.areaId === solicitud.areaId);
    if (!tecnico) return validation([{ campo: 'tecnicoId', mensaje: 'El técnico no es elegible.' }]);
    if (body.prioridadId && !db.priorities.some((p) => p.id === body.prioridadId && p.activo)) {
      return validation([{ campo: 'prioridadId', mensaje: 'Prioridad inválida.' }]);
    }
    if (TERMINAL.includes(solicitud.estado)) return conflict('SOLICITUD_FINALIZADA', 'La solicitud ya está cerrada o rechazada.');
    if (solicitud.responsableId !== tecnico.id) {
      audit(solicitud, 'responsable', person(solicitud.responsableId)?.nombreCompleto ?? null, tecnico.nombreCompleto, user.id);
    }
    solicitud.responsableId = tecnico.id;
    if (body.prioridadId && body.prioridadId !== solicitud.prioridadId) {
      audit(solicitud, 'prioridad', priorityName(solicitud.prioridadId), priorityName(body.prioridadId), user.id);
      solicitud.prioridadId = body.prioridadId;
    }
    if (solicitud.estado === 'NUEVO') moveTo(solicitud, 'ASIGNADO', user.id);
    return HttpResponse.json({
      id: nextId(),
      solicitudId: solicitud.id,
      tecnicoId: tecnico.id,
      asignadaEn: now(),
      estadoSolicitud: solicitud.estado,
      prioridadId: solicitud.prioridadId,
    }, { status: 201 });
  }),

  http.get('/api/v1/requests/:id/audit-events', ({ request, params }) => {
    const { error, solicitud } = access(request, params, ['SUPERVISOR']);
    return error || HttpResponse.json(paginate(solicitud.audit, request.url));
  }),

  http.post('/api/v1/requests/:id/survey', async ({ request, params }) => {
    const { error, solicitud } = access(request, params, REQUESTERS);
    if (error) return error;
    const body = await request.json().catch(() => ({}));
    const calificacion = body?.calificacion;
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      return validation([{ campo: 'calificacion', mensaje: 'Elige una calificación de 1 a 5.' }]);
    }
    if (solicitud.estado !== 'CERRADO') return conflict('SOLICITUD_NO_CERRADA', 'La solicitud aún no está cerrada.');
    if (solicitud.survey) return conflict('ENCUESTA_RESPONDIDA', 'Ya respondiste esta encuesta.');
    solicitud.survey = { id: nextId(), calificacion, comentario: body.comentario ?? null };
    return HttpResponse.json({ solicitudId: solicitud.id, ...solicitud.survey }, { status: 201 });
  }),
];
