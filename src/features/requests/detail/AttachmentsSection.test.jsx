import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../mocks/server.js';
import { db } from '../../../mocks/db.js';
import { renderWithRouter } from '../../../test/render.jsx';
import { ANA, captureRequests, SUPERVISORA_TI, userById } from '../../../test/users.js';
import { downloadBlob } from '../../../services/download.js';
import { AttachmentsSection } from './AttachmentsSection.jsx';

vi.mock('../../../services/download.js', () => ({ downloadBlob: vi.fn() }));

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const png = (name) => new File([new Uint8Array([...PNG, 9])], name, { type: 'image/png' });

afterEach(() => {
  server.events.removeAllListeners();
  vi.mocked(downloadBlob).mockReset();
});

function renderSection({ requestId = '2', canAttach = true, userId = ANA } = {}) {
  const user = userEvent.setup();
  renderWithRouter(<AttachmentsSection requestId={requestId} canAttach={canAttach} />, {
    session: { user: userById(userId) },
  });
  return user;
}

const rowFor = async (name) => (await screen.findByText(name)).closest('li');

test('lista evidencias con nombre, tamaño, autor y fecha', async () => {
  renderSection();
  expect(screen.getByRole('heading', { name: 'Evidencias' })).toBeInTheDocument();
  const row = await rowFor('pc-12.jpg');
  expect(row).toHaveTextContent('2 MB');
  expect(row).toHaveTextContent('Ana Demo');
  expect(row).toHaveTextContent('03/11/2026 09:05');
});

test('adjunta un archivo válido y recarga', async () => {
  const user = renderSection();
  await rowFor('pc-12.jpg');
  const lists = captureRequests('GET', '/api/v1/requests/2/attachments');
  await user.upload(screen.getByLabelText('Adjuntar evidencia'), png('nueva.png'));
  expect(await screen.findByText('nueva.png')).toBeInTheDocument();
  expect(lists.length).toBeGreaterThan(0);
  expect(db.requests.find((r) => r.id === '2').attachments.filter((a) => !a.eliminado)).toHaveLength(2);
});

test('muestra el mensaje del servidor cuando rechaza el contenido', async () => {
  const user = renderSection();
  await rowFor('pc-12.jpg');
  await user.upload(screen.getByLabelText('Adjuntar evidencia'), new File(['texto'], 'falsa.png', { type: 'image/png' }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('falsa.png: Solo se aceptan archivos JPG, PNG o PDF.');
});

test('con 5 evidencias deshabilita el selector', async () => {
  const solicitud = db.requests.find((r) => r.id === '2');
  for (let i = 0; i < 4; i += 1) {
    solicitud.attachments.push({ ...solicitud.attachments[0], id: String(50 + i), nombre: `extra-${i}.jpg` });
  }
  renderSection();
  await rowFor('extra-3.jpg');
  expect(screen.getByLabelText('Adjuntar evidencia')).toBeDisabled();
  expect(screen.getByText('Ya hay 5 evidencias. Elimina una para adjuntar otra.')).toBeInTheDocument();
});

test('solo el autor ve Eliminar y debe confirmar', async () => {
  const user = renderSection();
  const row = await rowFor('pc-12.jpg');
  await user.click(within(row).getByRole('button', { name: 'Eliminar' }));
  const dialog = screen.getByRole('dialog', { name: 'Eliminar evidencia' });
  expect(db.requests.find((r) => r.id === '2').attachments[0].eliminado).toBe(false);
  await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
  await waitFor(() => expect(screen.queryByText('pc-12.jpg')).not.toBeInTheDocument());
  expect(db.requests.find((r) => r.id === '2').attachments[0].eliminado).toBe(true);
});

test('el supervisor no ve Eliminar en evidencias ajenas', async () => {
  renderSection({ userId: SUPERVISORA_TI });
  const row = await rowFor('pc-12.jpg');
  expect(within(row).queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  expect(within(row).getByRole('button', { name: 'Descargar' })).toBeInTheDocument();
});

test('en solicitud cerrada no ofrece adjuntar pero permite descargar', async () => {
  const solicitud = db.requests.find((r) => r.id === '5');
  solicitud.attachments.push({ id: '60', nombre: 'acta.pdf', tamanoBytes: 2048, tipoMime: 'application/pdf', autorId: ANA, creadoEn: '2026-11-06T15:00:00Z', eliminado: false });
  renderSection({ requestId: '5', canAttach: false });
  const row = await rowFor('acta.pdf');
  expect(screen.queryByLabelText('Adjuntar evidencia')).not.toBeInTheDocument();
  expect(within(row).queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  expect(within(row).getByRole('button', { name: 'Descargar' })).toBeInTheDocument();
});

test('descargar usa downloadBlob con el nombre del servidor', async () => {
  const user = renderSection();
  const downloads = captureRequests('GET', '/api/v1/requests/2/attachments/1/content');
  const row = await rowFor('pc-12.jpg');
  await user.click(within(row).getByRole('button', { name: 'Descargar' }));
  await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
  expect(downloadBlob.mock.calls[0][0].filename).toBe('pc-12.jpg');
  expect(downloads).toHaveLength(1);
});
