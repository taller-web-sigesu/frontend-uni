import { ApiError, NETWORK_ERROR, parseProblem } from './apiError.js';

const API_PREFIX = '/api/v1';

let handlers = {};

/**
 * La sesión (fase 02) registra cómo obtener el token, cómo renovarlo y qué
 * hacer ante un problema; este módulo no conoce el estado de sesión.
 */
export function configureHttp({ getAccessToken, renewSession, onProblem } = {}) {
  handlers = { getAccessToken, renewSession, onProblem };
}

export function isAbort(error) {
  return error?.name === 'AbortError';
}

function buildUrl(path, query) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, String(value));
  });
  const search = params.toString();
  return `${API_PREFIX}${path}${search ? `?${search}` : ''}`;
}

function filenameFrom(disposition) {
  if (!disposition) return null;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // Se usa el nombre simple si la codificación es inválida.
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : null;
}

async function send(url, { method, body, formData, signal, auth }) {
  const headers = new Headers();
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }
  const token = auth ? handlers.getAccessToken?.() : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    return await fetch(url, { method, headers, body: payload, signal, credentials: 'same-origin' });
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError({ kind: 'network', detail: NETWORK_ERROR });
  }
}

async function readBody(response, responseType) {
  if (response.status === 204) return null;
  if (responseType === 'blob') {
    return { blob: await response.blob(), filename: filenameFrom(response.headers.get('Content-Disposition')) };
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function request(path, {
  method = 'GET',
  query,
  body,
  formData,
  signal,
  responseType = 'json',
  auth = true,
  retryOnUnauthorized = true,
} = {}) {
  const url = buildUrl(path, query);
  const options = { method, body, formData, signal, auth };
  let response = await send(url, options);

  if (response.status === 401 && auth && retryOnUnauthorized && handlers.renewSession) {
    const renewed = await handlers.renewSession();
    if (renewed) response = await send(url, options);
  }

  if (!response.ok) {
    const error = await parseProblem(response);
    handlers.onProblem?.(error);
    throw error;
  }
  return readBody(response, responseType);
}
