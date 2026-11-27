# Tareas pendientes del frontend

Estado al **16/11/2026**, con las fases 01 a 06 integradas y desplegadas.
Las fases 01 a 06 están implementadas; esta lista recoge lo que falta para entregar y lo que se dejó fuera a propósito.

**Fuera de alcance (decidido):** el modo oscuro. La aplicación es solo de tema claro; `DESIGN.md`, `AGENTS.md` y `ARCHITECTURE.md` ya lo reflejan.

## 1. Integración y despliegue

Estado al **14/11/2026**: las fases 05 y 06 están integradas en `main`, el CI está en verde y staging y producción están desplegados.

| # | Tarea | Estado |
| --- | --- | --- |
| 1.1 | Subir la rama de la fase 05 y abrir su PR | Completado |
| 1.2 | Subir la rama de la fase 06 y abrir su PR | Completado |
| 1.3 | Confirmar la primera ejecución de CI en GitHub | Completado: `ci` ejecuta lint, Vitest, build y Playwright |
| 1.4 | Revisión independiente del código | Pendiente: las PRs finales se integraron con bypass de administrador; falta la revisión por otro integrante |
| 1.5 | Despliegue en staging y producción | Completado: https://frontend-uni-tdk7.vercel.app y https://frontend-uni-wx9m.vercel.app |

## 2. Huecos del contrato (dependen del backend)

Actualizado el **16/11/2026**: el detalle publica `prioridad`, `area` y `encuestaRespondida`; el listado publica `categoria` y `prioridad`; la bandeja de reservas publica `solicitante`; la sesión publica `areaNombre`; y **HU-07/HU-08 ya leen el catálogo de prioridades activas** desde `GET /api/v1/admin/catalogs/priorities` (solo lectura para todos los roles autenticados). No quedan huecos del contrato para los flujos entregados.

`priorityName`, `areaName` y `surveyAnswered` siguen en `pendingContract.js` como respaldo para datos simulados o respuestas antiguas, no como sustituto del contrato real.

## 3. Riesgos sin probar

| # | Riesgo | Qué hacer |
| --- | --- | --- |
| 3.1 | Descarga de evidencias con Supabase (HU-26): el backend responde `302` a una URL firmada de otro origen; sin CORS en el bucket fallaría. | Probar con el almacenamiento Supabase activo y, si falla, configurar CORS en el bucket o servir la descarga desde el backend. |

## 4. Cobertura de pruebas

| # | Tarea | Detalle |
| --- | --- | --- |
| 4.1 | Recorrido E2E de HU-16 (categorías y áreas) | Completado: `administracion.spec.js` crea área y categoría, verifica que el estudiante las ve y que la baja lógica las oculta. |
| 4.2 | Recorrido E2E de HU-19 (auditoría) | Completado: `solicitudes.spec.js` asigna técnico y prioridad, verifica la auditoría y que el técnico no la ve. |
| 4.3 | Reintento de CI | CI reintenta una vez cada prueba fallida, lo que puede ocultar inestabilidad. Revisar los informes aunque el job salga en verde. |
| 4.4 | Recorrido manual con teclado | No se recorrió cada pantalla con Tab y Shift+Tab. |

## 5. Detalles visuales (no afectan a ninguna HU)

Los puntos 5.1 y 5.2 se actualizaron el 24/11/2026 durante el trabajo de Fase IV.

| # | Tarea | Detalle |
| --- | --- | --- |
| 5.1 | Usuarios a 1440 px | En Fase IV se habilitó el salto de línea después de @ y se dispusieron las acciones en una fila cuando hay ancho suficiente. |
| 5.2 | Filtros de Usuarios | Quedan como evolución. El frame de Figma tiene filtros por rol, área y estado. HU-15 no los exige. |
| 5.3 | Comparación con Figma | Se compararon 3 pantallas (P07, P09, P12) de 34. Completar si el equipo lo pide. |

## 6. Comportamientos menores conocidos

| # | Comportamiento | Detalle |
| --- | --- | --- |
| 6.1 | Estado de la API simulada | Se guarda en `sessionStorage`; un cambio en la semilla no se ve hasta cerrar la pestaña. Solo afecta al modo simulado. |
| 6.2 | Redirección tras cerrar sesión | Tras cerrar sesión, el siguiente ingreso siempre va al inicio del rol, aunque se llegara al login desde un enlace interno. Es intencional. |

## 7. Limpieza local

- Las pruebas contra el backend real dejaron cuentas, solicitudes y reservas de prueba en la base local. Para limpiarla: `docker compose down -v` en `infra-uni` (borra todos los datos locales).
