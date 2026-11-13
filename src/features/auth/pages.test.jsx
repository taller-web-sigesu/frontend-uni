import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../mocks/server.js';
import { db, DEMO_PASSWORD } from '../../mocks/db.js';
import { renderWithRouter } from '../../test/render.jsx';

const userById = (id) => {
  const { nombreCompleto, rol, areaId } = db.users.find((u) => u.id === id);
  return { id, nombreCompleto, rol, areaId };
};

function capture(method, path) {
  const bodies = [];
  server.events.on('request:start', async ({ request }) => {
    if (request.method === method && new URL(request.url).pathname === path) {
      bodies.push(await request.clone().json().catch(() => null));
    }
  });
  return bodies;
}

async function openLogin() {
  const view = renderWithRouter(null, { route: '/login', session: 'restore' });
  await screen.findByRole('heading', { name: 'Iniciar sesión' });
  return view;
}

async function submitLogin(user, correo, contrasena) {
  if (correo) await user.type(screen.getByLabelText('Correo institucional'), correo);
  if (contrasena) await user.type(screen.getByLabelText('Contraseña'), contrasena);
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
}

async function fillPasswordForm(user, { actual, nueva, confirmacion = nueva }) {
  await user.type(screen.getByLabelText('Contraseña actual'), actual);
  await user.type(screen.getByLabelText('Nueva contraseña'), nueva);
  await user.type(screen.getByLabelText('Confirmar nueva contraseña'), confirmacion);
}

async function fillRegister(user, { nombre = 'Lucía Demo', correo, contrasena = 'clave2026', confirmacion = contrasena }) {
  await user.type(screen.getByLabelText('Nombre completo'), nombre);
  await user.type(screen.getByLabelText('Correo institucional'), correo);
  await user.type(screen.getByLabelText('Contraseña'), contrasena);
  await user.type(screen.getByLabelText('Confirmar contraseña'), confirmacion);
}

afterEach(() => server.events.removeAllListeners());

test('login con campos vacíos no envía la petición', async () => {
  const user = userEvent.setup();
  const logins = capture('POST', '/api/v1/auth/login');
  await openLogin();
  await submitLogin(user);
  expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument();
  expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument();
  expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('aria-invalid', 'true');
  expect(logins).toHaveLength(0);
});

test('login inválido muestra el mensaje genérico', async () => {
  const user = userEvent.setup();
  await openLogin();
  await submitLogin(user, 'ana.demo@universidad.example', 'otra2026');
  expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
});

test('login 429 muestra el límite de intentos', async () => {
  const user = userEvent.setup();
  db.loginFailures['ana.demo@universidad.example'] = 5;
  await openLogin();
  await submitLogin(user, 'ana.demo@universidad.example', DEMO_PASSWORD);
  expect(await screen.findByRole('alert'))
    .toHaveTextContent('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
});

test('login de cuenta pendiente informa el estado', async () => {
  const user = userEvent.setup();
  await openLogin();
  await submitLogin(user, 'lucia.pendiente@unmsm.edu.pe', DEMO_PASSWORD);
  expect(await screen.findByRole('alert'))
    .toHaveTextContent('Tu cuenta está pendiente de aprobación por un administrador.');
});

test('supervisor entra a /indicadores y estudiante a /inicio', async () => {
  const user = userEvent.setup();
  const supervisor = await openLogin();
  await submitLogin(user, 'supervisor.ti.demo@universidad.example', DEMO_PASSWORD);
  await waitFor(() => expect(supervisor.router.state.location.pathname).toBe('/indicadores'));
  supervisor.unmount();

  db.refreshCookie = null;
  const student = await openLogin();
  await submitLogin(user, 'ana.demo@universidad.example', DEMO_PASSWORD);
  await waitFor(() => expect(student.router.state.location.pathname).toBe('/inicio'));
});

test('primer ingreso lleva a /cambiar-contrasena y luego al inicio', async () => {
  const user = userEvent.setup();
  const { router } = await openLogin();
  await submitLogin(user, 'nuevo.demo@universidad.example', DEMO_PASSWORD);
  await waitFor(() => expect(router.state.location.pathname).toBe('/cambiar-contrasena'));
  expect(await screen.findByRole('heading', { name: 'Cambia tu contraseña' })).toBeInTheDocument();
  await fillPasswordForm(user, { actual: DEMO_PASSWORD, nueva: 'nueva2026' });
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/inicio'));
});

test('registro rechaza correo fuera de @unmsm.edu.pe sin enviar', async () => {
  const user = userEvent.setup();
  const registers = capture('POST', '/api/v1/auth/register');
  renderWithRouter(null, { route: '/registro', session: 'restore' });
  await screen.findByRole('heading', { name: 'Crear cuenta' });
  await fillRegister(user, { correo: 'lucia@gmail.com' });
  await user.click(screen.getByRole('button', { name: 'Registrarme' }));
  expect(screen.getByText('Usa tu correo institucional @unmsm.edu.pe.')).toBeInTheDocument();
  expect(registers).toHaveLength(0);
});

test('registro correcto muestra el mensaje de HU-27 y no inicia sesión', async () => {
  const user = userEvent.setup();
  const { router } = renderWithRouter(null, { route: '/registro', session: 'restore' });
  await screen.findByRole('heading', { name: 'Crear cuenta' });
  await fillRegister(user, { correo: 'lucia.demo@unmsm.edu.pe' });
  await user.click(screen.getByRole('button', { name: 'Registrarme' }));
  expect(await screen.findByText('Registro enviado. Podrás ingresar cuando un administrador apruebe tu cuenta'))
    .toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver al inicio de sesión' })).toHaveAttribute('href', '/login');
  expect(router.state.location.pathname).toBe('/registro');
  expect(db.sessions).toHaveLength(0);
  expect(db.users.find((u) => u.correo === 'lucia.demo@unmsm.edu.pe').estadoCuenta).toBe('PENDIENTE');
});

test('registro con correo existente muestra el error sin revelar datos', async () => {
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/registro', session: 'restore' });
  await screen.findByRole('heading', { name: 'Crear cuenta' });
  await fillRegister(user, { correo: 'lucia.pendiente@unmsm.edu.pe' });
  await user.click(screen.getByRole('button', { name: 'Registrarme' }));
  expect(await screen.findByText('Este correo ya está registrado.')).toBeInTheDocument();
  expect(screen.queryByText(/Lucía Pendiente/)).not.toBeInTheDocument();
});

test('registro no envía rol aunque se manipule el formulario', async () => {
  const user = userEvent.setup();
  const registers = capture('POST', '/api/v1/auth/register');
  renderWithRouter(null, { route: '/registro', session: 'restore' });
  await screen.findByRole('heading', { name: 'Crear cuenta' });
  const form = screen.getByRole('button', { name: 'Registrarme' }).closest('form');
  form.insertAdjacentHTML('beforeend', '<input name="rol" value="ADMINISTRADOR" />');
  await fillRegister(user, { correo: 'mario.demo@unmsm.edu.pe' });
  await user.click(screen.getByRole('button', { name: 'Registrarme' }));
  await screen.findByText(/Registro enviado/);
  expect(registers).toHaveLength(1);
  expect(Object.keys(registers[0]).sort())
    .toEqual(['confirmacionContrasena', 'contrasena', 'correo', 'nombreCompleto']);
});

test('cambio de contraseña con confirmación distinta no envía', async () => {
  const user = userEvent.setup();
  const changes = capture('PATCH', '/api/v1/auth/password');
  renderWithRouter(null, { route: '/perfil', session: { user: userById('8') } });
  await screen.findByRole('heading', { name: 'Perfil y contraseña' });
  await fillPasswordForm(user, { actual: DEMO_PASSWORD, nueva: 'nueva2026', confirmacion: 'otra2026' });
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
  expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
  expect(changes).toHaveLength(0);
});

test('cambio con contraseña actual errónea marca ese campo', async () => {
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/perfil', session: { user: userById('8') } });
  await screen.findByRole('heading', { name: 'Perfil y contraseña' });
  await fillPasswordForm(user, { actual: 'errada2026', nueva: 'nueva2026' });
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
  await waitFor(() => expect(screen.getByLabelText('Contraseña actual')).toHaveAttribute('aria-invalid', 'true'));
  expect(screen.getByText('La contraseña actual no es correcta.')).toBeInTheDocument();
});

test('perfil cambia la contraseña y muestra el aviso', async () => {
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/perfil', session: { user: userById('5') } });
  await screen.findByRole('heading', { name: 'Perfil y contraseña' });
  const datos = screen.getByRole('region', { name: 'Datos de la cuenta' });
  expect(within(datos).getByText('Técnico TI Demo')).toBeInTheDocument();
  expect(within(datos).getByText('Técnico')).toBeInTheDocument();
  expect(within(datos).getByText('Tecnologías de la Información')).toBeInTheDocument();
  await fillPasswordForm(user, { actual: DEMO_PASSWORD, nueva: 'nueva2026' });
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
  expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument();
  expect(screen.getByLabelText('Contraseña actual')).toHaveValue('');
  expect(db.users.find((u) => u.id === '5').contrasena).toBe('nueva2026');
});
