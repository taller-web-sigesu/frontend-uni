import { http, HttpResponse } from 'msw';
import {
  db, issueSession, nextId, problem, rotateSession, sessionFromRequest, sessionResponse,
} from '../db.js';
import { isInstitutionalEmail, validatePassword } from '../../features/auth/passwordPolicy.js';

const MAX_FAILURES = 5;
const REGISTERED_MESSAGE = 'Registro enviado. Podrás ingresar cuando un administrador apruebe tu cuenta';

const normalize = (email) => (email || '').trim().toLowerCase();
const findByEmail = (email) => db.users.find((u) => normalize(u.correo) === normalize(email));

function validation(errores) {
  return problem(400, 'VALIDACION', 'Revisa los datos ingresados.', errores);
}

function required(body, fields) {
  return fields
    .filter((campo) => !String(body?.[campo] ?? '').trim())
    .map((campo) => ({ campo, mensaje: 'Este campo es obligatorio.' }));
}

export const authHandlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const missing = required(body, ['correo', 'contrasena']);
    if (missing.length) return validation(missing);

    const key = normalize(body.correo);
    if ((db.loginFailures[key] || 0) >= MAX_FAILURES) {
      return problem(429, 'LIMITE_INTENTOS', 'Demasiados intentos. Espera unos minutos.');
    }
    const user = findByEmail(body.correo);
    if (!user || !user.activo || user.contrasena !== body.contrasena) {
      db.loginFailures[key] = (db.loginFailures[key] || 0) + 1;
      return problem(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
    }
    db.loginFailures[key] = 0;
    if (user.estadoCuenta === 'PENDIENTE') {
      return problem(403, 'CUENTA_PENDIENTE', 'La cuenta está pendiente de aprobación.');
    }
    if (user.estadoCuenta === 'RECHAZADA') {
      return problem(403, 'CUENTA_RECHAZADA', 'La cuenta fue rechazada.');
    }
    return HttpResponse.json(sessionResponse(issueSession(user)));
  }),

  http.post('/api/v1/auth/refresh', () => {
    const cookie = db.refreshCookie;
    if (!cookie) return problem(401, 'NO_AUTENTICADO', 'La sesión expiró.');
    const reused = db.sessions.find((s) => s.usedRefreshTokens.includes(cookie));
    if (reused) {
      // Reutilizar un refresh ya rotado revoca la sesión, como el backend.
      reused.revoked = true;
      db.refreshCookie = null;
      return problem(401, 'NO_AUTENTICADO', 'La sesión fue revocada.');
    }
    const session = db.sessions.find((s) => !s.revoked && s.refreshToken === cookie);
    if (!session) return problem(401, 'NO_AUTENTICADO', 'La sesión expiró.');
    return HttpResponse.json(sessionResponse(rotateSession(session)));
  }),

  http.post('/api/v1/auth/logout', ({ request }) => {
    const session = sessionFromRequest(request)
      || db.sessions.find((s) => !s.revoked && s.refreshToken === db.refreshCookie);
    if (!session) return problem(401, 'NO_AUTENTICADO', 'No hay una sesión activa.');
    session.revoked = true;
    db.refreshCookie = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('/api/v1/auth/password', async ({ request }) => {
    const session = sessionFromRequest(request);
    if (!session) return problem(401, 'NO_AUTENTICADO', 'Necesitas iniciar sesión.');
    const body = await request.json().catch(() => ({}));
    const missing = required(body, ['contrasenaActual', 'contrasenaNueva']);
    if (missing.length) return validation(missing);
    const user = db.users.find((u) => u.id === session.userId);
    if (user.contrasena !== body.contrasenaActual) {
      return validation([{ campo: 'contrasenaActual', mensaje: 'La contraseña actual no es correcta.' }]);
    }
    const policy = validatePassword(body.contrasenaNueva);
    if (policy) return validation([{ campo: 'contrasenaNueva', mensaje: policy }]);

    user.contrasena = body.contrasenaNueva;
    user.debeCambiarContrasena = false;
    db.sessions.filter((s) => s.userId === user.id).forEach((s) => { s.revoked = true; });
    return HttpResponse.json(sessionResponse(issueSession(user)));
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const errores = required(body, ['nombreCompleto', 'correo', 'contrasena', 'confirmacionContrasena']);
    if (!errores.some((e) => e.campo === 'correo') && !isInstitutionalEmail(body.correo)) {
      errores.push({ campo: 'correo', mensaje: 'Usa tu correo institucional @unmsm.edu.pe.' });
    }
    const policy = body.contrasena ? validatePassword(body.contrasena) : null;
    if (policy) errores.push({ campo: 'contrasena', mensaje: policy });
    if (body.contrasena && body.confirmacionContrasena && body.contrasena !== body.confirmacionContrasena) {
      errores.push({ campo: 'confirmacionContrasena', mensaje: 'Las contraseñas no coinciden.' });
    }
    if (errores.length) return validation(errores);
    if (findByEmail(body.correo)) {
      return problem(409, 'CORREO_REGISTRADO', 'Este correo ya está registrado.');
    }
    // Cualquier otro campo (como `rol`) se ignora: siempre ESTUDIANTE sin área.
    db.users.push({
      id: nextId(),
      nombreCompleto: body.nombreCompleto.trim(),
      correo: normalize(body.correo),
      rol: 'ESTUDIANTE',
      areaId: null,
      telefono: null,
      activo: true,
      estadoCuenta: 'PENDIENTE',
      origenRegistro: 'AUTOREGISTRO',
      creadoEn: new Date().toISOString(),
      contrasena: body.contrasena,
      debeCambiarContrasena: false,
    });
    return HttpResponse.json({ mensaje: REGISTERED_MESSAGE }, { status: 201 });
  }),
];
