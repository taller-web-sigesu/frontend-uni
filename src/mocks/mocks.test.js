import { http } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from './server.js';
import { takeUnhandledRequests } from '../test/msw.js';
import { db, resetDb, problem, paginate } from './db.js';
import { request } from '../services/http.js';
import { ApiError } from '../services/apiError.js';
import { listEnabledCategories, useCatalogLabels } from '../services/catalogs.js';
import { listPriorityOptions, priorityName, surveyAnswered, isMockMode } from '../services/pendingContract.js';

test('GET /api/v1/status responde UP desde el mock', async () => {
  expect(await request('/status', { auth: false })).toEqual({ status: 'UP' });
});

test('problem() produce problem+json que request convierte en ApiError', async () => {
  server.use(http.get('/api/v1/prueba', () => problem(409, 'CONFLICTO', 'Ya existe', [{ campo: 'codigo', mensaje: 'Duplicado' }])));
  const error = await request('/prueba').catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ status: 409, codigo: 'CONFLICTO', detail: 'Ya existe', fieldErrors: { codigo: 'Duplicado' } });
  expect(error.correlationId).toEqual(expect.any(String));
});

test('paginate respeta page y size', () => {
  const items = Array.from({ length: 45 }, (_, i) => ({ id: String(i) }));
  const page = paginate(items, new URL('http://x/api?page=2&size=20'));
  expect(page.items).toHaveLength(5);
  expect(page.items[0].id).toBe('40');
  expect(page).toMatchObject({ page: 2, size: 20, totalElements: 45 });
});

test('paginate usa page 0 y size 20 por defecto', () => {
  const page = paginate(Array.from({ length: 25 }, (_, i) => i), 'http://x/api');
  expect(page).toMatchObject({ page: 0, size: 20, totalElements: 25 });
  expect(page.items).toHaveLength(20);
});

test('resetDb restaura los datos', () => {
  db.categories[0].nombre = 'Cambiada';
  db.users.push({ id: '999' });
  resetDb();
  expect(db.categories[0].nombre).toBe('Conectividad');
  expect(db.users.find((u) => u.id === '999')).toBeUndefined();
});

test('los usuarios de demostración replican la guía de integración', () => {
  const byEmail = Object.fromEntries(db.users.map((u) => [u.correo, u]));
  expect(byEmail['admin.demo@universidad.example'].rol).toBe('ADMINISTRADOR');
  expect(byEmail['supervisor.ti.demo@universidad.example']).toMatchObject({ rol: 'SUPERVISOR', areaId: '1' });
  expect(byEmail['pedro.demo@universidad.example']).toMatchObject({ rol: 'DOCENTE', areaId: null });
  db.users.forEach((u) => expect(typeof u.id).toBe('string'));
});

test('una petición sin handler queda registrada para hacer fallar la prueba', async () => {
  await expect(request('/no-existe')).rejects.toBeInstanceOf(ApiError);
  expect(takeUnhandledRequests()).toEqual(['GET /api/v1/no-existe']);
});

test('listEnabledCategories devuelve solo categorías activas', async () => {
  const categories = await listEnabledCategories();
  expect(categories.map((c) => c.nombre)).toContain('Conectividad');
  expect(categories.every((c) => typeof c.id === 'string')).toBe(true);
  const inactive = db.categories.find((c) => !c.activo);
  expect(categories.find((c) => c.id === inactive.id)).toBeUndefined();
});

test('useCatalogLabels resuelve categoría y usa respaldo para desconocidas', async () => {
  const { result } = renderHook(() => useCatalogLabels());
  await waitFor(() => expect(result.current.ready).toBe(true));
  expect(result.current.categoryName('3')).toBe('Conectividad');
  expect(result.current.categoryName('999')).toBe('Categoría 999');
});

test('pendingContract en pruebas usa los datos simulados', async () => {
  expect(isMockMode()).toBe(true);
  const options = await listPriorityOptions();
  expect(options.map((o) => o.nombre)).toEqual(['Baja', 'Media', 'Alta']);
  expect(priorityName('4')).toBe('Media');
  expect(priorityName('999')).toBe('Prioridad 999');
});

test('surveyAnswered lee la marca si existe', () => {
  expect(surveyAnswered({ encuestaRespondida: true })).toBe(true);
  expect(surveyAnswered({ encuestaRespondida: false })).toBe(false);
  expect(surveyAnswered({})).toBeNull();
});
