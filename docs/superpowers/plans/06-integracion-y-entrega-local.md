# Fase 06 · Integración, pruebas y entrega local

**Entrada.** Las fases 01 a 05 están verificadas con API simulada. Para cerrar con API real, cada operación utilizada debe estar publicada en el contrato aprobado e implementada en el backend local.

**Fuentes.** [Guía Docker](../../../../infra-uni/docs/DOCKER.md) · [ADR de calidad y CI](../../../../infra-uni/docs/adr/ADR-0005-ci-cd-calidad.md) · [Plan de integración backend](../../../../backend-uni/docs/plan/04-integracion-local-y-ci.md)

## Tareas

- [ ] Configurar Vitest y Testing Library para componentes, ESLint y Playwright. En CI ejecutar `npm ci`, `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e` con API simulada. Configurar `npm test` para ejecución única. Cubrir validación, permisos, carga, vacío, errores, reintento, navegación por teclado y foco.
- [ ] Ejecutar el Compose existente desde infraestructura. Comprobar `http://localhost:3000`, el proxy `/api` hacia backend, el estado de los servicios y la sesión con cookies. Usar cuentas locales de estudiante, técnico, supervisor y administrador.
- [ ] Repetir contra API real el recorrido de la matriz y registrar resultado por historia. Marcar como pendiente de integración cualquier operación que todavía dependa del backend.
- [ ] Comparar cada ruta de escritorio con su frame a 1440 px. Revisar adaptación a 360 y 768 px, contraste, etiquetas, avisos de error, foco y teclado. Entregar instrucciones para alternar entre API simulada y real y reproducir las verificaciones.

| Fase funcional | Evidencia mínima |
| --- | --- |
| [02 · Sesión](02-acceso-sesion-y-perfil.md) | Login por rol, primer ingreso, recarga, refresh concurrente y revocación inmediata. |
| [03 · Solicitudes](03-solicitudes-y-atencion.md) | Registro, comentario, asignación, resolución, cierre, encuesta y recurso fuera de alcance. |
| [04 · Indicadores y administración](04-indicadores-y-administracion.md) | Filtros y CSV coherentes, desactivación, catálogo y conflicto de vigencia SLA. |
| [05 · Reservas](05-reservas-y-ambientes.md) | Alta, decisión, cancelación del propietario, conflicto entre consulta y guardado y horario administrado. |

**Cierre.** Los cinco roles completan sus recorridos con el backend real en Docker local, las comprobaciones de CI pasan y la evidencia permite comprobar las HU-01 a HU-25.

## Capturas de Figma

Usar las galerías de cada fase al comparar los recorridos de escritorio con los frames originales.

- [Capturas de la fase 01](01-base-visual-y-api-simulada.md#capturas-de-figma)
- [Capturas de la fase 02](02-acceso-sesion-y-perfil.md#capturas-de-figma)
- [Capturas de la fase 03](03-solicitudes-y-atencion.md#capturas-de-figma)
- [Capturas de la fase 04](04-indicadores-y-administracion.md#capturas-de-figma)
- [Capturas de la fase 05](05-reservas-y-ambientes.md#capturas-de-figma)
