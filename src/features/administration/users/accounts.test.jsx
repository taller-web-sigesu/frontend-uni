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
const bodyRows = (table) => within(table).getAllByRole('row').slice(1);

async function openPending(user) {
  renderPage();
  await user.click(await screen.findByRole('tab', { name: 'Pendientes de aprobación' }));
  return screen.findByRole('table', { name: 'Cuentas pendientes de aprobación' });
}

test('lista pendientes de la más antigua a la más reciente', async () => {
  const user = userEvent.setup();
  const table = await openPending(user);
  await within(table).findByText('Lucía Pendiente');
  const names = bodyRows(table).map((row) => within(row).getAllByRole('cell')[0].textContent);
  expect(names).toEqual(['Lucía Pendiente', 'Mario Pendiente']);
  expect(within(table).getByText('lucia.pendiente@unmsm.edu.pe')).toBeInTheDocument();
  expect(within(table).getByText('10/11/2026 04:00')).toBeInTheDocument();
});

test('aprobar envía estadoCuenta ACTIVA y retira la fila', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/users/11/account-status');
  const user = userEvent.setup();
  await openPending(user);
  await user.click(within(await rowOf('Lucía Pendiente')).getByRole('button', { name: 'Aprobar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ estadoCuenta: 'ACTIVA' });
  expect(await screen.findByText('Cuenta de Lucía Pendiente aprobada')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('cell', { name: 'Lucía Pendiente' })).toBeNull());
  expect(screen.getByRole('cell', { name: 'Mario Pendiente' })).toBeInTheDocument();
});

test('rechazar exige motivo', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/users/13/account-status');
  const user = userEvent.setup();
  await openPending(user);
  await user.click(within(await rowOf('Mario Pendiente')).getByRole('button', { name: 'Rechazar' }));
  const dialog = await screen.findByRole('dialog', { name: 'Rechazar cuenta' });
  await user.click(within(dialog).getByRole('button', { name: 'Rechazar cuenta' }));
  expect(await within(dialog).findByText('Indica el motivo del rechazo.')).toBeInTheDocument();
  expect(calls).toHaveLength(0);
  expect(within(dialog).getByLabelText('Motivo')).toHaveAttribute('maxLength', '500');
  await user.type(within(dialog).getByLabelText('Motivo'), '  El correo no corresponde a un alumno.  ');
  await user.click(within(dialog).getByRole('button', { name: 'Rechazar cuenta' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ estadoCuenta: 'RECHAZADA', motivo: 'El correo no corresponde a un alumno.' });
  await waitFor(() => expect(screen.queryByRole('cell', { name: 'Mario Pendiente' })).toBeNull());
});

test('409 CUENTA_NO_PENDIENTE recarga y avisa', async () => {
  const user = userEvent.setup();
  await openPending(user);
  const row = await rowOf('Lucía Pendiente');
  // Otro administrador la aprobó mientras tanto.
  db.users.find((u) => u.id === '11').estadoCuenta = 'ACTIVA';
  await user.click(within(row).getByRole('button', { name: 'Aprobar' }));
  expect(await screen.findByText('Esta cuenta ya fue revisada')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('cell', { name: 'Lucía Pendiente' })).toBeNull());
});

async function resetFor(user, name) {
  await user.click(within(await rowOf(name)).getByRole('button', { name: 'Restablecer contraseña' }));
  return screen.findByRole('dialog', { name: 'Restablecer contraseña' });
}

test('muestra la contraseña temporal una sola vez', async () => {
  const calls = captureRequests('POST', '/api/v1/admin/users/9/password-reset');
  const user = userEvent.setup();
  renderPage();
  const dialog = await resetFor(user, 'Pedro Demo');
  expect(within(dialog).getByText('¿Restablecer la contraseña de Pedro Demo? Se cerrarán sus sesiones activas.')).toBeInTheDocument();
  expect(calls).toHaveLength(0);
  await user.click(within(dialog).getByRole('button', { name: 'Restablecer' }));
  const field = await within(dialog).findByLabelText('Contraseña temporal');
  expect(calls).toHaveLength(1);
  const temporal = db.users.find((u) => u.id === '9').contrasena;
  expect(field).toHaveValue(temporal);
  expect(field).toHaveAttribute('readOnly');
  expect(within(dialog).getByText('Esta contraseña no se volverá a mostrar')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: 'Copiar' }));
  expect(await navigator.clipboard.readText()).toBe(temporal);
  expect(within(dialog).getByText('Copiada')).toBeInTheDocument();
});

test('no conserva la contraseña al cerrar', async () => {
  const user = userEvent.setup();
  renderPage();
  let dialog = await resetFor(user, 'Pedro Demo');
  await user.click(within(dialog).getByRole('button', { name: 'Restablecer' }));
  await within(dialog).findByLabelText('Contraseña temporal');
  const temporal = db.users.find((u) => u.id === '9').contrasena;
  await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.queryByDisplayValue(temporal)).toBeNull();

  dialog = await resetFor(user, 'Pedro Demo');
  expect(within(dialog).queryByLabelText('Contraseña temporal')).toBeNull();
  expect(screen.queryByDisplayValue(temporal)).toBeNull();
  expect(within(dialog).getByRole('button', { name: 'Restablecer' })).toBeInTheDocument();
});

test('no ofrece restablecer sobre la propia cuenta ni sobre inactivas', async () => {
  renderPage();
  expect(within(await rowOf('Pedro Demo')).getByRole('button', { name: 'Restablecer contraseña' })).toBeInTheDocument();
  for (const name of ['Admin Demo', 'Iris Inactiva', 'Lucía Pendiente', 'Rosa Rechazada']) {
    expect(within(await rowOf(name)).queryByRole('button', { name: 'Restablecer contraseña' })).toBeNull();
  }
});
