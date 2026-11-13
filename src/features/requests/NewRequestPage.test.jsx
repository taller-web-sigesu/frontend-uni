import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../mocks/server.js';
import { db } from '../../mocks/db.js';
import { renderWithRouter } from '../../test/render.jsx';
import { ANA, captureRequests, userById } from '../../test/users.js';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const png = (name) => new File([new Uint8Array([...PNG, 1, 2])], name, { type: 'image/png' });

afterEach(() => server.events.removeAllListeners());

async function openForm(options) {
  const user = userEvent.setup(options);
  const view = renderWithRouter(null, { route: '/solicitudes/nueva', session: { user: userById(ANA) } });
  await screen.findByRole('heading', { name: 'Registrar solicitud' });
  await screen.findByRole('option', { name: 'Conectividad' });
  return { user, ...view };
}

async function fill(user, { categoria = 'Conectividad', ubicacion = 'Pabellón B, aula 204', descripcion = 'Sin Wi-Fi.' } = {}) {
  if (categoria) await user.selectOptions(screen.getByLabelText('Categoría'), categoria);
  if (ubicacion) await user.type(screen.getByLabelText('Ubicación'), ubicacion);
  if (descripcion) await user.type(screen.getByLabelText('Descripción'), descripcion);
}

const submitButton = () => screen.getByRole('button', { name: 'Registrar solicitud' });

test('no envía con campos vacíos o solo espacios', async () => {
  const posts = captureRequests('POST', '/api/v1/requests');
  const { user } = await openForm();
  await fill(user, { categoria: null, ubicacion: '   ', descripcion: '  ' });
  await user.click(submitButton());
  expect(await screen.findByText('Elige una categoría.')).toBeInTheDocument();
  expect(screen.getByText('Indica la ubicación.')).toBeInTheDocument();
  expect(screen.getByText('Describe el problema.')).toBeInTheDocument();
  expect(posts).toHaveLength(0);
});

test('registra y abre el detalle con el código', async () => {
  const { user, router } = await openForm();
  await fill(user);
  await user.click(submitButton());
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/solicitudes\/\d+$/));
  const created = db.requests.at(-1);
  expect(router.state.location.pathname).toBe(`/solicitudes/${created.id}`);
  expect(router.state.location.state).toEqual({ creada: created.codigo, fallidas: [] });
  expect(created).toMatchObject({ categoriaId: '3', ubicacion: 'Pabellón B, aula 204', descripcion: 'Sin Wi-Fi.' });
});

test('sube cada evidencia tras crear la solicitud', async () => {
  const order = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST') order.push(new URL(request.url).pathname);
  });
  const { user, router } = await openForm();
  await fill(user);
  await user.upload(screen.getByLabelText('Evidencias (opcional)'), [png('a.png'), png('b.png')]);
  expect(screen.getByText('a.png')).toBeInTheDocument();
  await user.click(submitButton());
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/solicitudes\/\d+$/));
  const created = db.requests.at(-1);
  expect(order).toEqual([
    '/api/v1/requests',
    `/api/v1/requests/${created.id}/attachments`,
    `/api/v1/requests/${created.id}/attachments`,
  ]);
  expect(created.attachments.map((a) => a.nombre)).toEqual(['a.png', 'b.png']);
});

test('informa archivos fallidos tras crear la solicitud', async () => {
  const posts = captureRequests('POST', '/api/v1/requests');
  const { user, router } = await openForm();
  await fill(user);
  // Extensión válida pero contenido que no es imagen: lo rechaza el servidor.
  const fake = new File(['no soy una imagen'], 'falsa.png', { type: 'image/png' });
  await user.upload(screen.getByLabelText('Evidencias (opcional)'), [png('buena.png'), fake]);
  await user.click(submitButton());
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/solicitudes\/\d+$/));
  expect(router.state.location.state.fallidas).toEqual([
    { nombre: 'falsa.png', motivo: 'Solo se aceptan archivos JPG, PNG o PDF.' },
  ]);
  expect(posts).toHaveLength(1);
  expect(db.requests.at(-1).attachments.map((a) => a.nombre)).toEqual(['buena.png']);
});

test('un archivo .exe se rechaza antes de enviar', async () => {
  const uploads = captureRequests('POST', /\/attachments$/);
  const { user, router } = await openForm({ applyAccept: false });
  await fill(user);
  await user.upload(
    screen.getByLabelText('Evidencias (opcional)'),
    [new File(['MZ'], 'programa.exe', { type: 'application/x-msdownload' })],
  );
  expect(screen.getByText('programa.exe')).toBeInTheDocument();
  expect(screen.getByText('Solo se aceptan archivos JPG, PNG o PDF.')).toBeInTheDocument();
  await user.click(submitButton());
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/solicitudes\/\d+$/));
  expect(uploads).toHaveLength(0);
});

test('doble clic en Registrar crea una sola solicitud', async () => {
  const posts = captureRequests('POST', '/api/v1/requests');
  const { user, router } = await openForm();
  await fill(user);
  await user.dblClick(submitButton());
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/solicitudes\/\d+$/));
  expect(posts).toHaveLength(1);
});
