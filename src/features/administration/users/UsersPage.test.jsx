import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../mocks/server.js';
import { db } from '../../../mocks/db.js';
import { renderWithRouter } from '../../../test/render.jsx';
import { captureRequests, userById } from '../../../test/users.js';

const ADMIN = '1';

afterEach(() => server.events.removeAllListeners());

function renderPage() {
  return renderWithRouter(null, { route: '/admin/usuarios', session: { user: userById(ADMIN) } });
}

const rowOf = async (name) => (await screen.findByRole('cell', { name })).closest('tr');

async function openCreate(user) {
  await user.click(await screen.findByRole('button', { name: 'Crear usuario' }));
  return screen.findByRole('dialog', { name: 'Crear usuario' });
}

async function fillBasics(user, dialog, { nombre = 'Laura Docente', correo = 'laura@universidad.example' } = {}) {
  await user.type(within(dialog).getByLabelText('Nombre completo'), nombre);
  await user.type(within(dialog).getByLabelText('Correo'), correo);
  await user.type(within(dialog).getByLabelText('Contraseña inicial'), 'Inicio2026');
}

test('lista usuarios con rol y estado legibles', async () => {
  renderPage();
  expect(await screen.findByRole('heading', { name: 'Administración de usuarios' })).toBeInTheDocument();
  const tech = within(await rowOf('Técnico TI Demo'));
  expect(tech.getByText('Técnico')).toBeInTheDocument();
  expect(tech.getByText('Tecnologías de la Información')).toBeInTheDocument();
  expect(tech.getByText('Activo')).toBeInTheDocument();
  expect(within(await rowOf('Iris Inactiva')).getByText('Inactivo')).toBeInTheDocument();
  expect(within(await rowOf('Ana Demo')).getByText('—')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Pendientes de aprobación' })).toBeInTheDocument();
});

test('crea un docente sin área', async () => {
  const calls = captureRequests('POST', '/api/v1/admin/users');
  const user = userEvent.setup();
  renderPage();
  const dialog = await openCreate(user);
  await fillBasics(user, dialog);
  await user.selectOptions(within(dialog).getByLabelText('Rol'), 'Docente');
  expect(within(dialog).queryByLabelText('Área')).toBeNull();
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({
    nombreCompleto: 'Laura Docente',
    correo: 'laura@universidad.example',
    contrasenaInicial: 'Inicio2026',
    rol: 'DOCENTE',
  });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findByRole('cell', { name: 'Laura Docente' })).toBeInTheDocument();
});

test('exige área para técnico', async () => {
  const calls = captureRequests('POST', '/api/v1/admin/users');
  const user = userEvent.setup();
  renderPage();
  const dialog = await openCreate(user);
  await fillBasics(user, dialog);
  await user.selectOptions(within(dialog).getByLabelText('Rol'), 'Técnico');
  expect(within(dialog).getByLabelText('Área')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }));
  expect(await within(dialog).findByText('Elige un área.')).toBeInTheDocument();
  expect(calls).toHaveLength(0);

  await user.selectOptions(within(dialog).getByLabelText('Área'), 'Mantenimiento');
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toMatchObject({ rol: 'TECNICO', areaId: '2' });
});

test('limpia el área al cambiar a un rol sin área', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/users/5');
  const user = userEvent.setup();
  renderPage();
  await user.click(within(await rowOf('Técnico TI Demo')).getByRole('button', { name: 'Editar' }));
  const dialog = await screen.findByRole('dialog', { name: 'Editar usuario' });
  expect(within(dialog).queryByLabelText('Contraseña inicial')).toBeNull();
  expect(within(dialog).getByLabelText('Área')).toHaveValue('1');
  await user.selectOptions(within(dialog).getByLabelText('Rol'), 'Estudiante');
  expect(within(dialog).queryByLabelText('Área')).toBeNull();
  await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ rol: 'ESTUDIANTE', areaId: null });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(within(await rowOf('Técnico TI Demo')).getByText('Estudiante')).toBeInTheDocument();
});

test('muestra el 409 de correo duplicado en el campo correo', async () => {
  const user = userEvent.setup();
  renderPage();
  const dialog = await openCreate(user);
  await fillBasics(user, dialog, { correo: 'ana.demo@universidad.example' });
  await user.selectOptions(within(dialog).getByLabelText('Rol'), 'Estudiante');
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }));
  const correo = within(dialog).getByLabelText('Correo');
  await waitFor(() => expect(correo).toHaveAttribute('aria-invalid', 'true'));
  expect(within(dialog).getByText('Ya existe una cuenta con ese correo.')).toBeInTheDocument();
  expect(correo).toHaveValue('ana.demo@universidad.example');
  expect(within(dialog).getByLabelText('Nombre completo')).toHaveValue('Laura Docente');
});

test('desactivar pide confirmación y envía activo false', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/users/9');
  const user = userEvent.setup();
  renderPage();
  await user.click(within(await rowOf('Pedro Demo')).getByRole('button', { name: 'Desactivar' }));
  const confirm = await screen.findByRole('dialog', { name: 'Desactivar usuario' });
  expect(calls).toHaveLength(0);
  await user.click(within(confirm).getByRole('button', { name: 'Desactivar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ activo: false });
  expect(await within(await rowOf('Pedro Demo')).findByText('Inactivo')).toBeInTheDocument();
  expect(db.users.find((u) => u.id === '9').activo).toBe(false);
  // La propia cuenta no se puede desactivar desde aquí.
  expect(within(await rowOf('Admin Demo')).queryByRole('button', { name: 'Desactivar' })).toBeNull();
});

test('borrar el teléfono envía cadena vacía', async () => {
  // En el backend, null conserva el valor y '' lo borra (Patch.optionalText).
  db.users.find((u) => u.id === '9').telefono = '999888777';
  const calls = captureRequests('PATCH', '/api/v1/admin/users/9');
  const user = userEvent.setup();
  renderPage();
  await user.click(within(await rowOf('Pedro Demo')).getByRole('button', { name: 'Editar' }));
  const dialog = await screen.findByRole('dialog', { name: 'Editar usuario' });
  await user.clear(within(dialog).getByLabelText('Teléfono (opcional)'));
  await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ telefono: '' });
  await waitFor(() => expect(db.users.find((u) => u.id === '9').telefono).toBeNull());
});
