import { server } from '../../mocks/server.js';
import { signInAs } from '../../test/session.js';
import { captureRequests } from '../../test/users.js';
import * as catalogsAdminApi from './catalogsAdminApi.js';
import { createPolicy } from './slaApi.js';
import { createUser, decideAccount, resetPassword } from './usersApi.js';

const ADMIN = 'admin.demo@universidad.example';

beforeEach(() => signInAs(ADMIN));
afterEach(() => server.events.removeAllListeners());

test('createUser técnico sin área devuelve error en areaId', async () => {
  const error = await createUser({
    nombreCompleto: 'Luis Demo', correo: 'luis@universidad.example', contrasenaInicial: 'Clave2026', rol: 'TECNICO',
  }).catch((e) => e);
  expect(error).toMatchObject({ status: 400, fieldErrors: { areaId: expect.any(String) } });
});

test('resetPassword sobre la propia cuenta devuelve 403', async () => {
  await expect(resetPassword('1')).rejects.toMatchObject({ status: 403 });
});

test('decideAccount RECHAZADA sin motivo devuelve 400', async () => {
  await expect(decideAccount('11', { estadoCuenta: 'RECHAZADA' })).rejects.toMatchObject({ status: 400 });
});

test('catalogsAdminApi usa la ruta del tipo', async () => {
  const calls = captureRequests('GET', '/api/v1/admin/catalogs/priorities');
  const page = await catalogsAdminApi.list('priorities', { page: 0 });
  expect(calls).toHaveLength(1);
  expect(page.items.map((p) => p.codigo)).toContain('MEDIA');
});

test('createPolicy superpuesta devuelve 409', async () => {
  // La semilla ya tiene una política vigente y sin fin para la categoría 3.
  await expect(createPolicy({ categoriaId: '3', horasObjetivo: 12, horasAviso: 2 })).rejects.toMatchObject({ status: 409 });
});
