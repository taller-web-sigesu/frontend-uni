import { expect, test } from '@playwright/test';
import { createRequest, login, switchTo } from './fixtures.js';

const header = (page) => page.locator('.detail-header');

test.describe('solicitudes', () => {
  test('ciclo completo: registro con evidencia, asignación, atención, cierre y encuesta', async ({ page }) => {
    test.setTimeout(120_000);
    await login(page, 'ESTUDIANTE');
    const { id, codigo } = await createRequest(page, { evidencia: true });
    await expect(page.getByRole('heading', { name: codigo })).toBeVisible();
    await expect(page.getByText('evidencia.png')).toBeVisible();

    await switchTo(page, 'SUPERVISOR');
    await page.goto(`/solicitudes/${id}`);
    await page.getByRole('button', { name: 'Asignar responsable' }).click();
    const dialog = page.getByRole('dialog', { name: 'Asignar responsable' });
    await dialog.getByLabel('Técnico').selectOption({ label: 'Técnico TI Demo' });
    await dialog.getByRole('button', { name: 'Asignar' }).click();
    await expect(header(page)).toContainText('Asignado');

    await switchTo(page, 'TECNICO');
    await page.goto(`/solicitudes/${id}`);
    await page.getByRole('button', { name: 'Iniciar atención' }).click();
    await expect(header(page)).toContainText('En proceso');
    await page.getByRole('button', { name: 'Marcar como resuelta' }).click();
    await expect(header(page)).toContainText('Resuelto');

    await switchTo(page, 'SUPERVISOR');
    await page.goto(`/solicitudes/${id}`);
    await page.getByRole('button', { name: 'Cerrar solicitud' }).click();
    await expect(header(page)).toContainText('Cerrado');

    await switchTo(page, 'ESTUDIANTE');
    await page.goto(`/solicitudes/${id}`);
    const survey = page.getByRole('region', { name: 'Encuesta de satisfacción' });
    await survey.getByRole('radio', { name: '5' }).check();
    await survey.getByRole('button', { name: 'Enviar encuesta' }).click();
    await expect(survey.getByRole('status')).toHaveText('Gracias por tu respuesta');
  });

  test('el supervisor rechaza con motivo obligatorio', async ({ page }) => {
    await login(page, 'DOCENTE');
    const { id } = await createRequest(page);
    await switchTo(page, 'SUPERVISOR');
    await page.goto(`/solicitudes/${id}`);
    await page.getByRole('button', { name: 'Rechazar solicitud' }).click();
    const dialog = page.getByRole('dialog', { name: 'Rechazar solicitud' });
    await dialog.getByRole('button', { name: 'Rechazar solicitud' }).click();
    await expect(dialog.getByText('Indica el motivo del rechazo.')).toBeVisible();
    await dialog.getByLabel('Motivo').fill('Corresponde a otra sede.');
    await dialog.getByRole('button', { name: 'Rechazar solicitud' }).click();
    await expect(header(page)).toContainText('Rechazado');
    await expect(page.getByText('Corresponde a otra sede.')).toBeVisible();
  });

  test('una solicitud ajena se muestra como no encontrada', async ({ page }) => {
    await login(page, 'ESTUDIANTE');
    const { id } = await createRequest(page);
    await switchTo(page, 'DOCENTE');
    await page.goto(`/solicitudes/${id}`);
    await expect(page.getByText('No encontramos esta solicitud o no tienes acceso a ella')).toBeVisible();
  });
});
