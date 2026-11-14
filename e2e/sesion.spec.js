import { expect, test } from '@playwright/test';
import {
  ACCOUNTS, IS_REAL, NAMES, fillLogin, firstLoginAccount, homePathFor, login, logout, unique,
} from './fixtures.js';

test.describe('sesion', () => {
  for (const rol of Object.keys(ACCOUNTS)) {
    test(`ingreso de ${rol} lleva a su inicio`, async ({ page }) => {
      await login(page, rol);
      await expect(page).toHaveURL(new RegExp(`${homePathFor(rol)}$`));
      await logout(page);
    });
  }

  test('credenciales inválidas no revelan el campo', async ({ page }) => {
    // Correo único: el backend limita los intentos fallidos por correo.
    await fillLogin(page, `nadie.${unique()}@universidad.example`, 'Incorrecta1');
    await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('primer ingreso pide cambiar la contraseña y luego lleva al inicio', async ({ page, request }) => {
    const cuenta = await firstLoginAccount(request);
    await fillLogin(page, cuenta.correo, cuenta.contrasena);
    await page.waitForURL('**/cambiar-contrasena');
    await expect(page.getByRole('heading', { name: 'Cambia tu contraseña' })).toBeVisible();
    await page.getByLabel('Contraseña actual').fill(cuenta.contrasena);
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('Nueva2026x');
    await page.getByLabel('Confirmar nueva contraseña').fill('Nueva2026x');
    await page.getByRole('button', { name: /contraseña/i }).last().click();
    await page.waitForURL('**/inicio');
  });

  test('restaura tras recargar sin guardar el token', async ({ page }) => {
    let token = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/v1/auth/login') && response.ok()) {
        token = (await response.json()).tokenAcceso;
      }
    });
    await login(page, 'ESTUDIANTE');
    const refresh = page.waitForRequest((r) => r.url().includes('/api/v1/auth/refresh'));
    await page.reload();
    const origin = (await (await refresh).allHeaders()).origin;
    await expect(page.getByText(NAMES.ESTUDIANTE, { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/inicio$/);
    expect(token).toBeTruthy();
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    expect(stored).not.toContain(token);
    if (IS_REAL) {
      const cookie = (await page.context().cookies()).find((c) => c.name === 'refresh_token');
      expect(cookie).toMatchObject({ httpOnly: true, path: '/api/v1/auth' });
      expect(origin).toBe('http://localhost:3000');
    }
  });

  test('cerrar sesión vuelve al ingreso y protege las rutas', async ({ page }) => {
    await login(page, 'DOCENTE');
    await logout(page);
    await page.goto('/solicitudes');
    await page.waitForURL('**/login');
    await expect(page.getByLabel('Correo institucional')).toBeVisible();
  });

  test('el token anterior queda revocado', async ({ page, request }) => {
    test.skip(!IS_REAL, 'La revocación se comprueba contra el backend real.');
    const pending = page.waitForRequest((r) => r.url().includes('/api/v1/admin/users') && r.headers().authorization);
    await login(page, 'ADMINISTRADOR');
    await page.goto('/admin/usuarios');
    const authorization = (await pending).headers().authorization;
    await logout(page);
    const response = await request.get('/api/v1/admin/users', { headers: { Authorization: authorization } });
    expect(response.status()).toBe(401);
  });
});
