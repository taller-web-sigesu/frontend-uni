import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createRequest, login, switchTo } from './fixtures.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function seriousViolations(page) {
  // Espera a que la pantalla termine de cargar (sin esqueletos).
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('.skeleton')).toHaveCount(0);
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('a11y', () => {
  test('pantallas principales sin violaciones graves', async ({ page }) => {
    test.setTimeout(120_000);
    const found = {};
    const check = async (path) => {
      if (path) await page.goto(path);
      found[path || page.url()] = await seriousViolations(page);
    };

    await page.goto('/login');
    await check(null);
    await login(page, 'ESTUDIANTE');
    await check('/inicio');
    await check('/solicitudes');
    await check('/reservas/nueva');
    const { id } = await createRequest(page);
    await check(`/solicitudes/${id}`);

    await switchTo(page, 'SUPERVISOR');
    await check('/gestion');
    await check('/indicadores');
    await check('/reservas/aprobacion');

    await switchTo(page, 'ADMINISTRADOR');
    await check('/inicio');
    await check('/admin/usuarios');
    await check('/admin/catalogos');

    expect(Object.fromEntries(Object.entries(found).filter(([, list]) => list.length))).toEqual({});
  });

  test('el teclado recorre el menú, las migas y el contenido administrativo', async ({ page }) => {
    await login(page, 'ADMINISTRADOR');
    await expect(page.getByRole('region', { name: 'Indicadores del mes' }).getByText('Registradas')).toBeVisible();
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('region', { name: 'Accesos rápidos' }).getByRole('link', { name: 'Ambientes' })).toBeVisible();

    const drawerToggle = page.getByRole('button', { name: 'Abrir menú' });
    if (await drawerToggle.isVisible()) {
      await drawerToggle.focus();
      await page.keyboard.press('Enter');
      const drawer = page.getByRole('dialog', { name: 'Menú' });
      const close = drawer.getByRole('button', { name: 'Cerrar', exact: true });
      const brand = drawer.getByRole('link', { name: 'UNMSM, inicio' });
      await expect(close).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(brand).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(close).toBeFocused();
      await expect(drawer.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(drawerToggle).toBeFocused();
    } else {
      const toggle = page.getByRole('button', { name: 'Contraer menú' });
      await toggle.focus();
      await page.keyboard.press('Enter');
      const expand = page.getByRole('button', { name: 'Expandir menú' });
      await expect(expand).toBeFocused();
      await expect(expand).toHaveAttribute('aria-expanded', 'false');
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }

    for (const [path, label] of [['/admin/usuarios', 'Usuarios'], ['/admin/catalogos', 'Catálogos']]) {
      await page.goto(path);
      const breadcrumb = page.getByRole('navigation', { name: 'Ruta de navegación' });
      await expect(breadcrumb.getByText(label)).toHaveAttribute('aria-current', 'page');
      await expect(page.getByRole('table')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const home = breadcrumb.getByRole('link', { name: 'Inicio' });
      await home.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/inicio$/);
    }
  });
});
