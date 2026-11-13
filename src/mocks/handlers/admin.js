import { http, HttpResponse } from 'msw';
import { db, nextId, paginate, problem, requireUser } from '../db.js';

const ADMIN = ['ADMINISTRADOR'];
const ROLES = [
  { codigo: 'ESTUDIANTE', nombre: 'Estudiante' },
  { codigo: 'DOCENTE', nombre: 'Docente' },
  { codigo: 'TECNICO', nombre: 'Técnico' },
  { codigo: 'SUPERVISOR', nombre: 'Supervisor' },
  { codigo: 'ADMINISTRADOR', nombre: 'Administrador' },
];
const WITH_AREA = ['TECNICO', 'SUPERVISOR'];

const admin = (request) => requireUser(request, ADMIN);
const validation = (errores, detail = 'Revisa los datos ingresados.') => problem(400, 'VALIDACION', detail, errores);
const notFound = (detail = 'No encontramos el registro.') => problem(404, 'NO_ENCONTRADO', detail);
const blank = (value) => value === undefined || value === null || String(value).trim() === '';
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

/**
 * Semántica de PATCH del backend (shared/web/Patch.java): un campo null o
 * ausente conserva el valor; '' en un texto opcional lo borra. `keep` lista los
 * campos donde null tiene significado propio (p. ej. areaId según el rol).
 */
function applyPatchSemantics(patch, optional, keep = []) {
  return Object.fromEntries(Object.entries(patch)
    .filter(([key, value]) => value !== null || keep.includes(key))
    .map(([key, value]) => [key, optional.includes(key) && typeof value === 'string' && !value.trim() ? null : value]));
}

// ---------- Usuarios ----------

function publicUser(u) {
  return {
    id: u.id,
    nombreCompleto: u.nombreCompleto,
    correo: u.correo,
    telefono: u.telefono,
    rol: u.rol,
    areaId: u.areaId,
    activo: u.activo,
    estadoCuenta: u.estadoCuenta,
    origenRegistro: u.origenRegistro,
    creadoEn: u.creadoEn,
  };
}

/** Error de la combinación rol/área, o `null`. */
function roleAreaError(rol, areaId) {
  if (WITH_AREA.includes(rol)) {
    if (blank(areaId)) return validation([{ campo: 'areaId', mensaje: 'El área es obligatoria para este rol.' }]);
    if (!db.areas.some((a) => a.id === areaId && a.activo)) {
      return validation([{ campo: 'areaId', mensaje: 'El área no existe o está inactiva.' }]);
    }
  } else if (!blank(areaId)) {
    return validation([{ campo: 'areaId', mensaje: 'Este rol no admite área.' }], 'La combinación de rol y área no es válida.');
  }
  return null;
}

const emailTaken = (correo, exceptId) => db.users.some(
  (u) => u.id !== exceptId && u.correo.toLowerCase() === String(correo).trim().toLowerCase(),
);
const duplicateEmail = () => problem(409, 'CORREO_DUPLICADO', 'Ya existe una cuenta con ese correo.');

const userHandlers = [
  http.get('/api/v1/admin/roles', ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    return HttpResponse.json(ROLES);
  }),

  http.get('/api/v1/admin/users/pending', ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const pending = db.users
      .filter((u) => u.estadoCuenta === 'PENDIENTE')
      .sort((a, b) => Date.parse(a.creadoEn) - Date.parse(b.creadoEn))
      .map(({ id, nombreCompleto, correo, creadoEn, estadoCuenta }) => ({ id, nombreCompleto, correo, creadoEn, estadoCuenta }));
    const page = paginate(pending, request.url);
    return HttpResponse.json({ ...page, totalPages: Math.max(1, Math.ceil(page.totalElements / page.size)) });
  }),

  http.get('/api/v1/admin/users', ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    return HttpResponse.json(paginate(db.users.map(publicUser), request.url));
  }),

  http.get('/api/v1/admin/users/:id', ({ request, params }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const target = db.users.find((u) => u.id === params.id);
    return target ? HttpResponse.json(publicUser(target)) : notFound('No encontramos la cuenta.');
  }),

  http.post('/api/v1/admin/users', async ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const body = await request.json().catch(() => ({}));
    const errores = ['nombreCompleto', 'correo', 'contrasenaInicial', 'rol']
      .filter((campo) => blank(body[campo]))
      .map((campo) => ({ campo, mensaje: 'Este campo es obligatorio.' }));
    if (!blank(body.rol) && !ROLES.some((r) => r.codigo === body.rol)) errores.push({ campo: 'rol', mensaje: 'El rol no existe.' });
    if (!blank(body.contrasenaInicial) && String(body.contrasenaInicial).length < 8) {
      errores.push({ campo: 'contrasenaInicial', mensaje: 'Usa al menos 8 caracteres.' });
    }
    if (errores.length) return validation(errores);
    const areaError = roleAreaError(body.rol, body.areaId);
    if (areaError) return areaError;
    if (emailTaken(body.correo)) return duplicateEmail();
    const created = {
      id: nextId(),
      nombreCompleto: body.nombreCompleto.trim(),
      correo: body.correo.trim(),
      telefono: blank(body.telefono) ? null : body.telefono,
      rol: body.rol,
      areaId: WITH_AREA.includes(body.rol) ? body.areaId : null,
      activo: true,
      estadoCuenta: 'ACTIVA',
      origenRegistro: 'ADMINISTRADOR',
      creadoEn: now(),
      contrasena: body.contrasenaInicial,
      debeCambiarContrasena: true,
    };
    db.users.push(created);
    return HttpResponse.json(publicUser(created), { status: 201, headers: { Location: `/api/v1/admin/users/${created.id}` } });
  }),

  http.patch('/api/v1/admin/users/:id/account-status', async ({ request, params }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const target = db.users.find((u) => u.id === params.id);
    if (!target) return notFound('No encontramos la cuenta.');
    const { estadoCuenta, motivo } = await request.json().catch(() => ({}));
    if (!['ACTIVA', 'RECHAZADA'].includes(estadoCuenta)) {
      return validation([{ campo: 'estadoCuenta', mensaje: 'Usa ACTIVA o RECHAZADA.' }]);
    }
    if (estadoCuenta === 'RECHAZADA' && (blank(motivo) || String(motivo).length > 500)) {
      return validation([{ campo: 'motivo', mensaje: 'Indica el motivo (hasta 500 caracteres).' }]);
    }
    if (target.estadoCuenta === 'ACTIVA' || target.estadoCuenta === estadoCuenta) {
      return problem(409, 'CUENTA_NO_PENDIENTE', 'La cuenta ya no está pendiente de aprobación.');
    }
    target.estadoCuenta = estadoCuenta;
    return HttpResponse.json(publicUser(target));
  }),

  http.post('/api/v1/admin/users/:id/password-reset', ({ request, params }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    if (params.id === user.id) {
      return problem(403, 'ACCESO_DENEGADO', 'No puedes restablecer tu propia contraseña desde aquí.');
    }
    const target = db.users.find((u) => u.id === params.id);
    if (!target) return notFound('No encontramos la cuenta.');
    if (!target.activo || target.estadoCuenta !== 'ACTIVA') {
      return problem(409, 'CUENTA_NO_ACTIVA', 'La cuenta no está activa.');
    }
    const contrasenaTemporal = `Temp${Math.floor(100000 + Math.random() * 900000)}x`;
    target.contrasena = contrasenaTemporal;
    target.debeCambiarContrasena = true;
    db.sessions.forEach((s) => {
      if (s.userId === target.id) s.revoked = true;
    });
    return HttpResponse.json({ contrasenaTemporal }, { headers: { 'Cache-Control': 'no-store' } });
  }),

  http.patch('/api/v1/admin/users/:id', async ({ request, params }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const target = db.users.find((u) => u.id === params.id);
    if (!target) return notFound('No encontramos la cuenta.');
    const raw = await request.json().catch(() => ({}));
    const allowed = ['nombreCompleto', 'correo', 'telefono', 'rol', 'areaId', 'activo'];
    if (Object.keys(raw).some((k) => !allowed.includes(k))) return validation([], 'Envía al menos un campo editable.');
    if (!Object.values(raw).some((v) => v !== null)) return validation([], 'Envíe al menos un campo para actualizar.');
    const patch = applyPatchSemantics(raw, ['telefono'], ['areaId']);
    const rol = patch.rol ?? target.rol;
    const areaId = 'areaId' in patch ? patch.areaId : target.areaId;
    if (!ROLES.some((r) => r.codigo === rol)) return validation([{ campo: 'rol', mensaje: 'El rol no existe.' }]);
    const areaError = roleAreaError(rol, areaId);
    if (areaError) return areaError;
    if ('correo' in patch && emailTaken(patch.correo, target.id)) return duplicateEmail();
    Object.assign(target, patch, { areaId: blank(areaId) ? null : areaId });
    if (patch.activo === false) {
      db.sessions.forEach((s) => {
        if (s.userId === target.id) s.revoked = true;
      });
    }
    return HttpResponse.json(publicUser(target));
  }),
];

// ---------- Catálogos ----------

const CATALOGS = {
  areas: {
    required: ['codigo', 'nombre'],
    editable: ['nombre', 'descripcion', 'activo'],
    unique: ['codigo', 'nombre'],
  },
  categories: {
    required: ['codigo', 'nombre', 'areaId', 'prioridadPredeterminadaId'],
    editable: ['nombre', 'descripcion', 'areaId', 'prioridadPredeterminadaId', 'activo'],
    unique: ['codigo', 'nombre'],
  },
  priorities: {
    required: ['codigo', 'nombre', 'nivel'],
    editable: ['nombre', 'nivel', 'color', 'activo'],
    unique: ['codigo', 'nombre', 'nivel'],
  },
};

function referenceErrors(kind, record) {
  if (kind !== 'categories') return [];
  const errores = [];
  if (!db.areas.some((a) => a.id === record.areaId && a.activo)) {
    errores.push({ campo: 'areaId', mensaje: 'El área no existe o está inactiva.' });
  }
  if (!db.priorities.some((p) => p.id === record.prioridadPredeterminadaId && p.activo)) {
    errores.push({ campo: 'prioridadPredeterminadaId', mensaje: 'La prioridad no existe o está inactiva.' });
  }
  return errores;
}

function duplicateOf(kind, record, exceptId) {
  const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  return CATALOGS[kind].unique.find((field) => record[field] !== undefined
    && db[kind].some((item) => item.id !== exceptId && same(item[field], record[field])));
}

/** Motivo del 409 por dependencias activas al desactivar, o `null`. */
function activeDependency(kind, record) {
  if (kind === 'areas') {
    const used = db.categories.some((c) => c.activo && c.areaId === record.id)
      || db.users.some((u) => u.activo && u.areaId === record.id);
    return used ? 'El área tiene categorías o personal activos.' : null;
  }
  if (kind === 'priorities') {
    return db.categories.some((c) => c.activo && c.prioridadPredeterminadaId === record.id)
      ? 'La prioridad es la predeterminada de categorías activas.'
      : null;
  }
  return null;
}

const duplicate = () => problem(409, 'DUPLICADO', 'Ya existe un registro con ese código o nombre.');

const catalogHandlers = Object.keys(CATALOGS).flatMap((kind) => [
  http.get(`/api/v1/admin/catalogs/${kind}`, ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    return HttpResponse.json(paginate(db[kind], request.url));
  }),

  http.post(`/api/v1/admin/catalogs/${kind}`, async ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const body = await request.json().catch(() => ({}));
    const errores = CATALOGS[kind].required
      .filter((campo) => blank(body[campo]))
      .map((campo) => ({ campo, mensaje: 'Este campo es obligatorio.' }));
    if (kind === 'priorities' && !blank(body.nivel) && !Number.isInteger(body.nivel)) {
      errores.push({ campo: 'nivel', mensaje: 'Usa un número entero.' });
    }
    if (errores.length) return validation(errores);
    const refs = referenceErrors(kind, body);
    if (refs.length) return validation(refs);
    const field = duplicateOf(kind, body);
    if (field) return duplicate(field);
    const created = { ...body, id: nextId(), activo: true };
    db[kind].push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`/api/v1/admin/catalogs/${kind}/:id`, async ({ request, params }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const target = db[kind].find((item) => item.id === params.id);
    if (!target) return notFound();
    const raw = await request.json().catch(() => ({}));
    if (!Object.keys(raw).length || Object.keys(raw).some((k) => !CATALOGS[kind].editable.includes(k))) {
      return validation([], 'Envía al menos un campo editable; el código no se modifica.');
    }
    if (!Object.values(raw).some((v) => v !== null)) return validation([], 'Envíe al menos un campo para actualizar.');
    const patch = applyPatchSemantics(raw, ['descripcion', 'color']);
    const keys = Object.keys(patch);
    if (patch.activo === false && target.activo) {
      const dependency = activeDependency(kind, target);
      if (dependency) return problem(409, 'DEPENDENCIAS_ACTIVAS', dependency);
    }
    if (keys.some((k) => k !== 'activo' && k !== 'descripcion' && k !== 'color' && blank(patch[k]))) {
      return validation(keys.filter((k) => blank(patch[k])).map((campo) => ({ campo, mensaje: 'Este campo es obligatorio.' })));
    }
    if ('areaId' in patch || 'prioridadPredeterminadaId' in patch) {
      const refs = referenceErrors(kind, { ...target, ...patch });
      if (refs.length) return validation(refs);
    }
    const field = duplicateOf(kind, patch, target.id);
    if (field) return duplicate(field);
    Object.assign(target, patch);
    return HttpResponse.json(target);
  }),
]);

const statusHandlers = [
  http.get('/api/v1/admin/catalogs/request-statuses', ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    return HttpResponse.json(db.requestStatuses);
  }),

  http.patch('/api/v1/admin/catalogs/request-statuses/:id', async ({ request, params }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const target = db.requestStatuses.find((s) => s.id === params.id);
    if (!target) return notFound('No encontramos el estado.');
    const patch = await request.json().catch(() => ({}));
    if (Object.keys(patch).some((k) => k !== 'nombre') || blank(patch.nombre)) {
      return validation([{ campo: 'nombre', mensaje: 'Solo se edita el nombre y es obligatorio.' }]);
    }
    target.nombre = patch.nombre.trim();
    return HttpResponse.json(target);
  }),
];

// ---------- Políticas SLA ----------

const END_OF_TIME = Number.POSITIVE_INFINITY;
const span = (p) => [Date.parse(p.vigenteDesde), p.vigenteHasta ? Date.parse(p.vigenteHasta) : END_OF_TIME];

function overlaps(policy, exceptId) {
  const [from, to] = span(policy);
  return db.slaPolicies.some((other) => {
    if (other.id === exceptId || !other.activo) return false;
    if (other.categoriaId !== policy.categoriaId || other.prioridadId !== policy.prioridadId) return false;
    const [otherFrom, otherTo] = span(other);
    return from < otherTo && otherFrom < to;
  });
}

function deadlineErrors(policy) {
  const errores = [];
  if (!Number.isInteger(policy.horasObjetivo) || policy.horasObjetivo <= 0) {
    errores.push({ campo: 'horasObjetivo', mensaje: 'Usa un número entero mayor que cero.' });
  }
  if (!Number.isInteger(policy.horasAviso) || policy.horasAviso <= 0 || policy.horasAviso >= policy.horasObjetivo) {
    errores.push({ campo: 'horasAviso', mensaje: 'Debe ser menor que las horas objetivo.' });
  }
  if (policy.vigenteHasta && Date.parse(policy.vigenteHasta) <= Date.parse(policy.vigenteDesde)) {
    errores.push({ campo: 'vigenteHasta', mensaje: 'Debe ser posterior al inicio de la vigencia.' });
  }
  return errores;
}

const slaConflict = () => problem(409, 'SLA_SUPERPUESTA', 'Ya hay una política activa para ese alcance en esas fechas.');

const slaHandlers = [
  http.get('/api/v1/admin/sla-policies', ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    return HttpResponse.json(paginate(db.slaPolicies, request.url));
  }),

  http.post('/api/v1/admin/sla-policies', async ({ request }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const body = await request.json().catch(() => ({}));
    const byCategory = !blank(body.categoriaId);
    const byPriority = !blank(body.prioridadId);
    if (byCategory === byPriority) {
      return validation([{ campo: 'categoriaId', mensaje: 'Indica una categoría o una prioridad, no ambas.' }]);
    }
    const policy = {
      id: nextId(),
      categoriaId: byCategory ? body.categoriaId : null,
      prioridadId: byPriority ? body.prioridadId : null,
      horasObjetivo: body.horasObjetivo,
      horasAviso: body.horasAviso,
      vigenteDesde: body.vigenteDesde || now(),
      vigenteHasta: body.vigenteHasta || null,
      activo: true,
    };
    const errores = deadlineErrors(policy);
    if (errores.length) return validation(errores);
    if (overlaps(policy)) return slaConflict();
    db.slaPolicies.push(policy);
    return HttpResponse.json(policy, { status: 201 });
  }),

  http.patch('/api/v1/admin/sla-policies/:id', async ({ request, params }) => {
    const user = admin(request);
    if (user instanceof Response) return user;
    const target = db.slaPolicies.find((p) => p.id === params.id);
    if (!target) return notFound('No encontramos la política.');
    const raw = await request.json().catch(() => ({}));
    const editable = ['horasObjetivo', 'horasAviso', 'vigenteDesde', 'vigenteHasta', 'activo'];
    if (!Object.keys(raw).length || Object.keys(raw).some((k) => !editable.includes(k))) {
      return validation([], 'El alcance de la política no se modifica.');
    }
    const patch = applyPatchSemantics(raw, []);
    if (!Object.keys(patch).length) return validation([], 'Envíe al menos un campo para actualizar.');
    const next = { ...target, ...patch };
    const errores = deadlineErrors(next);
    if (errores.length) return validation(errores);
    if (next.activo && overlaps(next, target.id)) return slaConflict();
    Object.assign(target, patch);
    return HttpResponse.json(target);
  }),
];

export const adminHandlers = [...userHandlers, ...catalogHandlers, ...statusHandlers, ...slaHandlers];
