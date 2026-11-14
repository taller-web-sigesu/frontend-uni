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

    await switchTo(page, 'ADMINISTRADOR');
    await check('/admin/usuarios');

    expect(Object.fromEntries(Object.entries(found).filter(([, list]) => list.length))).toEqual({});
  });
});
