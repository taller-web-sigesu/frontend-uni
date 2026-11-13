import { HttpResponse } from 'msw';

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
