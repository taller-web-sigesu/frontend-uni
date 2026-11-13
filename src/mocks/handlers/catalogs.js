import { http, HttpResponse } from 'msw';
import { db, paginate } from '../db.js';

// La fase 02 añade la comprobación del Bearer (requireUser) a este handler.
export const catalogHandlers = [
  http.get('/api/v1/catalogs/categories', ({ request }) => {
    const enabled = db.categories
      .filter((category) => category.activo)
      .map(({ id, nombre }) => ({ id, nombre }));
    return HttpResponse.json(paginate(enabled, request.url));
  }),
];
