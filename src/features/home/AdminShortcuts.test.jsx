import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render.jsx';
import { userById } from '../../test/users.js';

test('el inicio del administrador muestra los cinco accesos', async () => {
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
      ['Aprobación de reservas', '/reservas/aprobacion'],
    ]);
    // El administrador no ve solicitudes: no se pide /requests.
    expect(captured.some((url) => url.includes('/api/v1/requests'))).toBe(false);
  } finally {
    globalThis.fetch = original;
  }
});
