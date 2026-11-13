import { HttpResponse } from 'msw';

import { db } from './state.js';

export { db, resetDb, DEMO_PASSWORD } from './state.js';

let correlationCounter = 0;

/** Respuesta application/problem+json con la forma del backend. */
export function problem(status, codigo, detail, errores) {
  correlationCounter += 1;
  const correlationId = `mock-${correlationCounter}`;
  const body = { title: detail, status, detail, codigo, correlationId };
  if (errores?.length) body.errores = errores;
  return HttpResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json', 'X-Correlation-ID': correlationId },
  });
}

/** Página `{items, page, size, totalElements}` a partir de `page` y `size` de la URL. */
export function paginate(items, url) {
  const params = new URL(url, 'http://localhost').searchParams;
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);
  const size = Math.min(100, Math.max(1, Number(params.get('size') ?? 20) || 20));
  return {
    items: items.slice(page * size, page * size + size),
    page,
    size,
    totalElements: items.length,
  };
}

/** Siguiente identificador numérico como string (ids del backend). */
export function nextId() {
  db.sequence += 1;
  return String(db.sequence);
}

/** Crea una sesión para `user` y deja su refresh en la cookie simulada. */
export function issueSession(user) {
  const id = nextId();
  const session = {
    id,
    userId: user.id,
    accessToken: `mock-access-${id}-1`,
    refreshToken: `mock-refresh-${id}-1`,
    rotations: 1,
    usedRefreshTokens: [],
    revoked: false,
  };
  db.sessions.push(session);
  db.refreshCookie = session.refreshToken;
  return session;
}

/** Rota el JWT y el refresh de la sesión. */
export function rotateSession(session) {
  session.usedRefreshTokens.push(session.refreshToken);
  session.rotations += 1;
  session.accessToken = `mock-access-${session.id}-${session.rotations}`;
  session.refreshToken = `mock-refresh-${session.id}-${session.rotations}`;
  db.refreshCookie = session.refreshToken;
  return session;
}

export function sessionResponse(session) {
  const user = db.users.find((u) => u.id === session.userId);
  return {
    tokenAcceso: session.accessToken,
    expiraEnSegundos: 900,
    usuario: { id: user.id, nombreCompleto: user.nombreCompleto, rol: user.rol, areaId: user.areaId },
    debeCambiarContrasena: user.debeCambiarContrasena,
  };
}

/** Sesión vigente del Bearer de la petición, o `null`. */
export function sessionFromRequest(request) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  return db.sessions.find((s) => !s.revoked && s.accessToken === token) || null;
}

/**
 * Usuario autenticado de la petición, o la respuesta de error que corresponde:
 * 401 sin Bearer válido, 403 CAMBIO_CONTRASENA_REQUERIDO en primer ingreso y
 * 403 ACCESO_DENEGADO si el rol no está en `roles`.
 */
export function requireUser(request, roles) {
  const session = sessionFromRequest(request);
  if (!session) return problem(401, 'NO_AUTENTICADO', 'Necesitas iniciar sesión.');
  const user = db.users.find((u) => u.id === session.userId);
  if (user.debeCambiarContrasena) {
    return problem(403, 'CAMBIO_CONTRASENA_REQUERIDO', 'Debes cambiar tu contraseña antes de continuar.');
  }
  if (roles && !roles.includes(user.rol)) {
    return problem(403, 'ACCESO_DENEGADO', 'No tienes permiso para realizar esta operación.');
  }
  return user;
}

/** Atajo de pruebas: inicia una sesión simulada y devuelve su JWT. */
export function signInMock(correo) {
  const user = db.users.find((u) => u.correo === correo);
  return issueSession(user).accessToken;
}
