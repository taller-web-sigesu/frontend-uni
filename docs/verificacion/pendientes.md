# Tareas pendientes del frontend

Estado al **13/11/2026**, al cerrar la fase 06 (rama `feature/frontend-fase-06-integracion`).
Las fases 01 a 06 están implementadas; esta lista recoge lo que falta para entregar y lo que se dejó fuera a propósito.

**Fuera de alcance (decidido):** el modo oscuro. La aplicación es solo de tema claro; `DESIGN.md`, `AGENTS.md` y `ARCHITECTURE.md` ya lo reflejan.

## 1. Integración (bloquea la entrega)

| # | Tarea | Responsable | Detalle |
| --- | --- | --- | --- |
| 1.1 | Subir la rama de la fase 05 y abrir su PR | Frontend | `feature/frontend-fase-05-reservas`, título `[frontend] ...`, revisada por un compañero. |
| 1.2 | Subir la rama de la fase 06 y abrir su PR | Frontend | Está apilada sobre la fase 05: abrir la PR contra esa rama o rebasarla sobre `main` cuando la 05 se fusione. |
| 1.3 | Confirmar la primera ejecución de CI en GitHub | Frontend | `.github/workflows/ci.yml` solo se probó en local. Revisar que `playwright install --with-deps` y los E2E pasen en el runner. |
| 1.4 | Revisión independiente del código | Equipo | La revisión de las fases 05 y 06 la hizo el mismo autor. La PR debe revisarla otra persona. |

## 2. Huecos del contrato (dependen del backend)

Actualizado el **14/11/2026** tras la ronda de QA: el detalle ya publica `prioridad`, `area` y `encuestaRespondida`; el listado publica `categoria` y `prioridad`; la bandeja de reservas publica `solicitante`; y la sesión publica `areaNombre`. Queda un solo hueco:

| # | Flujo | Falta en el contrato | Efecto hoy |
| --- | --- | --- | --- |
| 2.1 | Supervisión (HU-07, HU-08) | Lectura de prioridades para el selector del supervisor | Se oculta el ajuste de prioridad al asignar y en el detalle. |

`priorityName`, `areaName` y `surveyAnswered` siguen en `pendingContract.js` como respaldo para datos simulados o respuestas antiguas. Cuando el backend publique las prioridades del supervisor, quitar la última entrada, ajustar la pantalla y su prueba, y actualizar la matriz.

## 3. Riesgos sin probar

| # | Riesgo | Qué hacer |
| --- | --- | --- |
| 3.1 | Descarga de evidencias con Supabase (HU-26): el backend responde `302` a una URL firmada de otro origen; sin CORS en el bucket fallaría. | Probar con el almacenamiento Supabase activo y, si falla, configurar CORS en el bucket o servir la descarga desde el backend. |

## 4. Cobertura de pruebas

| # | Tarea | Detalle |
| --- | --- | --- |
| 4.1 | Recorrido E2E de HU-16 (categorías y áreas) | Hoy solo tiene pruebas unitarias. |
| 4.2 | Recorrido E2E de HU-19 (auditoría) | Hoy solo tiene pruebas unitarias. |
| 4.3 | Reintento de CI | CI reintenta una vez cada prueba fallida, lo que puede ocultar inestabilidad. Revisar los informes aunque el job salga en verde. |
| 4.4 | Recorrido manual con teclado | No se recorrió cada pantalla con Tab y Shift+Tab. |

## 5. Detalles visuales (no afectan a ninguna HU)

| # | Tarea | Detalle |
| --- | --- | --- |
| 5.1 | Usuarios a 1440 px | Los correos se cortan a mitad de palabra y las acciones de fila ocupan dos líneas. |
| 5.2 | Filtros de Usuarios | El frame de Figma tiene filtros por rol, área y estado; HU-15 no los exige. |
| 5.3 | Comparación con Figma | Se compararon 3 pantallas (P07, P09, P12) de 34. Completar si el equipo lo pide. |

## 6. Comportamientos menores conocidos

| # | Comportamiento | Detalle |
| --- | --- | --- |
| 6.1 | Estado de la API simulada | Se guarda en `sessionStorage`; un cambio en la semilla no se ve hasta cerrar la pestaña. Solo afecta al modo simulado. |
| 6.2 | Redirección tras cerrar sesión | Tras cerrar sesión, el siguiente ingreso siempre va al inicio del rol, aunque se llegara al login desde un enlace interno. Es intencional. |

## 7. Limpieza local

- Las pruebas contra el backend real dejaron cuentas, solicitudes y reservas de prueba en la base local. Para limpiarla: `docker compose down -v` en `infra-uni` (borra todos los datos locales).
