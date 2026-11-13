import { http, HttpResponse } from 'msw';

export const statusHandlers = [
  http.get('/api/v1/status', () => HttpResponse.json({ status: 'UP' })),
];
