import { http, HttpResponse } from 'msw';
import { db, nextId, paginate, problem, requireUser } from '../db.js';
import { nowInLima } from '../../features/reservations/reservationRules.js';
import { applyPatchSemantics } from './admin.js';

// Reservas y ambientes (backend-uni/docs/api/reservas.md), con las reglas de
// ReservationService y ReservationDecisionService del backend.

const ADMIN = ['ADMINISTRADOR'];
const ACTIVE = ['PENDIENTE', 'CONFIRMADA'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const validation = (errores, detail = 'Revisa los datos ingresados.') => problem(400, 'VALIDACION', detail, errores);
const notFound = (detail = 'No encontramos el registro.') => problem(404, 'NO_ENCONTRADO', detail);
const blank = (value) => value === undefined || value === null || String(value).trim() === '';
const isoNow = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const toMinutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** 1 = lunes … 7 = domingo para una fecha `YYYY-MM-DD`. */
function weekday(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7;
}

const spaceById = (id) => db.spaces.find((s) => s.id === id);
const typeById = (id) => db.spaceTypes.find((t) => t.id === id);

function daySchedule(spaceId, fecha) {
  const slot = (db.spaceSchedules[spaceId] || []).find((f) => f.diaSemana === weekday(fecha));
  return slot ? { horaApertura: slot.horaApertura, horaCierre: slot.horaCierre } : null;
}

function occupied(spaceId, fecha, exceptId) {
  return db.reservations
    .filter((r) => r.espacioId === spaceId && r.fecha === fecha && ACTIVE.includes(r.estado) && r.id !== exceptId)
    .map((r) => ({ horaInicio: r.horaInicio, horaFin: r.horaFin }))
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

const overlaps = (a, b) => a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;

/** Franjas libres = horario del día menos las ocupadas. */
function freeSlots(horario, ocupadas) {
  if (!horario) return [];
  const libres = [];
  let cursor = horario.horaApertura;
  ocupadas.forEach((o) => {
    if (o.horaInicio > cursor) libres.push({ horaInicio: cursor, horaFin: o.horaInicio });
    if (o.horaFin > cursor) cursor = o.horaFin;
  });
  if (cursor < horario.horaCierre) libres.push({ horaInicio: cursor, horaFin: horario.horaCierre });
  return libres;
}

function summary(r) {
  return {
    id: r.id,
    codigo: r.codigo,
    espacioId: r.espacioId,
    espacio: spaceById(r.espacioId)?.nombre ?? null,
    fecha: r.fecha,
    horaInicio: r.horaInicio,
    horaFin: r.horaFin,
    estado: r.estado,
    estadoOperativo: null,
  };
}

function detail(r) {
  return {
    ...summary(r),
    solicitanteId: r.solicitanteId,
    motivo: r.motivo,
    numAsistentes: r.numAsistentes,
    motivoRechazo: r.motivoRechazo,
    creadoEn: r.creadoEn,
  };
}

/** Supervisor del área del espacio o administrador (sin área: solo el admin). */
function manages(user, r) {
  if (user.rol === 'ADMINISTRADOR') return true;
  const areaId = spaceById(r.espacioId)?.areaId;
  return user.rol === 'SUPERVISOR' && Boolean(areaId) && areaId === user.areaId;
}

const canSee = (user, r) => r.solicitanteId === user.id || manages(user, r);
const started = (r) => {
  const now = nowInLima();
  return `${r.fecha} ${r.horaInicio}` <= `${now.fecha} ${now.hora}`;
};
const slotTaken = () => problem(409, 'FRANJA_OCUPADA', 'La franja seleccionada ya está ocupada.');

function pushHistory(r, estado, actorId, motivo = null) {
  r.history.push({ estadoAnterior: r.estado, estado, actorId, fecha: isoNow(), motivo });
  r.estado = estado;
}

function createErrors(body) {
  const errores = [];
  ['espacioId', 'fecha', 'horaInicio', 'horaFin', 'motivo'].forEach((campo) => {
    if (blank(body[campo])) errores.push({ campo, mensaje: 'Este campo es obligatorio.' });
  });
  if (!blank(body.fecha) && !DATE.test(body.fecha)) errores.push({ campo: 'fecha', mensaje: 'Usa el formato AAAA-MM-DD.' });
  ['horaInicio', 'horaFin'].forEach((campo) => {
    if (!blank(body[campo]) && !TIME.test(body[campo])) errores.push({ campo, mensaje: 'Usa el formato HH:mm.' });
  });
  if (body.numAsistentes !== undefined && body.numAsistentes !== null
    && !(Number.isInteger(body.numAsistentes) && body.numAsistentes > 0)) {
    errores.push({ campo: 'numAsistentes', mensaje: 'Debe ser un entero positivo.' });
  }
  return errores;
}

/** Reglas de horario, duración, anticipación y aforo; devuelve el problema o `null`. */
function policyError(body, space) {
  const policy = db.reservationPolicy;
  const horario = daySchedule(space.id, body.fecha);
  if (body.horaInicio >= body.horaFin) return validation([{ campo: 'horaFin', mensaje: 'La hora de fin debe ser posterior al inicio.' }]);
  if (!horario || body.horaInicio < horario.horaApertura || body.horaFin > horario.horaCierre) {
    return problem(400, 'FUERA_DE_HORARIO', 'La franja está fuera del horario del espacio.');
  }
  const minutes = toMinutes(body.horaFin) - toMinutes(body.horaInicio);
  if (policy && (minutes < policy.duracionMinimaMinutos || minutes > policy.duracionMaximaMinutos)) {
    return problem(400, 'DURACION_INVALIDA', `La duración debe estar entre ${policy.duracionMinimaMinutos} y ${policy.duracionMaximaMinutos} minutos.`);
  }
  const now = nowInLima();
  const minStart = new Date(Date.parse(`${now.fecha}T${now.hora}:00Z`) + (policy?.horasAnticipacionMinima ?? 0) * 3600000);
  if (Date.parse(`${body.fecha}T${body.horaInicio}:00Z`) < minStart.getTime()) {
    return problem(400, 'ANTICIPACION_INVALIDA', `Reserva con al menos ${policy?.horasAnticipacionMinima ?? 0} hora(s) de anticipación.`);
  }
  if (body.numAsistentes && body.numAsistentes > space.capacidad) {
    return problem(400, 'CAPACIDAD_EXCEDIDA', `numAsistentes supera la capacidad del espacio (${space.capacidad}).`);
  }
  return null;
}

// ---------- Administración ----------

const SPACE_OPTIONAL = ['areaId', 'piso', 'descripcion', 'ubicacionDetallada'];

function spaceErrors(body, creating) {
  const errores = [];
  const required = creating ? ['codigo', 'nombre', 'tipoEspacioId', 'capacidad'] : [];
  required.forEach((campo) => {
    if (blank(body[campo])) errores.push({ campo, mensaje: 'Este campo es obligatorio.' });
  });
  if ('capacidad' in body && !blank(body.capacidad) && !(Number.isInteger(body.capacidad) && body.capacidad > 0)) {
    errores.push({ campo: 'capacidad', mensaje: 'La capacidad debe ser un entero positivo.' });
  }
  if (!blank(body.tipoEspacioId) && !typeById(body.tipoEspacioId)?.activo) {
    errores.push({ campo: 'tipoEspacioId', mensaje: 'El tipo no existe o está inactivo.' });
  }
  if (!blank(body.areaId) && !db.areas.some((a) => a.id === body.areaId && a.activo)) {
    errores.push({ campo: 'areaId', mensaje: 'El área no existe o está inactiva.' });
  }
  if (body.requiereAprobacion === false) {
    errores.push({ campo: 'requiereAprobacion', mensaje: 'La aprobación es obligatoria para todos los espacios.' });
  }
  return errores;
}

function duplicateSpace(candidate, exceptId) {
  return db.spaces.some((s) => s.id !== exceptId && (s.codigo.toLowerCase() === candidate.codigo.toLowerCase()
    || (s.nombre.toLowerCase() === candidate.nombre.toLowerCase() && (s.pabellon || '') === (candidate.pabellon || ''))));
}

function scheduleErrors(franjas) {
  if (!Array.isArray(franjas)) return [{ campo: 'franjas', mensaje: 'Envía la lista de franjas.' }];
  const errores = [];
  const days = new Set();
  franjas.forEach((f, i) => {
    if (!Number.isInteger(f.diaSemana) || f.diaSemana < 1 || f.diaSemana > 7) errores.push({ campo: `franjas[${i}].diaSemana`, mensaje: 'Usa 1 (lunes) a 7 (domingo).' });
    else if (days.has(f.diaSemana)) errores.push({ campo: `franjas[${i}].diaSemana`, mensaje: 'Una sola franja por día.' });
    days.add(f.diaSemana);
    if (!TIME.test(f.horaApertura || '') || !TIME.test(f.horaCierre || '') || f.horaCierre <= f.horaApertura) {
      errores.push({ campo: `franjas[${i}].horaCierre`, mensaje: 'El cierre debe ser posterior a la apertura.' });
    }
  });
  return errores;
}

function policyErrors(p) {
  const fields = ['duracionMinimaMinutos', 'duracionMaximaMinutos', 'horasAnticipacionMinima', 'diasAnticipacionMaxima', 'maxReservasActivasPorDia'];
  const errores = fields.filter((f) => !Number.isInteger(p[f])).map((campo) => ({ campo, mensaje: 'Este campo es obligatorio.' }));
  if (errores.length) return errores;
  if (p.duracionMinimaMinutos <= 0) errores.push({ campo: 'duracionMinimaMinutos', mensaje: 'Debe ser mayor que cero.' });
  if (p.duracionMaximaMinutos < p.duracionMinimaMinutos) errores.push({ campo: 'duracionMaximaMinutos', mensaje: 'Debe ser mayor o igual a la mínima.' });
  if (p.horasAnticipacionMinima < 0) errores.push({ campo: 'horasAnticipacionMinima', mensaje: 'No puede ser negativa.' });
  if (p.diasAnticipacionMaxima < 0) errores.push({ campo: 'diasAnticipacionMaxima', mensaje: 'No puede ser negativa.' });
  if (p.maxReservasActivasPorDia <= 0) errores.push({ campo: 'maxReservasActivasPorDia', mensaje: 'Debe ser mayor que cero.' });
  return errores;
}

export const reservationHandlers = [
  http.get('/api/v1/spaces', ({ request }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const params = new URL(request.url).searchParams;
    const fecha = params.get('fecha') || nowInLima().fecha;
    const capacidadMinima = params.get('capacidadMinima');
    if (!DATE.test(fecha)) return validation([{ campo: 'fecha', mensaje: 'Usa el formato AAAA-MM-DD.' }]);
    if (capacidadMinima && !(Number(capacidadMinima) >= 1)) return validation([{ campo: 'capacidadMinima', mensaje: 'Debe ser al menos 1.' }]);
    const tipo = params.get('tipoEspacioId');
    const pabellon = params.get('pabellon')?.trim().toLowerCase();
    const items = db.spaces
      .filter((s) => s.activo && typeById(s.tipoEspacioId)?.activo)
      .filter((s) => (!tipo || s.tipoEspacioId === tipo) && (!pabellon || s.pabellon.toLowerCase() === pabellon)
        && (!capacidadMinima || s.capacidad >= Number(capacidadMinima)))
      .map((s) => ({
        id: s.id,
        codigo: s.codigo,
        nombre: s.nombre,
        tipo: { id: s.tipoEspacioId, nombre: typeById(s.tipoEspacioId).nombre },
        areaId: s.areaId,
        pabellon: s.pabellon,
        piso: s.piso,
        capacidad: s.capacidad,
        horario: daySchedule(s.id, fecha),
      }));
    return HttpResponse.json(paginate(items, request.url));
  }),

  http.get('/api/v1/spaces/:id/availability', ({ request, params }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const fecha = new URL(request.url).searchParams.get('fecha');
    if (!fecha || !DATE.test(fecha)) return validation([{ campo: 'fecha', mensaje: 'La fecha es obligatoria (AAAA-MM-DD).' }]);
    const space = spaceById(params.id);
    if (!space?.activo) return notFound('El espacio no existe o no está disponible.');
    const horario = daySchedule(space.id, fecha);
    const ocupadas = horario ? occupied(space.id, fecha) : [];
    return HttpResponse.json({ espacioId: space.id, fecha, horario, libres: freeSlots(horario, ocupadas), ocupadas });
  }),

  http.post('/api/v1/reservations', async ({ request }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const body = await request.json();
    const errores = createErrors(body);
    if (errores.length) return validation(errores);
    const space = spaceById(body.espacioId);
    if (!space?.activo) return notFound('El espacio no está disponible para reservas.');
    const ruleError = policyError(body, space);
    if (ruleError) return ruleError;
    const sameDay = db.reservations.filter((r) => r.solicitanteId === user.id && r.fecha === body.fecha && ACTIVE.includes(r.estado));
    const limit = db.reservationPolicy?.maxReservasActivasPorDia;
    if (limit && sameDay.length >= limit) {
      return problem(409, 'LIMITE_DIARIO', `Se alcanzó el máximo de ${limit} reservas activas para esa fecha.`);
    }
    if (occupied(space.id, body.fecha).some((o) => overlaps(o, body))) return slotTaken();
    const id = nextId();
    const creadoEn = isoNow();
    const reservation = {
      id,
      codigo: `RES-2026-${id.padStart(6, '0')}`,
      solicitanteId: user.id,
      espacioId: space.id,
      fecha: body.fecha,
      horaInicio: body.horaInicio,
      horaFin: body.horaFin,
      estado: 'PENDIENTE',
      motivo: body.motivo.trim(),
      numAsistentes: body.numAsistentes ?? null,
      motivoRechazo: null,
      creadoEn,
      history: [{ estadoAnterior: null, estado: 'PENDIENTE', actorId: user.id, fecha: creadoEn, motivo: null }],
    };
    db.reservations.push(reservation);
    return HttpResponse.json(summary(reservation), { status: 201, headers: { Location: `/api/v1/reservations/${id}` } });
  }),

  http.get('/api/v1/reservations', ({ request }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const params = new URL(request.url).searchParams;
    const vista = params.get('vista') || 'propias';
    const estado = params.get('estado');
    const desde = params.get('fechaDesde');
    const hasta = params.get('fechaHasta');
    if (!['propias', 'gestion'].includes(vista)) return validation([{ campo: 'vista', mensaje: 'vista debe ser propias o gestion.' }]);
    if ((desde && !DATE.test(desde)) || (hasta && !DATE.test(hasta))) return validation([{ campo: 'fechaDesde', mensaje: 'Usa el formato AAAA-MM-DD.' }]);
    const gestion = vista === 'gestion';
    if (gestion && !['SUPERVISOR', 'ADMINISTRADOR'].includes(user.rol)) {
      return problem(403, 'VISTA_NO_PERMITIDA', 'La vista de gestión es para supervisores y administradores.');
    }
    const items = db.reservations
      .filter((r) => (gestion ? r.estado === 'PENDIENTE' && manages(user, r) : r.solicitanteId === user.id))
      .filter((r) => (!estado || r.estado === estado) && (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta))
      .sort((a, b) => {
        const order = `${a.fecha} ${a.horaInicio} ${a.id.padStart(6, '0')}`.localeCompare(`${b.fecha} ${b.horaInicio} ${b.id.padStart(6, '0')}`);
        return gestion ? order : -order;
      })
      .map(summary);
    return HttpResponse.json(paginate(items, request.url));
  }),

  http.get('/api/v1/reservations/:id', ({ request, params }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const r = db.reservations.find((x) => x.id === params.id);
    if (!r || !canSee(user, r)) return notFound('No encontramos la reserva.');
    return HttpResponse.json(detail(r));
  }),

  http.get('/api/v1/reservations/:id/history', ({ request, params }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const r = db.reservations.find((x) => x.id === params.id);
    if (!r || !canSee(user, r)) return notFound('No encontramos la reserva.');
    return HttpResponse.json(paginate(r.history, request.url));
  }),

  http.patch('/api/v1/reservations/:id/status', async ({ request, params }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const r = db.reservations.find((x) => x.id === params.id);
    if (!r || !canSee(user, r)) return notFound('No encontramos la reserva.');
    const { estado, motivo } = await request.json();
    if (!['CONFIRMADA', 'RECHAZADA', 'CANCELADA'].includes(estado)) {
      return validation([{ campo: 'estado', mensaje: 'estado debe ser CONFIRMADA, RECHAZADA o CANCELADA.' }]);
    }
    if (estado === 'CANCELADA') {
      if (r.solicitanteId !== user.id) return problem(403, 'CANCELACION_NO_PERMITIDA', 'Solo el propietario puede cancelar la reserva.');
      if (!ACTIVE.includes(r.estado)) return problem(409, 'TRANSICION_INVALIDA', 'Solo se cancelan reservas pendientes o confirmadas.');
      if (started(r)) return problem(409, 'INICIO_ALCANZADO', 'La reserva ya comenzó y no puede cancelarse.');
      pushHistory(r, 'CANCELADA', user.id);
      return HttpResponse.json(detail(r));
    }
    if (!manages(user, r)) return problem(403, 'DECISION_NO_PERMITIDA', 'Solo el supervisor del área o el administrador decide la reserva.');
    if (r.solicitanteId === user.id) return problem(403, 'AUTOAPROBACION', 'No puede decidir sobre su propia reserva.');
    if (estado === 'RECHAZADA' && blank(motivo)) return validation([{ campo: 'motivo', mensaje: 'El motivo es obligatorio al rechazar.' }]);
    if (r.estado !== 'PENDIENTE') return problem(409, 'TRANSICION_INVALIDA', 'Solo se decide sobre reservas pendientes.');
    if (estado === 'CONFIRMADA') {
      if (started(r)) return problem(409, 'INICIO_ALCANZADO', 'La reserva ya comenzó y no puede confirmarse.');
      if (occupied(r.espacioId, r.fecha, r.id).some((o) => overlaps(o, r))) return slotTaken();
      pushHistory(r, 'CONFIRMADA', user.id);
    } else {
      r.motivoRechazo = motivo.trim();
      pushHistory(r, 'RECHAZADA', user.id, r.motivoRechazo);
    }
    return HttpResponse.json(detail(r));
  }),

  // ---------- /admin/spaces ----------

  http.get('/api/v1/admin/spaces', ({ request }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    return HttpResponse.json(paginate(db.spaces, request.url));
  }),

  http.post('/api/v1/admin/spaces', async ({ request }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    const body = await request.json();
    const errores = spaceErrors(body, true);
    if (errores.length) return validation(errores);
    const space = {
      id: nextId(),
      codigo: body.codigo.trim(),
      nombre: body.nombre.trim(),
      tipoEspacioId: body.tipoEspacioId,
      areaId: blank(body.areaId) ? null : body.areaId,
      pabellon: body.pabellon?.trim() || '',
      piso: body.piso?.trim() || null,
      descripcion: body.descripcion?.trim() || null,
      ubicacionDetallada: body.ubicacionDetallada?.trim() || null,
      capacidad: body.capacidad,
      requiereAprobacion: true,
      activo: true,
    };
    if (duplicateSpace(space)) return problem(409, 'DUPLICADO', 'Ya existe un espacio con ese código o nombre en el pabellón.');
    db.spaces.push(space);
    db.spaceSchedules[space.id] = [];
    return HttpResponse.json(space, { status: 201 });
  }),

  http.patch('/api/v1/admin/spaces/:id', async ({ request, params }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    const space = spaceById(params.id);
    if (!space) return notFound('No encontramos el espacio.');
    const raw = await request.json();
    if ('codigo' in raw && raw.codigo !== null && raw.codigo !== space.codigo) {
      return validation([{ campo: 'codigo', mensaje: 'El código no se modifica.' }]);
    }
    const patch = applyPatchSemantics(raw, SPACE_OPTIONAL);
    delete patch.codigo;
    if (!Object.keys(patch).length) return problem(400, 'VALIDACION', 'Envíe al menos un campo para actualizar.');
    const errores = spaceErrors(patch, false);
    if (errores.length) return validation(errores);
    const next = { ...space, ...patch, pabellon: patch.pabellon === undefined ? space.pabellon : (patch.pabellon || '').trim() };
    if (duplicateSpace(next, space.id)) return problem(409, 'DUPLICADO', 'Ya existe un espacio con ese código o nombre en el pabellón.');
    Object.assign(space, next);
    return HttpResponse.json(space);
  }),

  http.get('/api/v1/admin/spaces/:id/schedule', ({ request, params }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    if (!spaceById(params.id)) return notFound('No encontramos el espacio.');
    return HttpResponse.json({ franjas: db.spaceSchedules[params.id] || [] });
  }),

  http.put('/api/v1/admin/spaces/:id/schedule', async ({ request, params }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    if (!spaceById(params.id)) return notFound('No encontramos el espacio.');
    const { franjas } = await request.json();
    const errores = scheduleErrors(franjas);
    if (errores.length) return validation(errores, 'El horario no es válido.');
    db.spaceSchedules[params.id] = [...franjas]
      .map(({ diaSemana, horaApertura, horaCierre }) => ({ diaSemana, horaApertura, horaCierre }))
      .sort((a, b) => a.diaSemana - b.diaSemana);
    return HttpResponse.json({ franjas: db.spaceSchedules[params.id] });
  }),

  // ---------- /admin/space-types ----------

  http.get('/api/v1/admin/space-types', ({ request }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    return HttpResponse.json(paginate(db.spaceTypes, request.url));
  }),

  http.post('/api/v1/admin/space-types', async ({ request }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    const body = await request.json();
    const errores = ['codigo', 'nombre'].filter((c) => blank(body[c])).map((campo) => ({ campo, mensaje: 'Este campo es obligatorio.' }));
    if (errores.length) return validation(errores);
    const taken = db.spaceTypes.some((t) => t.codigo.toLowerCase() === body.codigo.trim().toLowerCase()
      || t.nombre.toLowerCase() === body.nombre.trim().toLowerCase());
    if (taken) return problem(409, 'DUPLICADO', 'Ya existe un registro con ese código o nombre.');
    const type = { id: nextId(), codigo: body.codigo.trim(), nombre: body.nombre.trim(), descripcion: body.descripcion?.trim() || null, activo: true };
    db.spaceTypes.push(type);
    return HttpResponse.json(type, { status: 201 });
  }),

  http.patch('/api/v1/admin/space-types/:id', async ({ request, params }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    const type = typeById(params.id);
    if (!type) return notFound('No encontramos el tipo de espacio.');
    const raw = await request.json();
    if ('codigo' in raw && raw.codigo !== null && raw.codigo !== type.codigo) {
      return validation([{ campo: 'codigo', mensaje: 'El código no se modifica.' }]);
    }
    const patch = applyPatchSemantics(raw, ['descripcion']);
    delete patch.codigo;
    if (!Object.keys(patch).length) return problem(400, 'VALIDACION', 'Envíe al menos un campo para actualizar.');
    if ('nombre' in patch && blank(patch.nombre)) return validation([{ campo: 'nombre', mensaje: 'Este campo es obligatorio.' }]);
    if (patch.nombre && db.spaceTypes.some((t) => t.id !== type.id && t.nombre.toLowerCase() === patch.nombre.trim().toLowerCase())) {
      return problem(409, 'DUPLICADO', 'Ya existe un registro con ese código o nombre.');
    }
    Object.assign(type, patch);
    return HttpResponse.json(type);
  }),

  // ---------- /admin/reservation-policy ----------

  http.get('/api/v1/admin/reservation-policy', ({ request }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    if (!db.reservationPolicy) return notFound('Todavía no hay una política vigente.');
    return HttpResponse.json(db.reservationPolicy);
  }),

  http.put('/api/v1/admin/reservation-policy', async ({ request }) => {
    const user = requireUser(request, ADMIN);
    if (user instanceof Response) return user;
    const body = await request.json();
    const errores = policyErrors(body);
    if (errores.length) return validation(errores, 'Los valores de la política son incompatibles.');
    db.reservationPolicy = {
      duracionMinimaMinutos: body.duracionMinimaMinutos,
      duracionMaximaMinutos: body.duracionMaximaMinutos,
      horasAnticipacionMinima: body.horasAnticipacionMinima,
      diasAnticipacionMaxima: body.diasAnticipacionMaxima,
      maxReservasActivasPorDia: body.maxReservasActivasPorDia,
    };
    return HttpResponse.json(db.reservationPolicy);
  }),
];
