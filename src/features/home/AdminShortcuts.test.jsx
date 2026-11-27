import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../mocks/server.js';
import { currentMonthInLima, limaDaysToUtcRange } from '../../services/format.js';
import { renderWithRouter } from '../../test/render.jsx';
import { captureRequests, userById } from '../../test/users.js';

test('el inicio del administrador muestra los accesos y consulta el resumen mensual', async () => {
  const calls = captureRequests('GET', '/api/v1/dashboard/summary');
  const { desde, hasta } = currentMonthInLima();
  const captured = [];
  const original = globalThis.fetch;
  globalThis.fetch = (...args) => {
    captured.push(String(args[0]));
    return original(...args);
  };
  try {
    renderWithRouter(null, { route: '/inicio', session: { user: userById('1') } });
    const region = await screen.findByRole('region', { name: 'Accesos rápidos' });
    const links = within(region).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Indicadores', '/indicadores'],
      ['Usuarios', '/admin/usuarios'],
      ['Catálogos', '/admin/catalogos'],
      ['Políticas SLA', '/admin/sla'],
      ['Ambientes', '/admin/ambientes'],
      ['Aprobación de reservas', '/reservas/aprobacion'],
    ]);
    const summary = within(screen.getByRole('region', { name: 'Indicadores del mes' }));
    for (const label of ['Registradas', 'Pendientes', 'Atendidas']) {
      expect(await summary.findByText(label)).toBeVisible();
    }
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual(limaDaysToUtcRange(desde, hasta));
    // El administrador no ve solicitudes: no se pide /requests.
    expect(captured.some((url) => url.includes('/api/v1/requests'))).toBe(false);
  } finally {
    globalThis.fetch = original;
    server.events.removeAllListeners();
  }
});

test('si fallan los indicadores, el administrador puede reintentar y usar los accesos', async () => {
  server.use(http.get('/api/v1/dashboard/summary', () => HttpResponse.error(), { once: true }));
  const user = userEvent.setup();
  renderWithRouter(null, { route: '/inicio', session: { user: userById('1') } });
  const summary = within(await screen.findByRole('region', { name: 'Indicadores del mes' }));
  expect(await summary.findByRole('alert')).toBeVisible();
  expect(screen.getByRole('region', { name: 'Accesos rápidos' })).toBeVisible();
  await user.click(summary.getByRole('button', { name: 'Reintentar' }));
  expect(await summary.findByText('Registradas')).toBeVisible();
});
