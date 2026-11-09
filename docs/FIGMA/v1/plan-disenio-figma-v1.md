# Plan de diseño — UniService · Desktop (Figma) · v1

**Estado:** plan aprobado para ejecución, organizado en 5 fases (§11). MCP de Figma verificado con lectura y escritura sobre `GESTAL-V2` (06 nov 2026).
**Tipo de entrega:** diseño de alta fidelidad en Figma. **No se escribe código de producto.**
**Alcance:** 16 pantallas, solo PC (1440 px principal, 1280 px mínimo). **Sistema de color: solo modo claro (light-only).**
**Destino:** archivo `GESTAL-V2` (`fileKey 9qJJaiyMwZ1ZON36LkmbyR`), en páginas nuevas con prefijo `UniService ·`.
**Fuentes:** `frontend-uni/DESIGN.md` (visual), `backend-uni/docs/API-DISENIO.md` + `backend-uni/docs/api/*.md` (funcionalidad), `infra-uni/docs/requirements/user-stories/*` (25 HU), `frontend-uni/AGENTS.md` y `ARCHITECTURE.md` (convenciones).

---

## 1. Destino y estado del acceso

**Archivo destino:** `GESTAL-V2`
**Link:** https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=0-1
**fileKey:** `9qJJaiyMwZ1ZON36LkmbyR`

**Estado del acceso: verificado (06 nov 2026).**

- MCP de Figma conectado y autenticado como `luis.bizarro@unmsm.edu.pe` (plan Full, `code_layers_enabled: true`).
- Lectura confirmada: el archivo devuelve sus páginas actuales, `gestal-figma` (`0:1`) y `pagina-prueba` (`13:2`).
- Escritura confirmada: se crearon una página, un frame y un texto de prueba, y se obtuvo su render. La página de prueba se elimina en la Fase 1.
- Reglas de trabajo: páginas nuevas con prefijo `UniService ·`, sin tocar lo existente en GESTAL-V2.

**Nota operativa de lectura.** `get_metadata` y `get_screenshot` leen cualquier nodo; `get_design_context` exige tener una capa seleccionada en la app de escritorio. Para inspeccionar el diseño existente, usar los dos primeros.

Alta del servidor remoto en otra máquina (referencia; en esta sesión ya está conectado):

```
cmdc mcp add --transport http figma https://mcp.figma.com/mcp
```

Autenticación: `/mcp` dentro de la sesión, o `cmdc mcp auth figma`. Verificación: `cmdc mcp list` / `cmdc mcp auth --status figma`. Las herramientas MCP se resuelven al iniciar la sesión, así que requiere reinicio.

Alternativa local: `cmdc mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp`, con la app de escritorio abierta y el Dev Mode MCP server activo.

---

## 2. Enfoques considerados

| Enfoque | Qué implica | Trade-off | Veredicto |
|---|---|---|---|
| **A. Pantallas primero** | Dibujar las 16 pantallas y extraer componentes al final | Se ve rápido, pero deriva: radios, paddings y badges inconsistentes; el handoff queda inservible | Descartado |
| **B. Foundations → componentes → pantallas** | Variables de token + librería con variantes + pantallas armadas con instancias | Más setup inicial; a cambio, consistencia real y cambios globales de un solo golpe | **Elegido** |
| **C. Una sola página plana con todo** | Frames sueltos sin variables ni librería | Rápido de abrir, imposible de mantener y contradice `DESIGN.md` ("reutilizar componentes y tokens") | Descartado |

**Por qué B:** `DESIGN.md` exige tokens semánticos y reutilización; los 6 estados, 4 prioridades y 4 roles generan combinatoria que solo se controla con variantes. Un cambio de token se propaga a las 16 pantallas sin retocarlas.

---

## 3. Conflictos detectados y decisión

| # | Conflicto | Decisión |
|---|---|---|
| C1 | `DESIGN.md` lista 6 estados: *Registrada, En evaluación, Asignada, En atención, Resuelta, Cerrada*. El contrato de API usa `NUEVO, ASIGNADO, EN_PROCESO, RESUELTO, CERRADO, RECHAZADO`. **"En evaluación" no existe en la API.** | Se usan los 6 códigos del contrato. Etiqueta visible: `Registrada (NUEVO)`, `Asignada`, `En atención`, `Resuelta`, `Cerrada`, `Rechazada`. Se elimina "En evaluación". El texto visible es editable por el admin (`RequestStatusResponse.nombre`), así que el badge nunca depende del literal. |
| C2 | `DESIGN.md` pide tablas con **búsqueda y ordenamiento**. El contrato **no tiene** `q`, `search`, `sort` ni `order` en ningún endpoint. | No se dibuja buscador ni cabeceras ordenables (evita diseñar UI sin backend). Sí: filtros por campo exacto (`estado`, `categoriaId`, `prioridadId`), paginación por páginas (`page`/`size`, 20 por defecto) y conteo total. Se documenta como deuda de contrato, no como decisión visual. |
| C3 | Se pide pantalla de **Perfil**, pero no existe `GET /me`. Tampoco hay notificaciones ni adjuntos. | Perfil usa solo `SessionResponse.usuario` + `PATCH /auth/password`. Cero UI de adjuntos y cero campana de notificaciones (no se inventan módulos). |
| C4 | Reservas: el estado operativo derivado solo documenta `PROXIMA`. | Solo se muestran `PENDIENTE / CONFIRMADA / RECHAZADA / CANCELADA` + `PROXIMA`. El resto no se inventa. |
| C5 | `DESIGN.md` define `themes.dark` y `AGENTS.md` pide verificar ambos temas; el frontend no tiene toggle ni endpoint de preferencia (solo `prefers-color-scheme`). | **Sistema light-only.** Desvío consciente y documentado: un sistema de mesa de ayuda usado en oficinas de día no gana nada con un tema automático por SO que nadie puede fijar. Los tokens se declaran en un único modo, de forma que agregar `Dark` más adelante sea añadir un mode, no rediseñar. |

---

## 4. Sistema visual (estricto + refinamiento)

### 4.1 Paleta (un solo modo: claro)

Base literal de `DESIGN.md`; los derivados son la única adición:

| Token | Valor | Uso |
|---|---|---|
| `color/primary` | `#FACC15` | CTA primaria, indicador de nav activo |
| `color/primary/hover` | `#EAB308` | hover |
| `color/primary/pressed` | `#CA8A04` | pressed |
| `color/primary/tint` | `#FEF9C3` | fila seleccionada, fondo de nav activo |
| `color/ink` | `#18181B` | texto principal |
| `color/ink/muted` | `#71717A` | texto secundario |
| `color/background` | `#FAFAFA` | lienzo |
| `color/surface` | `#FFFFFF` | tarjetas, topbar, sidebar |
| `color/surface/variant` | `#F8F9FA` | header de tabla, zonas hundidas |
| `color/border` | `#E4E4E7` | bordes 1px |
| `color/border/strong` | `#D4D4D8` | separadores de foco/estructura |
| `color/success` / tint | `#15803D` / `#F0FDF4` | resuelto, SLA en plazo |
| `color/warning` / tint | `#B45309` / `#FFFBEB` | por vencer, en proceso |
| `color/error` / tint | `#DC2626` / `#FEF2F2` | rechazado, vencida, destructivo |
| `color/info` / tint | `#0369A1` / `#F0F9FF` | registrada, informativo |

**Regla de oro del amarillo:** el amarillo nunca rellena superficies grandes. Solo aparece en (1) una CTA primaria por pantalla, (2) el riel de 3 px del ítem de navegación activo, (3) el botón primario de un modal. Todo lo demás es superficie neutra. Esto cumple el *"Don't saturar la interfaz con amarillo"* de `DESIGN.md`.

**Prioridades:** el color viene del catálogo (`priorities.color`), no se fija en Figma. Se define un mapeo por defecto y el badge siempre lleva **texto + color** (nunca solo color): `BAJA #0369A1`, `MEDIA #B45309`, `ALTA #EA580C`, `CRÍTICA #DC2626`.

### 4.2 Tipografía — solo Inter

| Estilo | Tamaño / línea | Peso | Tracking | Uso |
|---|---|---|---|---|
| `Display` | 28 / 1.25 | 600 | −0.02em | Título de página |
| `Title` | 20 / 1.3 | 600 | −0.01em | Título de tarjeta/modal |
| `Section` | 16 / 1.4 | 600 | 0 | Encabezado de bloque |
| `Body` | 14 / 1.5 | 400 | 0 | Texto y celdas |
| `Body/Strong` | 14 / 1.5 | 500 | 0 | Énfasis, nombres |
| `Label` | 12 / 1.3 | 500 | 0.01em | Etiquetas de campo, badges, tabs |
| `Metric` | 28 / 1.1 | 600 | −0.02em | Valor KPI, `tnum` activado |
| `Metric/Small` | 20 / 1.2 | 600 | −0.01em | Métricas secundarias, `tnum` |

Números tabulares (`tnum`) en KPIs, tablas y fechas. Ningún texto funcional por debajo de 12 px. Sin versalitas decorativas ni eyebrows sobre cada título (evita el tell de plantilla).

### 4.3 Espaciado, radios, elevación

- Espaciado: `4 / 8 / 12 / 16 / 24 / 32 / 48` (`xs…2xl`). Todo múltiplo de 4.
- Radios: `sm 4` (badges), `md 8` (botones/inputs), `lg 12` (tarjetas/modales), `full 999` (avatares, pills).
- Elevación mínima: `elev-0` sin sombra + borde 1 px (default); `elev-1` `0 1px 2px rgba(0,0,0,.04)`; `elev-2` `0 8px 24px rgba(0,0,0,.08)` solo para modales y dropdowns. Nada de sombras suaves en cada tarjeta.

### 4.4 Layout (escritorio)

- Sidebar **224 px** expandida / **60 px** colapsada, fija, superficie blanca con borde derecho 1 px.
- Topbar **60 px**: ruta/breadcrumb a la izquierda, usuario + rol + menú a la derecha. Sin buscador global (ver C2).
- Contenido máximo **1440 px**, padding **32 px** lateral, **24 px** entre bloques.
- Grilla 12 columnas, gutter 24. Tabla ocupa 12 columnas; dashboard: franja de ciclo a 12 columnas + 2 filas de tarjetas.
- Alturas de control: input/botón **36 px** (default), **32 px** compacto en barras de filtros. Objetivo mínimo de puntero 24×24 (WCAG 2.2 AA) y 44 px en acciones de fila.

### 4.5 La única apuesta visual: el riel de prioridad

La tabla es el elemento principal (`DESIGN.md`). En cada fila se añade un **riel vertical de 3 px en el borde izquierdo** con el color de prioridad del catálogo. No decora: codifica urgencia y permite escanear la bandeja de un vistazo sin leer la columna. Va siempre acompañado del badge de prioridad con texto, así que no depende del color. Es el único gesto llamativo de la interfaz; todo lo demás queda disciplinado y neutro.

### 4.6 Wireframes de referencia

**Listado / bandeja**
```
┌──────────┬──────────────────────────────────────────────────────────────┐
│ ▣ Uni    │ Solicitudes de mi área            [Rango] [Exportar]         │ 60
│          ├──────────────────────────────────────────────────────────────┤
│ Dashboard│ Solicitudes del área           22 registradas                │
│ Bandeja  │ [Estado ▾] [Categoría ▾] [Prioridad ▾]      [Limpiar]        │
│ Reservas │ ┌──────────────────────────────────────────────────────────┐ │
│ Admin    │ │ Código       Categoría      Estado      Prioridad  Fecha │ │
│          │ ├──────────────────────────────────────────────────────────┤ │
│          │ │▎SOL-2026-000031  Redes   ● En atención  ▲ Alta  12 nov  │ │
│          │ │▎SOL-2026-000030  Soporte ● Registrada   — Media 12 nov  │ │
│          │ └──────────────────────────────────────────────────────────┘ │
│          │ Mostrando 1–20 de 22                    [‹] [1] [2] [›]      │
└──────────┴──────────────────────────────────────────────────────────────┘
```

**Dashboard**
```
┌──────────┬──────────────────────────────────────────────────────────────┐
│ sidebar  │ Dashboard     1 oct – 31 oct 2026     [Área ▾] [CSV ▾]       │
│          │                                                              │
│          │ Registradas 412 ─── Pendientes 96 ─── Atendidas 301          │
│          │ ──────────────────────────────────────────────────────────── │
│          │ ┌───────────┐┌───────────┐┌───────────┐┌───────────┐          │
│          │ │Prom. horas││ % resueltas││ Vencidas  ││ Por prior.│          │
│          │ │   18.4 h  ││   73.1 %  ││ No dispon.││  barras   │          │
│          │ └───────────┘└───────────┘└───────────┘└───────────┘          │
│          │ ┌───────────────────────┐┌───────────────────────┐           │
│          │ │ Por categoría         ││ Por responsable       │           │
│          │ │ barras horizontales   ││ barras horizontales   │           │
│          │ └───────────────────────┘└───────────────────────┘           │
└──────────┴──────────────────────────────────────────────────────────────┘
```

**Detalle de solicitud**
```
┌──────────┬──────────────────────────────────────────────────────────────┐
│ sidebar  │ ‹ Volver      SOL-2026-000031        ● En atención  ▲ Alta    │
│          │ ┌───────────────────────────┬──────────────────────────────┐ │
│          │ │ Categoría   Redes         │ Historial                    │ │
│          │ │ Área        Infraestructura│ ● En atención   12 nov 09:40│ │
│          │ │ Ubicación   Pab. B, 302   │ ● Asignada      12 nov 09:12│ │
│          │ │ Solicitante Ana Quispe    │ ● Registrada    12 nov 08:55│ │
│          │ │ Responsable Luis Rojas    │ ──────────────────────────── │ │
│          │ │ Descripción (texto)       │ Comentarios                  │ │
│          │ │                           │ [Escribe un comentario…]     │ │
│          │ └───────────────────────────┴──────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────────────────┘
```

---

## 5. Estructura del archivo Figma

| Página | Contenido | Fase |
|---|---|---|
| `00 · Cover` | Portada, versión, alcance, leyenda de roles | 1 |
| `01 · Foundations` | Variables (color, espacio, radios, elevación), estilos de texto, iconografía, retícula y reglas de uso | 1 |
| `02 · Components` | Librería completa con variantes (ver §7) | 2 |
| `03 · Flows` | Mapa de flujos por rol (estudiante, técnico, supervisor, admin) y matriz rol × pantalla | 1 |
| `04 · Estudiante` | P1, P2, P3, P4, P5-a, P9, P10, P16 | 3–5 |
| `05 · Técnico y Supervisor` | P5-b, P5-c, P6, P7, P8, P11, P5-d (auditoría) | 4 |
| `06 · Administrador` | P12, P13, P14, P15 | 5 |
| `07 · States` | Vacío, carga, error 403/404/409, 429, confirmación, toast, primer ingreso | 3–5 |
| `08 · Handoff` | Anotaciones por pantalla: endpoint, campos, roles, estados, copy, medidas | 5 |

**Limpieza previa (Fase 1):** eliminar la página `pagina-prueba` (`13:2`), creada solo para verificar la escritura del MCP.

**Páginas compartidas entre fases.** `04 · Estudiante` recibe además P9 y P10 (Fase 4) y P16 (Fase 5), porque son vistas comunes a todos los roles. `07 · States` se llena a medida que cada fase produce sus estados. `06 · Administrador` ya existe desde la Fase 1 y se completa en la Fase 5.

**Convenciones de nombres**
- Frames: `P03 · Mis solicitudes — Estudiante`
- Componentes: `Button / Primary`, `Badge / Status / En atención`, `Table / Row`
- Variables: `color/…`, `space/…`, `radius/…`, `elev/…`
- Variantes: propiedades en español (`Tamaño`, `Estado`, `Rol`), no combinaciones de nombres sueltos.

---

## 6. Pantallas (16 frames principales)

Todas a 1440 × 1024; P1 y P2 también a 1280 para comprobar el mínimo. Ninguna vista móvil (fuera de alcance).

| # | Pantalla | Rol | Endpoint(s) | HU | Fase |
|---|---|---|---|---|---|
| P1 | Iniciar sesión | público | `POST /auth/login` | HU-01 | 3 |
| P2 | Cambio de contraseña obligatorio | todos | `PATCH /auth/password` | HU-01/02 | 3 |
| P3 | Mis solicitudes | ESTUDIANTE | `GET /requests` | HU-04 | 3 |
| P4 | Registrar solicitud | ESTUDIANTE | `GET /catalogs/categories`, `POST /requests` | HU-03 | 3 |
| P5 | Detalle de solicitud (4 variantes: estudiante con encuesta, técnico, supervisor con acciones, supervisor con auditoría) | EST/TEC/SUP | `GET /requests/{id}`, `/history`, `/comments`, `/audit-events`, `POST /survey` | HU-05/06/19/20 | 3 (estudiante) / 4 (técnico y supervisor) |
| P6 | Mi bandeja | TÉCNICO | `GET /requests` | HU-09/10 | 4 |
| P7 | Gestión de área + panel de asignación | SUPERVISOR | `GET /requests`, `GET /eligible-technicians`, `POST /assignments`, `PATCH /requests/{id}`, `PATCH /requests/{id}/status` | HU-07/08/11 | 4 |
| P8 | Dashboard de indicadores | SUP/ADMIN | `GET /dashboard/summary`, `GET /dashboard/reports` | HU-12/13/14 | 4 |
| P9 | Reservar ambiente | todos | `GET /spaces`, `GET /spaces/{id}/availability`, `POST /reservations` | HU-21/22 | 4 |
| P10 | Mis reservas | todos | `GET /reservations?vista=propias`, `PATCH /reservations/{id}/status` | HU-24 | 4 |
| P11 | Aprobación de reservas | SUP/ADMIN | `GET /reservations?vista=gestion`, `PATCH /reservations/{id}/status` | HU-23 | 4 |
| P12 | Administración de usuarios | ADMIN | `GET/POST/PATCH /admin/users`, `GET /admin/roles` | HU-15 | 5 |
| P13 | Catálogos (4 tabs: áreas, categorías, prioridades, estados) | ADMIN | `/admin/catalogs/*` | HU-16/17 | 5 |
| P14 | Políticas SLA | ADMIN | `/admin/sla-policies` | HU-18 | 5 |
| P15 | Espacios, horarios y política de reservas | ADMIN | `/admin/spaces`, `/space-types`, `/{id}/schedule`, `/reservation-policy` | HU-25 | 5 |
| P16 | Perfil y contraseña | todos | sesión + `PATCH /auth/password` | HU-01 | 5 |

### 6.1 Contenido obligatorio por pantalla

- **P1 Login:** correo, contraseña, mostrar/ocultar, CTA "Ingresar", error inline "Correo o contraseña incorrectos" (nunca revela cuál falló), estado `429` con enfriamiento. Marca "Universidad Actúa / UniService". Sin registro público (no hay endpoint).
- **P2 Primer ingreso:** modal bloqueante no descartable; contraseña actual, nueva, confirmación, reglas visibles; aviso de que se cierran las demás sesiones.
- **P3 Mis solicitudes:** columnas `código, categoría, estado, prioridad, fecha` (exacto a HU-04). CTA "Registrar nueva solicitud". Estado vacío con el copy literal de HU-04: *"Aún no tienes solicitudes registradas"* + CTA.
- **P4 Registrar:** 3 campos obligatorios (`categoría`, `ubicación`, `descripción`), labels visibles, validación por campo, contador de caracteres, nota de que la prioridad la asigna la categoría. Un solo paso (HU-03 exige ≤3 pasos desde login).
- **P5 Detalle:** bloque de datos (código, solicitante, categoría, área, ubicación, descripción, prioridad, fecha, responsable o **"Sin asignar"**) + historial cronológico + comentarios + pestaña Auditoría (solo supervisor). Variante estudiante: encuesta de 1–5 solo en `CERRADO`, una vez. Variante supervisor: acciones Cerrar / Rechazar (motivo obligatorio).
- **P6 Mi bandeja:** mismas columnas + SLA visible; orden fijo por prioridad desc y fecha asc (el servidor lo impone, no se dibuja control de orden). Acciones: "Iniciar atención" (`ASIGNADO→EN_PROCESO`), "Marcar resuelta" (`EN_PROCESO→RESUELTO`). Sin acciones de supervisor.
- **P7 Gestión:** filtros `Estado`, `Categoría`, `Prioridad` + "Limpiar"; panel lateral de asignación con técnicos elegibles (`eligible-technicians`), prioridad opcional y confirmación; bloqueo de acciones en estados terminales (`CERRADO`/`RECHAZADO`).
- **P8 Dashboard:** rango `fechaDesde/fechaHasta` (UTC, mostrado en `America/Lima`), `área` (admin) y exportación CSV `solicitudes`/`indicadores`. Los 9 indicadores reales: franja de ciclo con `registradas / pendientes / atendidas`; tarjetas `promedioHorasAtencion`, `porcentajeResueltas`, `vencidas` (con **"No disponible"** cuando `disponible:false`), `por categoría`, `por prioridad`, `por responsable`. Sin métricas inventadas.
- **P9 Reservar:** catálogo de espacios con `tipoEspacio`, `pabellón`, `capacidad`; selector de fecha; disponibilidad con franjas `libres` vs `ocupadas`; formulario `fecha, horaInicio, horaFin, motivo, numAsistentes`; reglas de política visibles (30–240 min, 1 h de anticipación, 30 días, 2 reservas activas/día). Confirmación con el copy de HU-22: *"Reserva registrada, pendiente de aprobación"* + código `RES-AAAA-NNNNNN`.
- **P10 Mis reservas:** `código, espacio, fecha, horario, estado`; cancelar solo `PENDIENTE`/`CONFIRMADA` y antes del inicio, con confirmación.
- **P11 Aprobación:** `vista=gestion`, aprobar/rechazar con `motivo` obligatorio al rechazar; impedir aprobar la propia reserva.
- **P12 Usuarios:** tabla `nombreCompleto, correo, rol, área, activo`; alta con `áreaId` obligatorio para `TECNICO`/`SUPERVISOR`; edición en panel lateral; baja lógica `activo:false` con confirmación que advierte la revocación de sesiones.
- **P13 Catálogos:** tabs. Áreas (`código, nombre, activo`), categorías (`código, nombre, área, prioridad predeterminada, activo`), prioridades (`código, nombre, nivel, color`), estados (solo `nombre` editable, `código` bloqueado con candado visual y `esFinal`).
- **P14 SLA:** tabla `categoría/prioridad, horasObjetivo, horasAviso, vigencia, activo` + formulario con alcance exclusivo (categoría **o** prioridad). Nota visible: la categoría tiene precedencia sobre la prioridad.
- **P15 Espacios:** tabla + alta/edición; editor de horario semanal (lun–dom, apertura/cierre, validación cierre > apertura y sin solapamiento); formulario de política de reservas (5 campos obligatorios).
- **P16 Perfil:** datos de solo lectura desde la sesión (nombre, correo, rol, área) + cambio de contraseña. Sin edición de perfil (no hay endpoint).

---

## 7. Librería de componentes

Cada componente con variantes y estados completos (default / hover / foco / pressed / disabled / loading / error), dentro del único modo de color.

| Grupo | Componentes |
|---|---|
| Navegación | `Sidebar` (expandida/colapsada), `Nav Item` (activo/inactivo, con riel amarillo), `Topbar`, `User Menu`, `Page Header`, `Tabs` |
| Acciones | `Button` (Primary, Secondary, Ghost, Danger × tamaños × estados), `Icon Button`, `Link` |
| Formularios | `Input`, `Textarea`, `Select`, `Combobox`, `Date Picker`, `Date Range`, `Checkbox`, `Radio`, `Switch`, `Field` (label + hint + error), `Search` (solo componente; no se usa en tablas) |
| Datos | `Table` (header, row, cell, riel de prioridad, selección), `Pagination`, `Badge / Status`, `Badge / Priority`, `Badge / SLA`, `Avatar`, `User Chip`, `Key Value` |
| Contenedores | `Card`, `KPI Card`, `Panel`, `Side Panel`, `Modal`, `Confirm Dialog`, `Toast`, `Inline Alert`, `Empty State`, `Skeleton` |
| Dominio | `Request Summary Row`, `History Item`, `Comment Item`, `Audit Row`, `Availability Slot`, `Chart / Bar H`, `Chart / Bar V`, `Chart / Donut`, `Lifecycle Strip` |

Notas de accesibilidad de la librería: anillo de foco `2 px` `color/info` con offset 2 px en todos los interactivos; estados nunca solo por color; `Icon Button` siempre con etiqueta visible o tooltip + nombre accesible.

---

## 8. Estados transversales y copy

- **Vacío:** título + una frase de dirección + CTA. Ej. P3: *"Aún no tienes solicitudes registradas"* / botón "Registrar nueva solicitud".
- **Carga:** skeleton con la misma retícula (sin layout shift).
- **Error:** parseo de `application/problem+json` → se muestra `detail`, y `codigo` en un renglón secundario (`FRANJA_OCUPADA`, `CAMBIO_CONTRASENA_REQUERIDO`). `404` se presenta como *"No encontramos esta solicitud o no tienes acceso"*.
- **Conflicto `409`:** banner en el contexto de la acción, no un toast genérico.
- **Confirmaciones:** destructivas (rechazar, desactivar usuario, cancelar reserva) piden motivo o confirmación explícita; verbos consistentes ("Rechazar" → "Solicitud rechazada").

---

## 9. Decisión de color: light-only

El sistema se diseña en un solo modo (claro). Motivos:

1. El producto es una mesa de ayuda interna usada en horario de oficina; el tema oscuro no resuelve un problema real de sus usuarios.
2. No existe endpoint de preferencia de tema ni toggle en el frontend: hoy solo hay `@media (prefers-color-scheme: dark)`, así que el modo oscuro lo impondría el sistema operativo, no la persona.
3. Duplicarlo en Figma obliga a revisar contraste estado por estado en 16 pantallas, sin beneficio de producto.

Es un **desvío consciente** de `DESIGN.md` (`themes.dark`) y del checklist de `AGENTS.md`. Se documenta aquí y en el handoff para que quede trazado, no como olvido.

**Si más adelante se pide:** los tokens ya están declarados como variables de Figma en un único modo; agregar `Dark` es añadir un mode y ajustar las superficies y los tints de badge (los sólidos pierden contraste sobre fondo oscuro), no redibujar pantallas.

---

## 10. Handoff

En `08 · Handoff`, por pantalla: endpoint + campos usados, rol y alcance (recordando que fuera de alcance el backend responde `404`), estados cubiertos, copy final, medidas (sidebar, topbar, paddings, alturas) y notas de interacción (qué ocurre al asignar, al cerrar, al exportar). Sin código, solo especificación visual y de comportamiento.

---

## 11. Plan de ejecución en 5 fases

Cada fase cierra en una página de Figma revisable y no se abre la siguiente mientras quede un criterio de cierre pendiente. El avance se marca en `checklist-fases.md`.

| Fase | Objetivo | Páginas | Pantallas | Depende de |
|---|---|---|---|---|
| 1 · Preparación y fundaciones | Dejar el archivo listo: acceso verificado, páginas y tokens | estructura `00`–`08`; contenido en `00`, `01`, `03` | — | MCP verificado |
| 2 · Librería de componentes | Construir todos los componentes con variantes | `02` | — | Fase 1 |
| 3 · Shell, autenticación y estudiante | Flujo estudiante completo sobre el shell real | `04`, `07` (parcial) | P1–P4, P5-estudiante | Fase 2 |
| 4 · Operación y reservas | Técnico, supervisor, dashboard y reservas | `05`, `04` (parcial), `07` (parcial) | P5-técnico/supervisor, P6–P11 | Fase 3 |
| 5 · Administración, estados y handoff | Cerrar admin, estados transversales y entrega | `04` (parcial), `06`, `07`, `08` | P12–P16 | Fase 4 |

### Fase 1 — Preparación y fundaciones

**Objetivo.** Dejar GESTAL-V2 listo para dibujar: acceso comprobado, páginas creadas y sistema visual publicado.

**Alcance.** `00 · Cover`, `01 · Foundations`, `03 · Flows`.

**Tareas.**

1. Verificar permisos leyendo las páginas y creando/eliminando un nodo temporal.
2. Eliminar la página `pagina-prueba` (`13:2`) usada para probar la escritura.
3. Crear las páginas `UniService · 00` a `UniService · 08` (§5).
4. `01 · Foundations`: variables de color de §4.1 en un único modo; `space/4…48`, `radius/sm|md|lg|full`, `elev/0|1|2`; los 8 estilos de texto Inter de §4.2; retícula de 12 columnas con gutter 24 y las reglas de la regla de oro del amarillo.
5. `00 · Cover`: portada, versión, alcance (16 pantallas, solo escritorio, light-only) y leyenda de roles.
6. `03 · Flows`: mapa de flujos por rol y matriz rol × pantalla.

**Criterio de cierre.** Las 9 páginas existen con el prefijo; variables y estilos publicados; cero valores hex sueltos fuera de `01`; cover legible y matriz sin celdas vacías.

**Riesgo.** Que `0:1` (`gestal-figma`) ya tenga contenido y las páginas nuevas dupliquen estilos. *Mitigación:* inspeccionar `0:1` antes de crear nada y no renombrar ni reorganizar lo existente.

### Fase 2 — Librería de componentes

**Objetivo.** Tener en `02 · Components` todos los componentes con variantes y estados, listos para instanciar.

**Alcance.** `02 · Components`, en dos bloques internos.

**Tareas.**

1. **2a · Núcleo.** Navegación (`Sidebar`, `Nav Item`, `Topbar`, `User Menu`, `Page Header`, `Tabs`); acciones (`Button` Primary/Secondary/Ghost/Danger × tamaños × estados, `Icon Button`, `Link`); formularios (`Input`, `Textarea`, `Select`, `Combobox`, `Date Picker`, `Date Range`, `Checkbox`, `Radio`, `Switch`, `Field`, `Search`); datos (`Badge / Status`, `Badge / Priority`, `Badge / SLA`, `Avatar`, `User Chip`, `Key Value`, `Pagination`); contenedores (`Card`, `KPI Card`, `Panel`, `Side Panel`, `Modal`, `Confirm Dialog`, `Toast`, `Inline Alert`, `Empty State`, `Skeleton`).
2. **2b · Dominio.** `Table` (header, row, cell, riel de prioridad, selección), `Request Summary Row`, `History Item`, `Comment Item`, `Audit Row`, `Availability Slot`, `Chart / Bar H`, `Chart / Bar V`, `Chart / Donut`, `Lifecycle Strip`.
3. Estados por componente: default, hover, foco, pressed, disabled, loading y error; anillo de foco 2 px `color/info` con offset 2.
4. Propiedades de variante en español (`Tamaño`, `Estado`, `Rol`).

**Criterio de cierre.** Toda variante existe y está nombrada; ningún badge depende solo del color; foco visible en el 100 % de los interactivos; ninguna pantalla futura necesitará estilos sueltos.

**Riesgo.** Explosión de variantes (botones × estados × tamaños). *Mitigación:* variantes solo donde el diseño las usa; el resto se resuelve con instancias y override de texto.

### Fase 3 — Shell, autenticación y flujo estudiante

**Objetivo.** Validar la librería sobre pantallas reales con el flujo de estudiante de punta a punta.

**Alcance.** `04 · Estudiante`; `07 · States` parcial.

**Tareas.**

1. Componer el shell (sidebar 224/60 + topbar 60) con instancias de la librería.
2. P1 Iniciar sesión, con error inline y estado `429`.
3. P2 Cambio de contraseña obligatorio (modal bloqueante).
4. P3 Mis solicitudes, con estado vacío y paginación.
5. P4 Registrar solicitud (un solo paso).
6. P5 variante estudiante, con encuesta en `CERRADO`.
7. `07 · States`: vacío, carga y error de estas pantallas.

**Criterio de cierre.** 5 frames a 1440 y P1/P2 también a 1280 sin scroll horizontal; una sola CTA amarilla por pantalla; toda instancia proviene de `02`; columnas de tabla iguales a los campos de HU-04.

**Riesgo.** Que el shell cambie al llegar las pantallas de supervisor (sidebar con más ítems). *Mitigación:* `Nav Item` y `Sidebar` contemplan variantes por rol; si aparece un ítem nuevo se añade a la librería, no a la pantalla.

### Fase 4 — Operación y reservas

**Objetivo.** Cubrir el trabajo diario de técnico y supervisor y el ciclo completo de reservas.

**Alcance.** `05 · Técnico y Supervisor`; `04` (parcial, P9 y P10); `07` parcial.

**Tareas.**

1. P5 variantes técnico, supervisor con acciones y supervisor con auditoría.
2. P6 Mi bandeja, con SLA visible y acciones de estado.
3. P7 Gestión de área con panel de asignación.
4. P8 Dashboard con los 9 indicadores reales (`vencidas` muestra "No disponible" cuando `disponible:false`).
5. P9 Reservar ambiente, P10 Mis reservas y P11 Aprobación de reservas.
6. `07 · States`: `409` en contexto y confirmaciones con motivo.

**Criterio de cierre.** Cada columna de tabla corresponde a un campo real del DTO; sin buscador ni ordenamiento (C2); sin métricas inventadas; acciones bloqueadas en estados terminales.

**Riesgo.** Duplicar la tabla entre P3, P6, P7 y P11. *Mitigación:* todas usan `Table` de `02` con overrides de columna, nunca frames nuevos.

### Fase 5 — Administración, estados y handoff

**Objetivo.** Cerrar el alcance y dejar el archivo entregable.

**Alcance.** `06 · Administrador`; `04` (parcial, P16); `07 · States` completo; `08 · Handoff`.

**Tareas.**

1. P12 Usuarios, P13 Catálogos (4 tabs), P14 Políticas SLA, P15 Espacios/horarios/política y P16 Perfil.
2. `07 · States`: `403`, `404`, `409`, `429`, confirmación, toast y primer ingreso.
3. `08 · Handoff`: por pantalla endpoint, campos, rol, estados, copy, medidas y notas; anotar el desvío light-only (C5) y las deudas C2/C3.
4. Revisión final: contraste WCAG 2.2 AA, checklist de §12 y trazabilidad HU ↔ pantalla ↔ endpoint.

**Criterio de cierre.** Las 9 páginas y los 16 frames existen; el checklist de §12 está completo; el desvío light-only y las deudas C2/C3 están anotados en `08`.

**Riesgo.** Dejar el handoff para el final y que falten decisiones. *Mitigación:* cada fase anota sus pantallas en `08` al cerrarla; la Fase 5 solo consolida y revisa.

---

## 12. Verificación

**Contraste (WCAG 2.2 AA):** cuerpo ≥ 4.5:1, texto grande y bordes de componente ≥ 3:1, medido en Figma con el plugin de contraste. Texto oscuro sobre `#FACC15` es el caso crítico: verificar `#18181B` sobre `#FACC15` (pasa) y nunca usar blanco.

**Puertas de calidad por fase** (se verifican al cerrar cada fase; no sustituyen al checklist global):

| Fase | Puerta |
|---|---|
| 1 | 9 páginas creadas con prefijo; variables y estilos publicados; cero hex sueltos fuera de `01`; `pagina-prueba` eliminada. |
| 2 | Todas las variantes existen y están nombradas; foco visible; badges con texto; propiedades en español. |
| 3 | 5 frames a 1440 y P1/P2 a 1280 sin scroll horizontal; una CTA amarilla por pantalla; solo instancias de `02`. |
| 4 | Columnas = campos del DTO; sin buscador ni ordenamiento; `vencidas` con "No disponible"; acciones bloqueadas en estados terminales. |
| 5 | Checklist global completo; handoff trazado a HU y endpoint; contraste verificado. |

**Checklist de cierre global:**
- [ ] 16 frames a 1440; P1 y P2 también a 1280 sin scroll horizontal.
- [ ] Ningún estado depende solo del color; todo badge lleva texto.
- [ ] Foco visible en el 100 % de los interactivos; orden de tabulación documentado en las pantallas clave.
- [ ] Objetivos de puntero ≥ 24×24; acciones de fila ≥ 44 de alto.
- [ ] Números tabulares en KPIs, tablas y fechas.
- [ ] Cada columna de tabla corresponde a un campo real del DTO.
- [ ] Cero endpoints, métricas o estados inventados; sin "En evaluación"; sin buscador ni ordenamiento (C2); sin notificaciones, adjuntos ni `/me` (C3).
- [ ] `vencidas` muestra "No disponible" cuando `disponible:false`.
- [ ] Todos los tokens en un único modo; ninguna pantalla con valores sueltos.
- [ ] Toda instancia proviene de la librería; cero estilos sueltos.
- [ ] Una sola CTA amarilla por pantalla.
- [ ] Cada pantalla trazada a su HU y su endpoint en `08 · Handoff`.
- [ ] El desvío light-only (C5) aparece anotado en `08 · Handoff`.

**Prueba con el usuario:** recorrido guiado por rol (estudiante registra → supervisor asigna → técnico atiende → supervisor cierra → estudiante encuesta) sobre los frames, y ajuste de lo que no se lea sin explicación.

---

## 13. Fuera de alcance

Código, componentes implementados, modo oscuro, modo móvil/tablet, notificaciones, adjuntos, edición de perfil, buscador y ordenamiento de tablas, reapertura de solicitudes y cualquier endpoint no presente en el contrato.
