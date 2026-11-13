import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../mocks/server.js';
import { db } from '../../../mocks/db.js';
import { renderWithRouter } from '../../../test/render.jsx';
import { captureRequests, userById } from '../../../test/users.js';

const ADMIN = '1';

afterEach(() => server.events.removeAllListeners());

async function renderTab(user, tab) {
  renderWithRouter(null, { route: '/admin/catalogos', session: { user: userById(ADMIN) } });
  expect(await screen.findByRole('heading', { name: 'Catálogos' })).toBeInTheDocument();
  if (tab) await user.click(screen.getByRole('tab', { name: tab }));
}

const rowOf = async (name) => (await screen.findByRole('cell', { name })).closest('tr');

test('lista áreas activas e inactivas con su badge', async () => {
  await renderTab(userEvent.setup());
  expect(within(await rowOf('Servicios Generales')).getByText('Inactivo')).toBeInTheDocument();
  expect(within(await rowOf('Tecnologías de la Información')).getByText('Activo')).toBeInTheDocument();
  expect(within(await rowOf('Tecnologías de la Información')).getByText('TI')).toBeInTheDocument();
});

test('crea una categoría con área y prioridad activas', async () => {
  const calls = captureRequests('POST', '/api/v1/admin/catalogs/categories');
  const user = userEvent.setup();
  await renderTab(user, 'Categorías');
  expect(within(await rowOf('Conectividad')).getByText('Tecnologías de la Información')).toBeInTheDocument();
  expect(within(await rowOf('Mobiliario antiguo')).getByText('Inactivo')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Crear categoría' }));
  const dialog = await screen.findByRole('dialog', { name: 'Crear categoría' });
  const area = within(dialog).getByLabelText('Área');
  expect(within(area).queryByRole('option', { name: 'Servicios Generales' })).toBeNull();
  await user.type(within(dialog).getByLabelText('Código'), 'AULA');
  await user.type(within(dialog).getByLabelText('Nombre'), 'Aulas');
  await user.selectOptions(area, 'Mantenimiento');
  await user.selectOptions(within(dialog).getByLabelText('Prioridad predeterminada'), 'Alta');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ codigo: 'AULA', nombre: 'Aulas', areaId: '2', prioridadPredeterminadaId: '5' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findByRole('cell', { name: 'Aulas' })).toBeInTheDocument();
});

test('el código no es editable después del alta', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/catalogs/priorities/4');
  const user = userEvent.setup();
  await renderTab(user, 'Prioridades');
  await user.click(within(await rowOf('Media')).getByRole('button', { name: 'Editar' }));
  const dialog = await screen.findByRole('dialog', { name: 'Editar prioridad' });
  expect(within(dialog).getByLabelText('Código')).toHaveAttribute('readOnly');
  expect(within(dialog).getByLabelText('Código')).toHaveValue('MEDIA');
  const nombre = within(dialog).getByLabelText('Nombre');
  await user.clear(nombre);
  await user.type(nombre, 'Normal');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ nombre: 'Normal' });
  expect(await screen.findByRole('cell', { name: 'Normal' })).toBeInTheDocument();
});

test('desactivar pide confirmación y envía activo false', async () => {
  // Alta no es prioridad predeterminada de ninguna categoría activa: no tiene dependencias.
  const calls = captureRequests('PATCH', '/api/v1/admin/catalogs/priorities/5');
  const user = userEvent.setup();
  await renderTab(user, 'Prioridades');
  await user.click(within(await rowOf('Alta')).getByRole('button', { name: 'Desactivar' }));
  const confirm = await screen.findByRole('dialog', { name: 'Desactivar prioridad' });
  expect(calls).toHaveLength(0);
  await user.click(within(confirm).getByRole('button', { name: 'Desactivar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ activo: false });
  expect(await within(await rowOf('Alta')).findByText('Inactivo')).toBeInTheDocument();
  expect(within(await rowOf('Alta')).getByRole('button', { name: 'Activar' })).toBeInTheDocument();
});

test('desactivar con dependencias activas muestra el 409 en la confirmación', async () => {
  const user = userEvent.setup();
  await renderTab(user);
  await user.click(within(await rowOf('Biblioteca')).getByRole('button', { name: 'Desactivar' }));
  const confirm = await screen.findByRole('dialog', { name: 'Desactivar área' });
  await user.click(within(confirm).getByRole('button', { name: 'Desactivar' }));
  expect(await within(confirm).findByRole('alert')).toHaveTextContent('El área tiene categorías o personal activos.');
  expect(within(await rowOf('Biblioteca')).getByText('Activo')).toBeInTheDocument();
});

test('borrar el color de una prioridad envía cadena vacía', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/catalogs/priorities/4');
  db.priorities.find((p) => p.id === '4').color = '#F59E0B';
  const user = userEvent.setup();
  await renderTab(user, 'Prioridades');
  await user.click(within(await rowOf('Media')).getByRole('button', { name: 'Editar' }));
  const dialog = await screen.findByRole('dialog', { name: 'Editar prioridad' });
  await user.clear(within(dialog).getByLabelText('Color (opcional)'));
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ color: '' });
  await waitFor(() => expect(db.priorities.find((p) => p.id === '4').color).toBeNull());
});

test('409 por duplicado se muestra en el formulario', async () => {
  const user = userEvent.setup();
  await renderTab(user);
  await user.click(await screen.findByRole('button', { name: 'Crear área' }));
  const dialog = await screen.findByRole('dialog', { name: 'Crear área' });
  await user.type(within(dialog).getByLabelText('Código'), 'TI');
  await user.type(within(dialog).getByLabelText('Nombre'), 'Otra TI');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Ya existe un registro con ese código o nombre.');
  expect(within(dialog).getByLabelText('Nombre')).toHaveValue('Otra TI');
});

test('en estados solo se edita el nombre', async () => {
  const calls = captureRequests('PATCH', '/api/v1/admin/catalogs/request-statuses/1');
  const user = userEvent.setup();
  await renderTab(user, 'Estados');
  const row = await rowOf('NUEVO');
  expect(within(row).getByText('No')).toBeInTheDocument();
  expect(within(await rowOf('CERRADO')).getByText('Sí')).toBeInTheDocument();
  await user.click(within(row).getByRole('button', { name: 'Editar nombre' }));
  const dialog = await screen.findByRole('dialog', { name: 'Editar nombre' });
  expect(within(dialog).getAllByRole('textbox')).toHaveLength(1);
  const nombre = within(dialog).getByLabelText('Nombre');
  await user.clear(nombre);
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  expect(await within(dialog).findByText('Indica el nombre.')).toBeInTheDocument();
  await user.type(nombre, 'Registrado');
  await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].body).toEqual({ nombre: 'Registrado' });
  expect(await screen.findByRole('cell', { name: 'Registrado' })).toBeInTheDocument();
});
