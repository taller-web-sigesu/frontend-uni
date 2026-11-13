import { request } from '../../services/http.js';

// Las operaciones /auth/* nunca reintentan tras un 401: el 401 es la respuesta.
const PUBLIC = { auth: false, retryOnUnauthorized: false };

export function login({ correo, contrasena }) {
  return request('/auth/login', { method: 'POST', body: { correo, contrasena }, ...PUBLIC });
}

export function refresh() {
  return request('/auth/refresh', { method: 'POST', ...PUBLIC });
}

/** Revoca la sesión con el JWT previo: la sesión local ya se limpió al llamar. */
export function logout(accessToken) {
  return request('/auth/logout', { method: 'POST', accessToken, retryOnUnauthorized: false });
}

export function changePassword({ contrasenaActual, contrasenaNueva }) {
  return request('/auth/password', {
    method: 'PATCH',
    body: { contrasenaActual, contrasenaNueva },
    retryOnUnauthorized: false,
  });
}

/** Solo envía los cuatro campos del contrato: nunca `rol`. */
export function register({ nombreCompleto, correo, contrasena, confirmacionContrasena }) {
  return request('/auth/register', {
    method: 'POST',
    body: { nombreCompleto, correo, contrasena, confirmacionContrasena },
    ...PUBLIC,
  });
}
