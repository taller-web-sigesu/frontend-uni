import { server } from '../mocks/server.js';
import { db } from '../mocks/db.js';

/** Usuario en sesión tal como lo devuelve el login, a partir de la API simulada. */
export function userById(id) {
  const { nombreCompleto, rol, areaId } = db.users.find((u) => u.id === id);
  return { id, nombreCompleto, rol, areaId };
}

export const ANA = '8';
export const PEDRO = '9';
export const SUPERVISORA_TI = '2';
export const TECNICO_TI = '5';
export const TECNICA_TI = '6';

/**
 * Registra las peticiones `method path` (path exacto o RegExp) con su URL y su
 * cuerpo JSON. Limpiar con `server.events.removeAllListeners()`.
 */
export function captureRequests(method, path) {
  const calls = [];
  server.events.on('request:start', async ({ request }) => {
    const url = new URL(request.url);
    const matches = path instanceof RegExp ? path.test(url.pathname) : url.pathname === path;
    if (request.method !== method || !matches) return;
    const isJson = (request.headers.get('Content-Type') || '').includes('json');
    calls.push({ url, body: isJson ? await request.clone().json().catch(() => null) : null });
  });
  return calls;
}
