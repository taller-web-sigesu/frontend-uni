import { request, configureHttp, isAbort } from './http.js';
import { ApiError } from './apiError.js';

function jsonResponse(status, body, headers = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function problemResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json', ...headers },
  });
}

let fetchSpy;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, 'fetch');
  configureHttp({});
});

afterEach(() => {
  fetchSpy.mockRestore();
  configureHttp({});
});

function lastCall() {
  const [url, init] = fetchSpy.mock.calls.at(-1);
  return { url, init, headers: new Headers(init.headers) };
}

test('arma la URL con prefijo y omite query vacía', async () => {
  fetchSpy.mockResolvedValue(jsonResponse(200, { items: [] }));
  await request('/requests', { query: { page: 0, size: 20, estado: '', categoriaId: undefined, prioridadId: null } });
  expect(lastCall().url).toBe('/api/v1/requests?page=0&size=20');
});

test('envía JSON y devuelve el cuerpo', async () => {
  fetchSpy.mockResolvedValue(jsonResponse(201, { id: '31' }));
  const data = await request('/requests', { method: 'POST', body: { categoriaId: '3' } });
  const { init, headers } = lastCall();
  expect(data).toEqual({ id: '31' });
  expect(init.method).toBe('POST');
  expect(headers.get('Content-Type')).toBe('application/json');
  expect(init.body).toBe('{"categoriaId":"3"}');
});

test('204 devuelve null', async () => {
  fetchSpy.mockResolvedValue(new Response(null, { status: 204 }));
  expect(await request('/auth/logout', { method: 'POST' })).toBeNull();
});

test('normaliza problem+json con errores de campo', async () => {
  fetchSpy.mockResolvedValue(problemResponse(400, {
    status: 400,
    codigo: 'VALIDACION',
    detail: 'Datos inválidos',
    correlationId: 'c1',
    errores: [{ campo: 'correo', mensaje: 'Obligatorio' }],
  }));
  const error = await request('/auth/login', { method: 'POST', body: {} }).catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({
    kind: 'http',
    status: 400,
    codigo: 'VALIDACION',
    detail: 'Datos inválidos',
    correlationId: 'c1',
    fieldErrors: { correo: 'Obligatorio' },
  });
});

test('convierte un 502 HTML en ApiError', async () => {
  fetchSpy.mockResolvedValue(new Response('<html>Bad gateway</html>', {
    status: 502,
    headers: { 'Content-Type': 'text/html', 'X-Correlation-ID': 'gw-1' },
  }));
  const error = await request('/requests').catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({
    kind: 'http',
    status: 502,
    detail: 'No se pudo completar la operación.',
    correlationId: 'gw-1',
    fieldErrors: {},
  });
});

test('fallo de red produce kind network', async () => {
  fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));
  const error = await request('/requests').catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ kind: 'network', status: null, detail: 'No hay conexión con el servidor.' });
});

test('una petición abortada se relanza como AbortError', async () => {
  fetchSpy.mockRejectedValue(new DOMException('aborted', 'AbortError'));
  const error = await request('/requests').catch((e) => e);
  expect(isAbort(error)).toBe(true);
  expect(error).not.toBeInstanceOf(ApiError);
});

test('blob lee filename de Content-Disposition', async () => {
  fetchSpy.mockResolvedValue(new Response('codigo\n', {
    status: 200,
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="solicitudes.csv"' },
  }));
  const result = await request('/dashboard/reports', { responseType: 'blob' });
  expect(result.filename).toBe('solicitudes.csv');
  expect(await result.blob.text()).toBe('codigo\n');
});

test('blob decodifica filename* en UTF-8', async () => {
  fetchSpy.mockResolvedValue(new Response('x', {
    status: 200,
    headers: { 'Content-Disposition': "attachment; filename*=UTF-8''foto%20a%C3%B1o.jpg" },
  }));
  const result = await request('/requests/1/attachments/7/content', { responseType: 'blob' });
  expect(result.filename).toBe('foto año.jpg');
});

test('formData no fija Content-Type', async () => {
  fetchSpy.mockResolvedValue(jsonResponse(201, { id: '7' }));
  const formData = new FormData();
  formData.append('archivo', new Blob(['x']), 'a.png');
  await request('/requests/1/attachments', { method: 'POST', formData });
  const { init, headers } = lastCall();
  expect(init.body).toBe(formData);
  expect(headers.has('Content-Type')).toBe(false);
});

test('añade Bearer y reintenta una vez tras renovar', async () => {
  let token = 'viejo';
  const renewSession = vi.fn(async () => { token = 'nuevo'; return true; });
  configureHttp({ getAccessToken: () => token, renewSession });
  fetchSpy
    .mockResolvedValueOnce(problemResponse(401, { status: 401 }))
    .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
  const data = await request('/requests');
  expect(data).toEqual({ ok: true });
  expect(fetchSpy).toHaveBeenCalledTimes(2);
  expect(new Headers(fetchSpy.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer viejo');
  expect(new Headers(fetchSpy.mock.calls[1][1].headers).get('Authorization')).toBe('Bearer nuevo');
  expect(renewSession).toHaveBeenCalledTimes(1);
});

test('auth false no envía Authorization', async () => {
  configureHttp({ getAccessToken: () => 'tok' });
  fetchSpy.mockResolvedValue(jsonResponse(200, {}));
  await request('/auth/login', { method: 'POST', body: {}, auth: false });
  expect(lastCall().headers.has('Authorization')).toBe(false);
});

test('no reintenta con retryOnUnauthorized false', async () => {
  const renewSession = vi.fn(async () => true);
  configureHttp({ getAccessToken: () => 't', renewSession });
  fetchSpy.mockResolvedValue(problemResponse(401, { status: 401 }));
  await expect(request('/auth/password', { method: 'PATCH', body: {}, retryOnUnauthorized: false }))
    .rejects.toMatchObject({ status: 401 });
  expect(renewSession).not.toHaveBeenCalled();
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});

test('no reintenta dos veces si vuelve 401', async () => {
  const renewSession = vi.fn(async () => true);
  configureHttp({ getAccessToken: () => 't', renewSession });
  fetchSpy.mockImplementation(async () => problemResponse(401, { status: 401 }));
  await expect(request('/requests')).rejects.toMatchObject({ status: 401 });
  expect(renewSession).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledTimes(2);
});

test('si la renovación falla no repite la petición', async () => {
  const renewSession = vi.fn(async () => false);
  configureHttp({ getAccessToken: () => 't', renewSession });
  fetchSpy.mockResolvedValue(problemResponse(401, { status: 401 }));
  await expect(request('/requests')).rejects.toMatchObject({ status: 401 });
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});

test('notifica onProblem con el ApiError', async () => {
  const onProblem = vi.fn();
  configureHttp({ onProblem });
  fetchSpy.mockResolvedValue(problemResponse(403, { status: 403, codigo: 'CAMBIO_CONTRASENA_REQUERIDO' }));
  await request('/requests').catch(() => {});
  expect(onProblem).toHaveBeenCalledTimes(1);
  expect(onProblem.mock.calls[0][0]).toMatchObject({ status: 403, codigo: 'CAMBIO_CONTRASENA_REQUERIDO' });
});
