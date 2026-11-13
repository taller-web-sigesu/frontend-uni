import { server } from '../../mocks/server.js';
import { signInAs } from '../../test/session.js';
import { captureRequests } from '../../test/users.js';
import { downloadReport, getSummary } from './dashboardApi.js';

const ADMIN = 'admin.demo@universidad.example';
const SUPERVISOR_TI = 'supervisor.ti.demo@universidad.example';
const RANGE = { fechaDesde: '2026-11-01T05:00:00Z', fechaHasta: '2026-12-01T05:00:00Z' };

afterEach(() => server.events.removeAllListeners());

test('getSummary envía el rango y el área', async () => {
  signInAs(ADMIN);
  const calls = captureRequests('GET', '/api/v1/dashboard/summary');
  const summary = await getSummary({ ...RANGE, areaId: '2' });
  const params = calls[0].url.searchParams;
  expect(params.get('fechaDesde')).toBe('2026-11-01T05:00:00Z');
  expect(params.get('fechaHasta')).toBe('2026-12-01T05:00:00Z');
  expect(params.get('areaId')).toBe('2');
  expect(summary.filtros.areaId).toBe('2');
  expect(summary).toEqual(expect.objectContaining({
    registradas: expect.any(Number),
    porCategoria: expect.any(Array),
    vencidas: expect.objectContaining({ disponible: expect.any(Boolean) }),
  }));
});

test('el supervisor recibe 403 al pedir otra área', async () => {
  signInAs(SUPERVISOR_TI);
  await expect(getSummary({ ...RANGE, areaId: '2' })).rejects.toMatchObject({ status: 403 });
  await expect(getSummary({ ...RANGE, fechaHasta: RANGE.fechaDesde })).rejects.toMatchObject({ status: 400 });
});

test('downloadReport devuelve el CSV con el encabezado exacto', async () => {
  signInAs(SUPERVISOR_TI);
  const calls = captureRequests('GET', '/api/v1/dashboard/reports');
  const { blob, filename } = await downloadReport({ tipo: 'solicitudes', ...RANGE });
  expect(calls[0].url.searchParams.get('tipo')).toBe('solicitudes');
  expect(filename).toBe('solicitudes.csv');
  expect((await blob.text()).split('\n')[0]).toBe('codigo,categoria,area,estado,prioridad,responsable,creadoEn');
});
