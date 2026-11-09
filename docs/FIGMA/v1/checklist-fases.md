# Checklist por fases — UniService · Desktop (Figma) · v1

Seguimiento de `plan-disenio-figma-v1.md` (§11). Se marca `[x]` al cerrar cada entregable; una fase no se cierra con ítems pendientes ni con bloqueos abiertos.

## Avance

| Fase | Páginas | Pantallas | Estado | Responsable | Fecha |
|---|---|---|---|---|---|
| 1 · Preparación y fundaciones | estructura `00`–`08`; contenido en `00`, `01`, `03` | — | Hecho | Luis Bizarro | 06 nov 2026 |
| 2 · Librería de componentes | `02` | — | Hecho | Luis Bizarro | 06 nov 2026 |
| 3 · Shell, autenticación y estudiante | `04`, `07` (parcial) | P1–P4, P5-estudiante | Hecho | Luis Bizarro | 06 nov 2026 |
| 4 · Operación y reservas | `05`, `04` (parcial), `07` (parcial) | P5-técnico/supervisor, P6–P11 | Hecho | Luis Bizarro | 06 nov 2026 |
| 5 · Administración, estados y handoff | `04` (parcial), `06`, `07`, `08` | P12–P16 | Hecho | Luis Bizarro | 06 nov 2026 |

Estados válidos: `Pendiente` · `En curso` · `Hecho`.

---

## Fase 1 — Preparación y fundaciones

**Entregables**

- [x] Acceso verificado: lectura de páginas y escritura de un nodo temporal.
- [x] Página `pagina-prueba` (`13:2`) eliminada (ya no existía al iniciar la ejecución).
- [x] Páginas `UniService · 00` a `UniService · 08` creadas.
- [x] `01 · Foundations`: variables de color de §4.1 en un único modo (23 variables COLOR).
- [x] `01 · Foundations`: `space/4…48` (7), `radius/sm|md|lg|full` (4) y elevación como estilos `elev/1`, `elev/2`; `elev/0` es borde 1 px.
- [x] `01 · Foundations`: 8 estilos de texto Inter (§4.2).
- [x] `01 · Foundations`: retícula de 12 columnas (gutter 24, margen 32) y callout de la regla de oro del amarillo.
- [x] `00 · Cover`: portada con versión, alcance y leyenda de roles.
- [x] `03 · Flows`: recorrido principal, flujos por rol y matriz rol × pantalla.

**Criterio de cierre**

- [x] Las 9 páginas existen con el prefijo.
- [x] Variables y estilos publicados (34 variables, 8 estilos de texto, 2 de elevación).
- [x] Cero valores hex sueltos fuera de `01`; las pantallas usan variables vinculadas.
- [x] Cover legible; matriz sin celdas vacías.

---

## Fase 2 — Librería de componentes

**Entregables — 2a núcleo**

- [x] Navegación: `Sidebar`, `Nav Item`, `Topbar`, `User Menu`, `Page Header`, `Tabs`.
- [x] Acciones: `Button` (Primary/Secondary/Ghost/Danger × Md/Sm × 6 estados), `Icon Button`, `Link`.
- [x] Formularios: `Input`, `Textarea`, `Select`, `Combobox`, `Date Picker`, `Date Range`, `Checkbox`, `Radio`, `Switch`, `Field`, `Search`.
- [x] Datos: `Badge / Status`, `Badge / Priority`, `Badge / SLA`, `Avatar`, `User Chip`, `Key Value`, `Pagination`.
- [x] Contenedores: `Card`, `KPI Card`, `Panel`, `Side Panel`, `Modal`, `Confirm Dialog`, `Toast`, `Inline Alert`, `Empty State`, `Skeleton`.

**Entregables — 2b dominio**

- [x] `Table` (header, row, cell, riel de prioridad, selección).
- [x] `Request Summary Row`, `History Item`, `Comment Item`, `Audit Row`.
- [x] `Availability Slot`, `Chart / Bar H`, `Chart / Bar V`, `Chart / Donut`, `Lifecycle Strip`.

**Entregables — sistema**

- [x] Estados por componente: default, hover, foco, pressed, deshabilitado y carga; el estado error vive en `Input`/`Field`.
- [x] Anillo de foco 2 px `color/info` en botones, inputs y tabs.
- [x] Propiedades de variante en español (`Variante`, `Tamaño`, `Estado`, `Tipo`, `Prioridad`, `SLA`).

**Criterio de cierre**

- [x] Toda variante existe y está nombrada (19 sets, 105 variantes, 28 componentes sueltos).
- [x] Ningún badge depende solo del color.
- [x] Foco visible en los interactivos.
- [x] Ninguna pantalla futura necesita estilos sueltos: los 47 grupos de §7 existen en `02 · Components`.

---

## Fase 3 — Shell, autenticación y flujo estudiante

**Entregables**

- [x] Shell compuesto (sidebar 224/60 + topbar 60) con instancias de `02`.
- [x] P1 Iniciar sesión (error inline y `429` en `07 · States`) y variante 1280.
- [x] P2 Cambio de contraseña obligatorio y variante 1280.
- [x] P3 Mis solicitudes (vacío en `07`, tabla y paginación).
- [x] P4 Registrar solicitud (un solo paso).
- [x] P5 variante estudiante (encuesta en `CERRADO`).
- [x] `07 · States` parcial: vacío, carga, error de carga, credenciales inválidas, `429` y `404`.

**Criterio de cierre**

- [x] Frames a 1440 (P1, P2, P3, P4, P5) y P1/P2 también a 1280 sin scroll horizontal.
- [x] Una sola CTA amarilla por pantalla (login, registrar y encuesta).
- [x] Toda instancia proviene de `02 · Components` (sidebar, topbar, inputs, selects, badges, botones, alertas, empty state, skeleton).
- [x] Columnas de P3 iguales a HU-04: código, categoría, estado, prioridad y fecha.

---

## Fase 4 — Operación y reservas

**Entregables**

- [x] P5 variante técnico (Marcar resuelta, SLA y comentarios).
- [x] P5 variante supervisor con acciones (Reasignar / Rechazar / Cerrar).
- [x] P5 variante supervisor con auditoría (Audit Row).
- [x] P6 Mi bandeja (SLA visible, acciones de estado, orden fijo del servidor).
- [x] P7 Gestión de área + panel de asignación.
- [x] P8 Dashboard con franja de ciclo, 4 KPIs y 3 gráficos (9 indicadores reales).
- [x] P9 Reservar ambiente (espacios, disponibilidad, formulario y reglas).
- [x] P10 Mis reservas (estados de reserva y cancelación).
- [x] P11 Aprobación de reservas (aprobar / rechazar con motivo).
- [x] `07 · States` parcial: `409` de franja ocupada y confirmación de rechazo.

**Criterio de cierre**

- [x] Cada columna de tabla corresponde a un campo real del DTO.
- [x] Sin buscador ni ordenamiento (C2); P6 lo explicita y el orden lo impone el servidor.
- [x] Sin métricas inventadas; `vencidas` muestra "No disponible" cuando `disponible:false`.
- [x] Acciones ausentes en estados terminales; aprobar la propia reserva se bloquea con aviso.

---

## Fase 5 — Administración, estados y handoff

**Entregables**

- [x] P12 Usuarios (tabla, badges Activo/Inactivo, CTA y filtros).
- [x] P13 Catálogos con sus 4 tabs: Áreas, Categorías, Prioridades y Estados, cada uno con tabla, nota y paginación.
- [x] P14 Políticas SLA (tabla, precedencia y alcance).
- [x] P15 Espacios, horarios y política de reservas (tabla, horario semanal y 5 campos).
- [x] P16 Perfil y contraseña (datos de solo lectura + cambio de contraseña).
- [x] `07 · States` completo: vacío, carga, errores 403/404/409, `429`, confirmación, toast y primer ingreso.
- [x] `08 · Handoff` por pantalla (endpoint, rol, estados, copy, medidas y notas).
- [x] Desvío light-only (C5) y deudas C2/C3 anotados en `08`.
- [x] Contraste verificado y corregido (ver registro); checklist global revisado.
- [x] Trazabilidad HU ↔ pantalla ↔ endpoint completa.
- [x] Conexiones de prototipo por página: sidebar, CTA de cabecera, fila de tabla y enlaces de retorno, con puntos de inicio de flujo.
- [x] `P00 · Inicio` para Estudiante y Administrador, integrados al sidebar y a P01.

**Criterio de cierre**

- [x] Las 9 páginas y las 16 pantallas existen (P1–P16, con 4 variantes de P5).
- [x] Checklist global de §12 revisado.
- [x] `08 · Handoff` trazado a HU y endpoint.
- [x] Contraste verificado: pares principales ≥ 4.5; texto de error sobre tint corregido a `color/error/strong` (5.91).

---

## Registro de bloqueos y desvíos

| Fecha | Fase | Problema | Decisión |
|---|---|---|---|
| 06 nov 2026 | 1 | Página `pagina-prueba` (`13:2`) creada para verificar la escritura del MCP. | Ya no existía al iniciar la Fase 1; no hubo nada que eliminar. |
| 06 nov 2026 | 5 | `DESIGN.md` define tema oscuro; el producto no tiene toggle ni endpoint de preferencia. | Sistema light-only (C5), documentado en `08 · Handoff`. |
| 06 nov 2026 | 2 | `Table` podría modelarse como set con variante de selección. | Un solo componente con una fila seleccionada: la selección es estado de runtime, no una variante de diseño. |
| 06 nov 2026 | 2 | §7 pide estado `error` en todos los componentes. | El botón no valida nada y no lleva estado error; se implementa en `Input`/`Field`. |
| 06 nov 2026 | 3 | La encuesta de P5 solo aplica a solicitudes cerradas. | P5-estudiante se dibuja como solicitud `CERRADA` con la encuesta visible; las variantes en atención van en la Fase 4. |
| 06 nov 2026 | 4 | `Badge / Status` no traía los estados de reserva de P10/P11. | Se añaden `Pendiente`, `Confirmada`, `Cancelada` y `Próxima` al set (10 variantes en total) en lugar de inventar pills sueltos. |
| 06 nov 2026 | 5 | P12 necesita estado Activo/Inactivo de usuario. | Se añaden al mismo set `Badge / Status` (12 variantes) para no introducir pills manuales. |
| 06 nov 2026 | 5 | `#DC2626` sobre `#FEF2F2` da 4.41:1 (< 4.5 AA). | Se añade `color/error/strong` `#B91C1C` (5.91:1) y se aplica al texto del badge `Rechazada`; el rojo base se mantiene para rellenos. |
| 06 nov 2026 | 5 | La API de Figma solo permite `NAVIGATE` dentro de la misma página. | Sidebar y CTA de instancia se cablean con hotspots invisibles; los cruces entre páginas (`Dashboard` admin → P08, `Perfil` técnico → P16, `Cerrar sesión` en 05/06 → P01) quedan sin enlace y se revisan en la entrega. |
| 06 nov 2026 | 5 | P15 quedaba a dos clics usando `Configuración` como toggle. | Se añade subnavegación `Tabs` ("Políticas SLA" / "Espacios y horarios") en P14 y P15; `Configuración` apunta siempre a P14 y el cambio entre ambas es de un clic. |
| 08 nov 2026 | 5 | Revisión UI/UX de la página Técnico y Supervisor con 9 hallazgos (estados, período, gráficos, KPIs duplicados, botones superpuestos y textos técnicos). | Se implementan UIUX-01 a 09: `P05c2` resuelta, período unificado, gráficos con prioridades/técnicos y valores, 9 indicadores sin duplicar, botones de P11 separados, KPIs de P00 alineados, auditoría ajustada y textos normalizados. «Cerrar sesión» pasa a secundario. Detalle en `docs/mejora-ui-ux-01.md`. |
| 06 nov 2026 | 5 | Faltaba la pantalla de Inicio del Técnico; "Inicio" apuntaba a Mi bandeja. | Se crea `P00 · Inicio — Técnico` con 4 KPI, solicitudes prioritarias y reservas del día; "Inicio" → P00 y "Mi bandeja" → P06. La banda de Técnico pasa a 3 pantallas y se registran los flujos Técnico y Supervisor. |
| 06 nov 2026 | 5 | Segunda ronda de revisión: ancho de P03, acciones ambiguas en P06/P07, "Dashboard" en supervisor, botones juntos en P05c y roles sin separar. | Se aplica todo: P03 con columna ACCIONES, regla única de acciones por estado, supervisor con "Inicio", acciones de P05c separadas 24 px y página 05 dividida en bandas "Rol · Técnico" y "Rol · Supervisor". P11 se confirma sin cambios. Registro en `docs/falta-implementar-02.md`. |
| 06 nov 2026 | 5 | El comentario se enviaba con un botón de texto "Comentar" fuera de la caja, poco directo. | Se sustituye por un compositor único con placeholder y botón de enviar (icono) dentro del campo, a la derecha, en P05, P05b y P05c. |
| 06 nov 2026 | 5 | P13 Catálogos solo tenía contenido en el tab Áreas y la tabla dejaba ~400 px de ancho sin usar. | Se crean los frames de Categorías, Prioridades y Estados con su tabla y paginación, se conectan los 4 tabs y las columnas se redistribuyen hasta x=1020 (ACCIONES). |
| 06 nov 2026 | 5 | Las tablas no mostraban controles de paginación y el componente `Pagination` solo tenía una instancia suelta en P03. | Se rediseña `Pagination` (contador + flechas + números con página activa) y se instancia en P03, P10, P11, P12, P13, P14, P15 y en los resúmenes de P00; se ajustan altos y se documenta 5 por página. |
| 06 nov 2026 | 5 | Varias barras laterales quedaron con alto `HUG` (476 px) tras cambiar el componente y el usuario/salida no llegaban al fondo. | Se fija el alto de cada instancia al del frame (1024) y el `Expansor` recupera `layoutGrow=1`; el botón `Salir` se reenlaza a `color/error`. |
| 06 nov 2026 | 5 | Faltaban pantallas de Inicio en Estudiante y Administrador; el sidebar admin decía "Dashboard". | Se crean `P00 · Inicio — Estudiante` y `P00 · Inicio — Administrador`, se renombra el ítem a "Inicio" y se cablean CTA, tarjetas y accesos rápidos. |
| 06 nov 2026 | 5 | La barra lateral no tenía control de colapso ni salida. | Se añaden al componente `Sidebar` el botón chevron (variantes Expandida/Colapsada) y el botón rojo `Cerrar sesión` con icono de salida; se crea `color/ink/inverse`. El cambio de variante no es cableable por API: queda como control visual y la variante colapsada está lista en la librería. |
