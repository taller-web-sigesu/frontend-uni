import { expect, test } from '@playwright/test';
import { TI_CATEGORY, login, rowWith, unique } from './fixtures.js';

test.describe('administracion', () => {
  test('indicadores con rango y exportación CSV', async ({ page }) => {
    await login(page, 'ADMINISTRADOR');
    await page.goto('/indicadores');
    await expect(page.getByRole('heading', { name: 'Indicadores' })).toBeVisible();
    const range = page.getByRole('form', { name: 'Rango de fechas' });
    await range.getByLabel('Desde').fill('2026-11-01');
    await range.getByLabel('Hasta').fill('2026-11-30');
    await range.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.getByText('01/11/2026', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Registradas').first()).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar solicitudes (CSV)' }).click();
    expect((await download).suggestedFilename()).toBe('solicitudes.csv');
  });

  test('crea un docente y le restablece la contraseña', async ({ page }) => {
    const correo = `docente.${unique()}@unmsm.edu.pe`;
    await login(page, 'ADMINISTRADOR');
    await page.goto('/admin/usuarios');
    await page.getByRole('button', { name: 'Crear usuario' }).click();
    const dialog = page.getByRole('dialog', { name: 'Crear usuario' });
    await dialog.getByLabel('Nombre completo').fill('Docente E2E');
    await dialog.getByLabel('Correo').fill(correo);
    await dialog.getByLabel('Rol').selectOption('DOCENTE');
    await dialog.getByLabel('Contraseña inicial').fill('Inicial2026');
    await dialog.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(dialog).toBeHidden();

    const row = await rowWith(page, correo);
    await expect(row).toContainText('Docente');
    await row.getByRole('button', { name: 'Restablecer contraseña' }).click();
    const reset = page.getByRole('dialog', { name: 'Restablecer contraseña' });
    await reset.getByRole('button', { name: 'Restablecer' }).click();
    await expect(reset.getByText('Esta contraseña no se volverá a mostrar')).toBeVisible();
    await expect(reset.getByLabel('Contraseña temporal')).not.toHaveValue('');
    await reset.getByRole('button', { name: 'Listo' }).click();
  });

  test('aprueba una cuenta auto-registrada', async ({ page }) => {
    const correo = `alumno.${unique()}@unmsm.edu.pe`;
    await page.goto('/registro');
    await page.getByLabel('Nombre completo').fill('Alumno E2E');
    await page.getByLabel('Correo institucional').fill(correo);
    await page.getByLabel('Contraseña', { exact: true }).fill('Alumno2026');
    await page.getByLabel('Confirmar contraseña').fill('Alumno2026');
    await page.getByRole('button', { name: 'Registrarme' }).click();
    await expect(page.getByRole('status')).toContainText('Registro enviado');

    await login(page, 'ADMINISTRADOR');
    await page.goto('/admin/usuarios');
    await page.getByRole('tab', { name: 'Pendientes de aprobación' }).click();
    const row = await rowWith(page, correo);
    await row.getByRole('button', { name: 'Aprobar' }).click();
    await expect(page.getByRole('status')).toHaveText('Cuenta de Alumno E2E aprobada');
  });

  test('renombra un estado de solicitud', async ({ page }) => {
    await login(page, 'ADMINISTRADOR');
    await page.goto('/admin/catalogos');
    await page.getByRole('tab', { name: 'Estados' }).click();
    const rename = async (from, to) => {
      const row = page.getByRole('row').filter({ hasText: from });
      await row.getByRole('button', { name: 'Editar nombre' }).click();
      const dialog = page.getByRole('dialog', { name: 'Editar nombre' });
      await dialog.getByLabel('Nombre').fill(to);
      await dialog.getByRole('button', { name: 'Guardar' }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByText(to, { exact: true }).first()).toBeVisible();
    };
    await rename('En proceso', 'En atención');
    // En modo real el catálogo es compartido: se deja como estaba.
    await rename('En atención', 'En proceso');
  });

  test('una política SLA superpuesta muestra el conflicto', async ({ page }) => {
    await login(page, 'ADMINISTRADOR');
    await page.goto('/admin/sla');
    await page.getByRole('button', { name: 'Nueva política' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nueva política' });
    await dialog.getByLabel('Por categoría').check();
    await dialog.getByLabel('Categoría', { exact: true }).selectOption({ label: TI_CATEGORY });
    await dialog.getByLabel('Horas objetivo').fill('12');
    await dialog.getByLabel('Horas de aviso').fill('2');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
