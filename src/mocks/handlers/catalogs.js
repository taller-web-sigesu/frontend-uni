import { http, HttpResponse } from 'msw';
import { db, paginate, requireUser } from '../db.js';

export const catalogHandlers = [
  http.get('/api/v1/catalogs/categories', ({ request }) => {
    const user = requireUser(request);
    if (user instanceof Response) return user;
    const enabled = db.categories
      .filter((category) => category.activo)
      .map(({ id, nombre }) => ({ id, nombre }));
    return HttpResponse.json(paginate(enabled, request.url));
  }),
];
