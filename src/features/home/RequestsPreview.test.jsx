import { screen, within } from '@testing-library/react';
import { db } from '../../mocks/db.js';
import { renderWithRouter } from '../../test/render.jsx';
import { ANA, PEDRO, TECNICO_TI, userById } from '../../test/users.js';
import { RequestsPreview } from './RequestsPreview.jsx';

function renderPreview(userId) {
  const user = userById(userId);
  return renderWithRouter(<RequestsPreview user={user} />, { session: { user } });
}

const rowCodes = (region) => within(region).getAllByRole('row').slice(1)
  .map((row) => within(row).getAllByRole('cell')[0].textContent);

test('inicio de estudiante y docente muestra sus solicitudes y la acción de registrar', async () => {
  const { unmount } = renderPreview(ANA);
  const region = await screen.findByRole('region', { name: 'Últimas solicitudes' });
  await within(region).findByText('SOL-2026-000006');
  // Ana tiene 6: se muestran las 5 más recientes.
  expect(rowCodes(region)).toEqual(['SOL-2026-000006', 'SOL-2026-000005', 'SOL-2026-000004', 'SOL-2026-000003', 'SOL-2026-000002']);
  expect(within(region).getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/solicitudes');
  expect(screen.getByRole('link', { name: 'Registrar nueva solicitud' })).toHaveAttribute('href', '/solicitudes/nueva');
  unmount();

  renderPreview(PEDRO);
  const docente = await screen.findByRole('region', { name: 'Últimas solicitudes' });
  await within(docente).findByText('SOL-2026-000009');
  expect(rowCodes(docente)).toEqual(['SOL-2026-000009', 'SOL-2026-000008', 'SOL-2026-000007']);
});

test('inicio de técnico muestra sus asignaciones', async () => {
  renderPreview(TECNICO_TI);
  const region = await screen.findByRole('region', { name: 'Mis asignaciones' });
  await within(region).findByText('SOL-2026-000002');
  expect(rowCodes(region)).toEqual(['SOL-2026-000002', 'SOL-2026-000003']);
  expect(within(region).getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/bandeja');
  expect(screen.queryByRole('link', { name: 'Registrar nueva solicitud' })).not.toBeInTheDocument();
});

test('inicio sin solicitudes invita a registrar la primera', async () => {
  db.requests = db.requests.filter((r) => r.solicitanteId !== PEDRO);
  renderPreview(PEDRO);
  expect(await screen.findByText('Aún no tienes solicitudes registradas')).toBeInTheDocument();
});
