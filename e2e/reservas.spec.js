import { expect, test } from '@playwright/test';
import {
  LAB, chooseLabSlot, createReservation, fillSlot, futureWeekday, login, occupySlot, rowWith, switchTo,
} from './fixtures.js';

test.describe('reservas', () => {
  test('registra una reserva pendiente y aparece en mis reservas', async ({ page }) => {
    await login(page, 'ESTUDIANTE');
    const reserva = await createReservation(page);
    await page.getByRole('link', { name: 'Ver mis reservas' }).click();
    await page.getByLabel('Desde').fill(reserva.fecha);
    await page.getByLabel('Hasta').fill(reserva.fecha);
    const row = await rowWith(page, reserva.codigo);
    await expect(row).toContainText('Pendiente');
    await expect(row).toContainText(LAB);
  });

  test('conflicto de franja entre la consulta y el envío', async ({ page, request }) => {
    await login(page, 'ESTUDIANTE');
    const slot = await chooseLabSlot(page, futureWeekday());
    await fillSlot(page, slot, 'Repaso grupal');
    await occupySlot(page, request, slot);
    await page.getByRole('button', { name: 'Registrar reserva' }).click();
    await expect(page.getByRole('alert')).toHaveText('La franja elegida ya no está disponible. Elige otra.');
    await expect(page.getByLabel('Motivo')).toHaveValue('Repaso grupal');
    await expect(page.getByText(`${slot.horaInicio}–${slot.horaFin} ocupada`)).toBeVisible();
  });

  test('el propietario cancela su reserva', async ({ page }) => {
    await login(page, 'ESTUDIANTE');
    const reserva = await createReservation(page);
    await page.getByRole('link', { name: 'Ver mis reservas' }).click();
    await page.getByLabel('Desde').fill(reserva.fecha);
    await page.getByLabel('Hasta').fill(reserva.fecha);
    await (await rowWith(page, reserva.codigo)).click();
    await page.waitForURL(/\/reservas\/\d+$/);
    await page.getByRole('button', { name: 'Cancelar reserva' }).click();
    await page.getByRole('dialog', { name: 'Cancelar reserva' }).getByRole('button', { name: 'Cancelar reserva' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Reserva cancelada' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).toBeHidden();
  });

  test('la supervisora aprueba una reserva de su área', async ({ page }) => {
    await login(page, 'DOCENTE');
    const reserva = await createReservation(page);
    await switchTo(page, 'SUPERVISOR');
    await page.goto('/reservas/aprobacion');
    const row = await rowWith(page, reserva.codigo);
    await row.getByRole('button', { name: `Revisar ${reserva.codigo}` }).click();
    const dialog = page.getByRole('dialog', { name: `Revisar ${reserva.codigo}` });
    await dialog.getByRole('button', { name: 'Aprobar' }).click();
    await expect(page.getByText(`Reserva ${reserva.codigo} aprobada`)).toBeVisible();
  });

  test('el administrador guarda el horario de un espacio', async ({ page }) => {
    await login(page, 'ADMINISTRADOR');
    await page.goto('/admin/ambientes');
    const row = await rowWith(page, LAB);
    await row.getByRole('button', { name: 'Horario' }).click();
    const dialog = page.getByRole('dialog', { name: `Horario de ${LAB}` });
    await expect(dialog.getByLabel('Abierto el lunes')).toBeVisible();
    // Se guarda sin cambios: en modo real el horario es compartido.
    await dialog.getByRole('button', { name: 'Guardar horario' }).click();
    await expect(page.getByText(`Horario de ${LAB} guardado`)).toBeVisible();
  });
});
