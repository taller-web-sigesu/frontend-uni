import { server } from '../../mocks/server.js';
import { signInAs } from '../../test/session.js';
import * as api from './requestsApi.js';

const ANA = 'ana.demo@universidad.example';
const TECNICO_TI = 'tecnico.ti.demo@universidad.example';
const SUPERVISOR_TI = 'supervisor.ti.demo@universidad.example';
const SUPERVISOR_MANT = 'supervisor.mant.demo@universidad.example';
const ADMIN = 'admin.demo@universidad.example';

/** Archivo con la firma real del tipo: el servidor detecta el tipo por el contenido. */
function pngFile(name = 'foto.png') {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])], name, { type: 'image/png' });
}

afterEach(() => server.events.removeAllListeners());

test('el estudiante lista solo sus solicitudes', async () => {
  signInAs(ANA);
  const page = await api.listRequests({ page: 0, size: 50 });
  expect(page.items.length).toBeGreaterThan(0);
  const details = await Promise.all(page.items.map((item) => api.getRequest(item.id)));
  details.forEach((detail) => expect(detail.solicitante.nombreCompleto).toBe('Ana Demo'));
});

test('el técnico recibe solo asignaciones vigentes', async () => {
  signInAs(TECNICO_TI);
  const page = await api.listRequests({ page: 0, size: 50 });
  expect(page.items.length).toBeGreaterThan(0);
  const details = await Promise.all(page.items.map((item) => api.getRequest(item.id)));
  details.forEach((detail) => {
    expect(detail.responsableActual.nombreCompleto).toBe('Técnico TI Demo');
    expect(['CERRADO', 'RECHAZADO']).not.toContain(detail.estado);
  });
});

test('el supervisor filtra por estado', async () => {
  signInAs(SUPERVISOR_TI);
  let query;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname === '/api/v1/requests') query = url.searchParams;
  });
  const page = await api.listRequests({ page: 0, size: 20, estado: 'NUEVO' });
  expect(query.get('estado')).toBe('NUEVO');
  expect(page.items.length).toBeGreaterThan(0);
  page.items.forEach((item) => {
    expect(item.estado).toBe('NUEVO');
    expect(item.areaId).toBe('1');
  });
});

test('el administrador recibe 403 en /requests', async () => {
  signInAs(ADMIN);
  await expect(api.listRequests({ page: 0 })).rejects.toMatchObject({ status: 403 });
  await expect(api.getRequest('1')).rejects.toMatchObject({ status: 403 });
});

test('createRequest devuelve 201 con código SOL-', async () => {
  signInAs(ANA);
  const created = await api.createRequest({ categoriaId: '3', ubicacion: 'Pabellón B, aula 204', descripcion: 'Sin Wi-Fi.' });
  expect(created.codigo).toMatch(/^SOL-2026-\d{6}$/);
  expect(created.estado).toBe('NUEVO');
  expect(created.areaId).toBe('1');
  const detail = await api.getRequest(created.id);
  expect(detail.ubicacion).toBe('Pabellón B, aula 204');
});

test('changeStatus a ASIGNADO devuelve 400 USAR_ASIGNACION', async () => {
  signInAs(SUPERVISOR_TI);
  await expect(api.changeStatus('1', { estado: 'ASIGNADO' }))
    .rejects.toMatchObject({ status: 400, codigo: 'USAR_ASIGNACION' });
});

test('getRequest fuera de alcance devuelve 404', async () => {
  signInAs(SUPERVISOR_MANT);
  await expect(api.getRequest('1')).rejects.toMatchObject({ status: 404 });
  signInAs('pedro.demo@universidad.example');
  await expect(api.getRequest('1')).rejects.toMatchObject({ status: 404 });
});

test('uploadAttachment envía multipart con el campo archivo', async () => {
  signInAs(ANA);
  let field;
  server.events.on('request:start', async ({ request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/attachments')) {
      field = (await request.clone().formData()).get('archivo');
    }
  });
  const created = await api.uploadAttachment('1', pngFile('aula.png'));
  expect(field.name).toBe('aula.png');
  expect(created).toMatchObject({ nombre: 'aula.png', tipoMime: 'image/png', puedeEliminar: true });
  const list = await api.listAttachments('1');
  expect(list.map((a) => a.nombre)).toContain('aula.png');
});
