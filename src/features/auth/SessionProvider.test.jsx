import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { db, DEMO_PASSWORD, signInMock } from '../../mocks/db.js';
import { request } from '../../services/http.js';
import * as authApi from './authApi.js';
import { SessionProvider, SESSION_RESTORE_TIMEOUT_MS, useSession } from './SessionProvider.jsx';

const ANA = { correo: 'ana.demo@universidad.example', contrasena: DEMO_PASSWORD };

function renderSession(props = {}) {
  return renderHook(() => useSession(), {
    wrapper: ({ children }) => <SessionProvider locks={null} {...props}>{children}</SessionProvider>,
  });
}

function countRequests(method, path) {
  const counter = { count: 0 };
  server.events.on('request:start', ({ request: req }) => {
    if (req.method === method && new URL(req.url).pathname === path) counter.count += 1;
  });
  return counter;
}

afterEach(() => server.events.removeAllListeners());

test('restaura la sesión al recargar con la cookie', async () => {
  signInMock(ANA.correo);
  const { result } = renderSession();
  expect(result.current.status).toBe('restoring');
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
  expect(result.current.user.nombreCompleto).toBe('Ana Demo');
});

test('sin cookie queda anonymous', async () => {
  const { result } = renderSession();
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  expect(result.current.user).toBeNull();
});

test('si la restauración tarda, no bloquea el ingreso', async () => {
  vi.useFakeTimers();
  try {
    const api = { ...authApi, refresh: () => new Promise(() => {}) };
    const { result } = renderSession({ api });
    expect(result.current.status).toBe('restoring');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SESSION_RESTORE_TIMEOUT_MS);
    });
    expect(result.current.status).toBe('anonymous');
    expect(result.current.user).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('dos peticiones protegidas que reciben 401 renuevan una sola vez', async () => {
  const { result } = renderSession();
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  await act(() => result.current.login(ANA));
  // El JWT vence: el servidor ya no lo reconoce, pero la cookie sigue vigente.
  db.sessions.at(-1).accessToken = 'vencido';
  const refreshes = countRequests('POST', '/api/v1/auth/refresh');
  const [first, second] = await Promise.all([
    request('/catalogs/categories'),
    request('/catalogs/categories'),
  ]);
  expect(refreshes.count).toBe(1);
  expect(first.items.length).toBeGreaterThan(0);
  expect(second.items.length).toBeGreaterThan(0);
});

test('ignora una renovación que termina después del logout', async () => {
  let finishRefresh;
  const api = {
    ...authApi,
    refresh: () => new Promise((resolve) => { finishRefresh = resolve; }),
    logout: async () => null,
  };
  const { result } = renderSession({ api });
  expect(result.current.status).toBe('restoring');
  await act(() => result.current.logout());
  await act(async () => {
    finishRefresh({
      tokenAcceso: 'tardío',
      expiraEnSegundos: 900,
      usuario: { id: '8', nombreCompleto: 'Ana Demo', rol: 'ESTUDIANTE', areaId: null },
      debeCambiarContrasena: false,
    });
  });
  expect(result.current.status).toBe('anonymous');
  expect(result.current.user).toBeNull();
});

test('redirige ante CAMBIO_CONTRASENA_REQUERIDO', async () => {
  const { result } = renderSession();
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  await act(() => result.current.login(ANA));
  expect(result.current.mustChangePassword).toBe(false);
  db.users.find((u) => u.correo === ANA.correo).debeCambiarContrasena = true;
  await act(() => request('/catalogs/categories').catch(() => {}));
  expect(result.current.mustChangePassword).toBe(true);
});

test('logout con fallo de red deja logoutPending y retryLogout lo completa', async () => {
  const { result } = renderSession();
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  await act(() => result.current.login(ANA));
  const session = db.sessions.at(-1);
  server.use(http.post('/api/v1/auth/logout', () => HttpResponse.error(), { once: true }));
  await act(() => result.current.logout());
  expect(result.current.status).toBe('anonymous');
  expect(result.current.logoutPending).toBe(true);
  expect(session.revoked).toBe(false);
  await act(() => result.current.retryLogout());
  expect(result.current.logoutPending).toBe(false);
  expect(session.revoked).toBe(true);
});

test('changePassword reemplaza el token', async () => {
  const { result } = renderSession();
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  await act(() => result.current.login({ correo: 'nuevo.demo@universidad.example', contrasena: DEMO_PASSWORD }));
  expect(result.current.mustChangePassword).toBe(true);
  await act(() => result.current.changePassword({ contrasenaActual: DEMO_PASSWORD, contrasenaNueva: 'nueva2026' }));
  expect(result.current.mustChangePassword).toBe(false);
  let authorization;
  server.events.on('request:start', ({ request: req }) => {
    if (new URL(req.url).pathname === '/api/v1/catalogs/categories') authorization = req.headers.get('Authorization');
  });
  await request('/catalogs/categories');
  expect(authorization).toBe(`Bearer ${db.sessions.at(-1).accessToken}`);
});

test('changePassword renueva el JWT vencido y reintenta', async () => {
  const { result } = renderSession();
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  await act(() => result.current.login({ correo: 'nuevo.demo@universidad.example', contrasena: DEMO_PASSWORD }));
  db.sessions.at(-1).accessToken = 'vencido';
  const refreshes = countRequests('POST', '/api/v1/auth/refresh');
  await act(() => result.current.changePassword({ contrasenaActual: DEMO_PASSWORD, contrasenaNueva: 'nueva2026' }));
  expect(refreshes.count).toBe(1);
  expect(result.current.mustChangePassword).toBe(false);
});

test('un 401 que llega después del logout no restaura la sesión', async () => {
  const { result } = renderSession();
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  await act(() => result.current.login(ANA));
  db.sessions.at(-1).accessToken = 'vencido';
  let release;
  let entered;
  const handlerEntered = new Promise((resolve) => { entered = resolve; });
  // El servidor procesa la renovación antes que el logout: el logout no revoca a tiempo.
  server.use(
    http.get('/api/v1/catalogs/categories', async () => {
      entered();
      await new Promise((resolve) => { release = resolve; });
    }, { once: true }),
    http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 }), { once: true }),
  );
  const refreshes = countRequests('POST', '/api/v1/auth/refresh');
  const pending = request('/catalogs/categories').catch(() => null);
  await handlerEntered;
  await act(() => result.current.logout());
  release();
  await act(() => pending);
  expect(refreshes.count).toBe(0);
  expect(result.current.status).toBe('anonymous');
});
