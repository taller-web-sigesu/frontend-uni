# Fase 05 · Reservas y administración de ambientes

**Alcance.** HU-21 a HU-25. Depende de la [fase 02](02-acceso-sesion-y-perfil.md) y completa las vistas previas de la [fase 03](03-solicitudes-y-atencion.md).

**Fuentes.** [Contrato de reservas](https://github.com/taller-web-sigesu/backend-uni/blob/main/docs/api/reservas.md) · [Plan backend de reservas](https://github.com/taller-web-sigesu/backend-uni/blob/main/docs/plan/03-reservas-de-ambientes.md)

## Tareas

- [ ] En `src/features/reservations/`, implementar `/reservas/nueva`. Consultar `GET /spaces` y `GET /spaces/{id}/availability` con fechas de Lima. Al enviar `POST /reservations`, incluir espacio, fecha, hora de inicio y fin, motivo y asistentes opcionales. Mostrar código y estado pendiente. Explicar que la política vigente se valida en el servidor. Ante conflicto de franja, conservar motivo y asistentes, recargar disponibilidad y pedir otra selección. [P09 Nueva reserva](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=69-187)
- [ ] Implementar `/reservas` y `/reservas/:id` con lista propia, detalle e historial. Permitir cancelación mediante `PATCH /reservations/{id}/status` solo al propietario de una reserva pendiente o confirmada antes del inicio. Confirmar la acción y refrescar el detalle y la lista tras el éxito. Completar la vista previa de reservas propias en los inicios de estudiante y técnico. [P10 Mis reservas](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=69-292)
- [ ] Implementar `/reservas/aprobacion` para supervisor y administrador. Usar `GET /reservations?vista=gestion` con pendientes del alcance autorizado. Impedir la autoaprobación, exigir motivo al rechazar y usar `PATCH /reservations/{id}/status` para decidir. Ante conflicto, refrescar la reserva y la disponibilidad según la acción. [P11 Aprobación](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=70-611)
- [ ] En `src/features/administration/`, implementar `/admin/ambientes`. Consumir `/admin/spaces`, `/admin/space-types`, el horario de cada espacio y `/admin/reservation-policy`. Admitir una franja semanal por día, validar cierre posterior a apertura y usar los cinco campos de política del contrato. Mostrar los errores del servidor sin perder los valores del formulario. [P15 Administración](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=74-148)

**Aceptación.** Probar alta pendiente, aprobación, rechazo sin motivo, cancelación, conflicto de franja, intento de autoaprobación, intento de cancelación por otro usuario y cambio de política.

## Capturas de Figma

<details>
<summary>P09 · Reservar ambiente</summary>

![P09 · Reservar ambiente](capturas-figma/p09-reservar-ambiente.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=69-187)

</details>

<details>
<summary>P10 · Mis reservas</summary>

![P10 · Mis reservas](capturas-figma/p10-mis-reservas.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=69-292)

</details>

<details>
<summary>P11 · Aprobación de reservas</summary>

![P11 · Aprobación de reservas](capturas-figma/p11-aprobacion-reservas.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=70-611)

</details>

<details>
<summary>P15 · Administración de ambientes</summary>

![P15 · Administración de ambientes](capturas-figma/p15-administrar-ambientes.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=74-148)

</details>

<details>
<summary>P09 · Conflicto de franja horaria</summary>

![P09 · Conflicto de franja horaria](capturas-figma/p09-conflicto-franja.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=69-913)

</details>
