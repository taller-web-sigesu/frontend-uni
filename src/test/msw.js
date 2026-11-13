import { server } from '../mocks/server.js';
import { resetDb } from '../mocks/db.js';

// MSW con 'error' solo escribe en stderr; aquí cada petición sin handler se
// registra y hace fallar la prueba en afterEach.
let unhandled = [];

/** Devuelve y limpia las peticiones sin handler (para la prueba que lo verifica). */
export function takeUnhandledRequests() {
  const taken = unhandled;
  unhandled = [];
  return taken;
}

beforeAll(() => server.listen({
  onUnhandledRequest(request) {
    unhandled.push(`${request.method} ${new URL(request.url).pathname}`);
  },
}));

afterEach(() => {
  server.resetHandlers();
  resetDb();
  const pending = takeUnhandledRequests();
  if (pending.length) {
    throw new Error(`Peticiones sin handler de MSW: ${pending.join(', ')}`);
  }
});

afterAll(() => server.close());
