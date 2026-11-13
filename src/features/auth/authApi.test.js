import { http } from 'msw';
import { server } from '../../mocks/server.js';
import { configureHttp, request } from '../../services/http.js';
import { DEMO_PASSWORD } from '../../mocks/db.js';
import { changePassword, login, register } from './authApi.js';

afterEach(() => configureHttp({}));

test('login válido devuelve tokenAcceso y usuario', async () => {
  const session = await login({ correo: 'ana.demo@universidad.example', contrasena: DEMO_PASSWORD });
  expect(session.tokenAcceso).toEqual(expect.any(String));
  expect(session.expiraEnSegundos).toBe(900);
  expect(session.usuario.rol).toBe('ESTUDIANTE');
  expect(typeof session.usuario.id).toBe('string');
  expect(session.debeCambiarContrasena).toBe(false);
});

test('login inválido lanza ApiError 401', async () => {
  await expect(login({ correo: 'ana.demo@universidad.example', contrasena: 'otra2026' }))
    .rejects.toMatchObject({ status: 401 });
});

test('login de cuenta pendiente lanza 403 CUENTA_PENDIENTE', async () => {
  await expect(login({ correo: 'lucia.pendiente@unmsm.edu.pe', contrasena: DEMO_PASSWORD }))
    .rejects.toMatchObject({ status: 403, codigo: 'CUENTA_PENDIENTE' });
});

test('changePassword con actual errónea marca contrasenaActual', async () => {
  const session = await login({ correo: 'nuevo.demo@universidad.example', contrasena: DEMO_PASSWORD });
  configureHttp({ getAccessToken: () => session.tokenAcceso });
  const error = await changePassword({ contrasenaActual: 'errada2026', contrasenaNueva: 'nueva2026' })
    .catch((e) => e);
  expect(error.status).toBe(400);
  expect(error.codigo).toBe('VALIDACION');
  expect(error.fieldErrors.contrasenaActual).toBeDefined();
});

test('register con dominio distinto devuelve error en correo', async () => {
  const error = await register({
    nombreCompleto: 'Lucía Demo',
    correo: 'lucia@gmail.com',
    contrasena: 'clave2026',
    confirmacionContrasena: 'clave2026',
  }).catch((e) => e);
  expect(error.status).toBe(400);
  expect(error.fieldErrors.correo).toBeDefined();
});

test('register con correo existente devuelve 409 CORREO_REGISTRADO', async () => {
  await expect(register({
    nombreCompleto: 'Lucía Otra',
    correo: ' LUCIA.PENDIENTE@unmsm.edu.pe ',
    contrasena: 'clave2026',
    confirmacionContrasena: 'clave2026',
  })).rejects.toMatchObject({ status: 409, codigo: 'CORREO_REGISTRADO' });
});

test('login no envía Authorization', async () => {
  let authorization = 'sin leer';
  server.use(http.post('/api/v1/auth/login', ({ request: req }) => {
    authorization = req.headers.get('Authorization');
  }));
  configureHttp({ getAccessToken: () => 'token-previo' });
  await login({ correo: 'ana.demo@universidad.example', contrasena: DEMO_PASSWORD });
  expect(authorization).toBeNull();
});

test('requireUser protege categorías', async () => {
  await expect(request('/catalogs/categories')).rejects.toMatchObject({ status: 401 });
  const session = await login({ correo: 'nuevo.demo@universidad.example', contrasena: DEMO_PASSWORD });
  configureHttp({ getAccessToken: () => session.tokenAcceso });
  await expect(request('/catalogs/categories'))
    .rejects.toMatchObject({ status: 403, codigo: 'CAMBIO_CONTRASENA_REQUERIDO' });
});
