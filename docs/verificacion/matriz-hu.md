# Matriz de verificación por HU

Resultado de la fase 06 al **13/11/2026**, rama `feature/frontend-fase-06-integracion`.

- **E2E simulado:** `npm run test:e2e` (proyectos `chromium` 1440×900 y `mobile` 360×740): 46 pruebas en verde y 2 omitidas, que son las de solo modo real.
- **E2E real:** `E2E_API=real npx playwright test --project=chromium` contra el Compose de `infra-uni` (MySQL, backend y frontend en estado `healthy`): **24 de 24 en verde**.
- **Pruebas unitarias:** `npm test`: 274 en verde en 44 archivos.

Leyenda de la columna «E2E real»:
- ✔ — el recorrido pasó contra el backend real.
- ✘ — falló, con su causa.
- **Pendiente de integración** — el contrato aún no publica el dato o el endpoint que hace falta. La pantalla usa un texto de respaldo y el recorrido no lo comprueba.
- — — no hay recorrido E2E; la HU la cubren las pruebas unitarias.

Los specs están en `e2e/`. Cada prueba se cita como `spec › prueba`.

| HU | Pantallas | Pruebas unitarias | E2E simulado | E2E real | Fecha |
| --- | --- | --- | --- | --- | --- |
| HU-01 Iniciar y cerrar sesión | `/login`, topbar | `auth/pages.test.jsx`, `auth/SessionProvider.test.jsx`, `auth/refreshCoordinator.test.js` | `sesion › credenciales inválidas no revelan el campo`; `sesion › restaura tras recargar sin guardar el token`; `sesion › cerrar sesión vuelve al ingreso y protege las rutas` | ✔ Incluye `sesion › el token anterior queda revocado`, solo en modo real: el JWT anterior recibe 401 tras cerrar sesión. La cookie `refresh_token` es `HttpOnly` con `Path=/api/v1/auth`, y `/auth/refresh` lleva `Origin: http://localhost:3000`. | 13/11/2026 |
| HU-02 Acceso según rol | Todas (guardas, menú) | `auth/guards.test.jsx`, `components/layout/layout.test.jsx`, `app/routes.test.js` | `sesion › ingreso de <ROL> lleva a su inicio` (×5); `sesion › primer ingreso pide cambiar la contraseña y luego lleva al inicio` | ✔ En modo real, el primer ingreso usa una cuenta nueva creada por el administrador. | 13/11/2026 |
| HU-27 Registrarse | `/registro` | `auth/pages.test.jsx` | `administracion › aprueba una cuenta auto-registrada` (el registro abre la prueba) | ✔ | 13/11/2026 |
| HU-03 Registrar solicitud | `/solicitudes/nueva` | `requests/NewRequestPage.test.jsx`, `requests/attachmentRules.test.js` | `solicitudes › ciclo completo…` | ✔ | 13/11/2026 |
| HU-04 Mis solicitudes | `/solicitudes` | `requests/MyRequestsPage.test.jsx` | `a11y › pantallas principales sin violaciones graves` (solo accesibilidad) | ✔ Solo accesibilidad. | 13/11/2026 |
| HU-05 Detalle e historial | `/solicitudes/:id` | `requests/RequestDetailPage.test.jsx` | `solicitudes › ciclo completo…`; `solicitudes › una solicitud ajena se muestra como no encontrada` | ✔ **Pendiente de integración:** nombre de la prioridad para roles no administradores; se muestra «Prioridad <id>». | 13/11/2026 |
| HU-06 Comentarios | `/solicitudes/:id` | `requests/RequestDetailPage.test.jsx` | `solicitudes › ciclo completo…` (comentario de la estudiante) | ✔ | 13/11/2026 |
| HU-26 Adjuntar evidencias | `/solicitudes/nueva`, `/solicitudes/:id` | `requests/detail/AttachmentsSection.test.jsx` | `solicitudes › ciclo completo…` (PNG adjunto al registrar) | ✔ Con almacenamiento local en disco. **Riesgo:** con Supabase, la descarga redirige con `302` a una URL firmada de otro origen. Sin CORS en el bucket fallaría. No se ha probado. | 13/11/2026 |
| HU-07 Filtrar solicitudes del área | `/gestion` | `management/pages.test.jsx` | `a11y › pantallas principales sin violaciones graves` (solo accesibilidad) | ✔ Solo accesibilidad. **Pendiente de integración:** lectura de prioridades para el filtro del supervisor. | 13/11/2026 |
| HU-08 Asignar y ajustar prioridad | `/solicitudes/:id` (supervisor) | `management/detail/actions.test.jsx` | `solicitudes › ciclo completo…` (asignación) | ✔ Asignación. **Pendiente de integración:** lectura de prioridades para el selector del supervisor; en modo real se oculta el ajuste. | 13/11/2026 |
| HU-09 Mis asignaciones | `/bandeja` | `management/pages.test.jsx` | `solicitudes › ciclo completo…` (el técnico abre la solicitud desde la bandeja) | ✔ | 13/11/2026 |
| HU-10 Actualizar estado | `/solicitudes/:id` (técnico) | `management/detail/actions.test.jsx` | `solicitudes › ciclo completo…` (Iniciar atención → Marcar como resuelta) | ✔ | 13/11/2026 |
| HU-11 Cerrar o rechazar | `/solicitudes/:id` (supervisor) | `management/detail/actions.test.jsx` | `solicitudes › ciclo completo…` (cierre); `solicitudes › el supervisor rechaza con motivo obligatorio` | ✔ | 13/11/2026 |
| HU-12 Dashboard | `/indicadores` | `dashboard/DashboardPage.test.jsx`, `dashboard/dashboardApi.test.js` | `administracion › indicadores con rango y exportación CSV` | ✔ **Pendiente de integración:** nombres en `porPrioridad` y `porResponsable`; se muestra «Prioridad <id>» y «Responsable <id>». | 13/11/2026 |
| HU-13 Filtrar indicadores | `/indicadores` | `dashboard/DashboardPage.test.jsx` | `administracion › indicadores con rango y exportación CSV` (rango) | ✔ | 13/11/2026 |
| HU-14 Exportar reportes | `/indicadores` | `dashboard/DashboardPage.test.jsx` | `administracion › indicadores con rango y exportación CSV` (evento `download` con `solicitudes.csv`) | ✔ | 13/11/2026 |
| HU-15 Administrar usuarios | `/admin/usuarios` | `administration/users/UsersPage.test.jsx` | `administracion › crea un docente y le restablece la contraseña` | ✔ | 13/11/2026 |
| HU-16 Categorías y áreas | `/admin/catalogos` | `administration/catalogs/CatalogsPage.test.jsx` | — | — | 13/11/2026 |
| HU-17 Prioridades y estados | `/admin/catalogos` | `administration/catalogs/CatalogsPage.test.jsx` | `administracion › renombra un estado de solicitud` | ✔ El nombre se restaura al terminar. | 13/11/2026 |
| HU-28 Aprobar o rechazar cuentas | `/admin/usuarios` (pendientes) | `administration/users/accounts.test.jsx` | `administracion › aprueba una cuenta auto-registrada` | ✔ | 13/11/2026 |
| HU-29 Restablecer contraseña | `/admin/usuarios` | `administration/users/accounts.test.jsx` | `administracion › crea un docente y le restablece la contraseña` | ✔ Sobre una cuenta creada por la prueba, nunca sobre una de demostración. | 13/11/2026 |
| HU-18 SLA y vencimientos | `/admin/sla` | `administration/sla/SlaPoliciesPage.test.jsx` | `administracion › una política SLA superpuesta muestra el conflicto` | ✔ | 13/11/2026 |
| HU-19 Auditoría | `/solicitudes/:id` (supervisor) | `management/detail/actions.test.jsx` | — | — | 13/11/2026 |
| HU-20 Encuesta de satisfacción | `/solicitudes/:id` (solicitante) | `requests/detail/SurveySection.test.jsx` | `solicitudes › ciclo completo…` (calificación 5) | ✔ **Pendiente de integración:** marca `encuestaRespondida`. El formulario se muestra siempre y un 409 lo da por respondido. | 13/11/2026 |
| HU-21 Espacios y disponibilidad | `/reservas/nueva` | `reservations/NewReservationPage.test.jsx` | Todos los de `reservas` eligen el Laboratorio 204 y leen sus franjas | ✔ | 13/11/2026 |
| HU-22 Registrar reserva | `/reservas/nueva` | `reservations/NewReservationPage.test.jsx`, `reservations/reservationRules.test.js` | `reservas › registra una reserva pendiente y aparece en mis reservas`; `reservas › conflicto de franja entre la consulta y el envío` | ✔ En modo real, Pedro ocupa la franja por la API entre la consulta y el envío. | 13/11/2026 |
| HU-23 Aprobar o rechazar reservas | `/reservas/aprobacion` | `reservations/ApprovalPage.test.jsx` | `reservas › la supervisora aprueba una reserva de su área` | ✔ **Pendiente de integración:** nombre del solicitante en la bandeja de gestión; no se muestra. | 13/11/2026 |
| HU-24 Consultar y cancelar reservas | `/reservas`, `/reservas/:id` | `reservations/MyReservationsPage.test.jsx` | `reservas › registra una reserva pendiente…`; `reservas › el propietario cancela su reserva` | ✔ | 13/11/2026 |
| HU-25 Espacios, horarios y política | `/admin/ambientes` | `administration/spaces/SpacesAdminPage.test.jsx` | `reservas › el administrador guarda el horario de un espacio` | ✔ Se guarda sin cambios: el horario es compartido. | 13/11/2026 |

## Huecos del contrato (plan de la fase 01)

Todos siguen en `src/services/pendingContract.js`. Ninguno inventa endpoints.

| Flujo | Falta en el contrato | Efecto en modo real |
| --- | --- | --- |
| Solicitudes | Nombre de prioridad para roles no administradores; marca de encuesta respondida. | «Prioridad <id>»; el formulario de encuesta se muestra hasta que el servidor responde 409. |
| Supervisión | Lectura de prioridades para el selector del supervisor. | Se oculta el ajuste de prioridad al asignar y en el detalle. |
| Indicadores | Nombres en `porPrioridad` y `porResponsable`. | Textos de respaldo («Prioridad 4», «Responsable 19», «Sin asignar»). |
| Reservas | Propietario en la bandeja de gestión. | El supervisor no ve el nombre del solicitante. |

## Notas de ejecución

- Los datos que crean los recorridos reales (cuentas `@unmsm.edu.pe` con sufijo único, solicitudes y reservas) quedan en la base local. Para limpiarla: `docker compose down -v` en `infra-uni`.
- Los nombres visibles de la semilla real (`db/demo`, por ejemplo «Ana Estudiante») no coinciden con los de la API simulada («Ana Demo»). `e2e/fixtures.js` los separa por modo.
- El fallo intermitente de `sesion › cerrar sesión…` era una carrera de la prueba: recargaba antes de que terminara `POST /auth/logout`. `logout()` en `e2e/fixtures.js` ahora espera la revocación.
