import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { renderWithRouter } from '../../test/render.jsx';
import { ANA, captureRequests, SUPERVISORA_TI, userById } from '../../test/users.js';
import { db } from '../../mocks/db.js';

afterEach(() => server.events.removeAllListeners());

function openDetail(id, userId = ANA, state) {
  const route = state ? { pathname: `/solicitudes/${id}`, state } : `/solicitudes/${id}`;
  return renderWithRouter(null, { route, session: { user: userById(userId) } });
}

test('muestra resumen, historial y comentarios', async () => {
  openDetail('3');
  expect(await screen.findByRole('heading', { name: 'Detalle y seguimiento de solicitud' })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'SOL-2026-000003' })).toBeInTheDocument();
  const summary = screen.getByRole('region', { name: 'Datos de la solicitud' });
  expect(within(summary).getByText('Conectividad')).toBeInTheDocument();
  expect(within(summary).getByText('Tecnologías de la Información')).toBeInTheDocument();
  expect(within(summary).getByText('Biblioteca central, sala 2')).toBeInTheDocument();
  expect(within(summary).getByText('Técnico TI Demo')).toBeInTheDocument();
  expect(within(summary).getByText('Ana Demo')).toBeInTheDocument();
  expect(within(summary).getByText('El Wi-Fi se desconecta cada pocos minutos.')).toBeInTheDocument();
  expect(screen.getAllByText('En proceso').length).toBeGreaterThan(0);

  const history = within(screen.getByRole('region', { name: 'Historial' })).getAllByRole('listitem');
  expect(history.map((item) => item.querySelector('.timeline__status').textContent))
    .toEqual(['Nuevo', 'Nuevo → Asignado', 'Asignado → En proceso']);
  expect(history[0]).toHaveTextContent('04/11/2026 09:00');

  const comments = screen.getByRole('region', { name: 'Comentarios' });
  expect(within(comments).getByText('Ya revisé el punto de acceso.')).toBeInTheDocument();
  expect(within(comments).getByText('Técnico TI Demo')).toBeInTheDocument();
});

test('404 muestra el estado no encontrada', async () => {
  openDetail('7');
  expect(await screen.findByText('No encontramos esta solicitud o no tienes acceso a ella')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver a mis solicitudes' })).toHaveAttribute('href', '/solicitudes');
});

test('responsable nulo muestra Sin asignar', async () => {
  openDetail('1');
  const summary = await screen.findByRole('region', { name: 'Datos de la solicitud' });
  expect(within(summary).getByText('Responsable')).toBeInTheDocument();
  expect(within(summary).getByText('Sin asignar')).toBeInTheDocument();
});

test('rechaza texto en blanco', async () => {
  const user = userEvent.setup();
  const posts = captureRequests('POST', '/api/v1/requests/3/comments');
  openDetail('3');
  await user.type(await screen.findByLabelText('Comentario'), '   ');
  await user.click(screen.getByRole('button', { name: 'Publicar comentario' }));
  expect(await screen.findByText('Escribe un comentario')).toBeInTheDocument();
  expect(posts).toHaveLength(0);
});

test('publica y muestra el comentario con autor', async () => {
  const user = userEvent.setup();
  openDetail('3');
  const field = await screen.findByLabelText('Comentario');
  await user.type(field, 'Sigue sin funcionar.');
  await user.click(screen.getByRole('button', { name: 'Publicar comentario' }));
  const comments = screen.getByRole('region', { name: 'Comentarios' });
  expect(await within(comments).findByText('Sigue sin funcionar.')).toBeInTheDocument();
  expect(within(comments).getByText('Ana Demo')).toBeInTheDocument();
  expect(field).toHaveValue('');
  expect(db.requests.find((r) => r.id === '3').comments).toHaveLength(2);
});

test('si falla la publicación conserva el texto', async () => {
  const user = userEvent.setup();
  server.use(http.post('/api/v1/requests/:id/comments', () => HttpResponse.error(), { once: true }));
  openDetail('3');
  const field = await screen.findByLabelText('Comentario');
  await user.type(field, 'Sigue sin funcionar.');
  await user.click(screen.getByRole('button', { name: 'Publicar comentario' }));
  expect(await screen.findByText('No hay conexión con el servidor.')).toBeInTheDocument();
  expect(field).toHaveValue('Sigue sin funcionar.');
});

test('muestra el aviso de solicitud registrada y los archivos fallidos', async () => {
  openDetail('1', ANA, {
    creada: 'SOL-2026-000001',
    fallidas: [{ nombre: 'falsa.png', motivo: 'Solo se aceptan archivos JPG, PNG o PDF.' }],
  });
  expect(await screen.findByText('Solicitud SOL-2026-000001 registrada')).toBeInTheDocument();
  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('No se adjuntaron estos archivos');
  expect(alert).toHaveTextContent('falsa.png: Solo se aceptan archivos JPG, PNG o PDF.');
});

test('el supervisor vuelve a gestión desde una solicitud fuera de su área', async () => {
  openDetail('6', SUPERVISORA_TI);
  expect(await screen.findByText('No encontramos esta solicitud o no tienes acceso a ella')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver a gestión de área' })).toHaveAttribute('href', '/gestion');
});
