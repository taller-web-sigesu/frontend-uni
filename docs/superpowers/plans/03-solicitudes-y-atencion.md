# Fase 03 · Solicitudes, evidencias y atención — Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** implementar registro, consulta, detalle, comentarios, evidencias, bandeja del técnico, gestión del supervisor, transiciones, auditoría, encuesta e inicio por rol (HU-03 a HU-11, HU-19, HU-20 y HU-26).

**Arquitectura:** un solo adaptador `requestsApi.js` cubre `/requests/**`; las categorías y sus nombres vienen de `src/services/catalogs.js` (fase 01). El detalle `/solicitudes/:id` es una sola pantalla compuesta por secciones; las acciones visibles salen de la función pura `availableActions(solicitud, usuario)`, así que la regla de transiciones se prueba sin la interfaz. Ante un `409`, el detalle recarga y recalcula las acciones. Los nombres de categoría se resuelven con el catálogo, y los de prioridad con `pendingContract`.

**Tecnologías:** las de la fase 01.

**Especificación:**
- HU-03 a HU-06 y HU-26 (`EP-02-Solicitudes`), HU-07 a HU-11 (`EP-03-Ciclo-Vida`), HU-19 y HU-20 (`EP-06-SLA-Auditoria`) en `../infra-uni/docs/requirements/user-stories/`. Rol Docente igual que Estudiante (`../infra-uni/docs/decisiones/decisiones-02.md`).
- `../backend-uni/docs/api/solicitudes.md`, `atencion.md` y `calidad-servicio.md` (auditoría y encuesta).
- Figma: [P03 Lista](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=50-18), [P04 Alta](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=54-89), [P05 Detalle](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=54-162), [P06 Bandeja](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=65-2), [P07 Gestión](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=65-122), [Detalle y auditoría](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=17-7), [Inicio estudiante](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=142-367), [Inicio técnico](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=230-2) y la galería al final.
- Depende de la [fase 02](02-acceso-sesion-y-perfil.md). Versión anterior: commit `46f8cf9`.

## Restricciones globales

Rigen las de la [fase 01](01-base-visual-y-api-simulada.md#restricciones-globales-aplican-a-las-seis-fases). Además:

- Estados: `NUEVO`, `ASIGNADO`, `EN_PROCESO`, `RESUELTO`, `CERRADO`, `RECHAZADO`; terminales: `CERRADO` y `RECHAZADO`.
- Transiciones por `PATCH /requests/{id}/status`: técnico asignado `ASIGNADO → EN_PROCESO` y `EN_PROCESO → RESUELTO`; supervisor del área `RESUELTO → CERRADO` y `NUEVO|ASIGNADO|EN_PROCESO → RECHAZADO` con `motivo` obligatorio. Nunca enviar `ASIGNADO` por esa ruta: se asigna con `POST /requests/{id}/assignments`.
- El administrador no usa `/requests/**` (`403`): su inicio no lista solicitudes.
- Evidencias: JPG, PNG o PDF; de 1 byte a 5 MB (5 242 880 bytes); máximo 5 vigentes; campo multipart `archivo`. Solo en estados no terminales; eliminar solo si `puedeEliminar`. Mensajes del servidor tal cual: «Solo se aceptan archivos JPG, PNG o PDF.», «El tamaño máximo es 5 MB.» y «El archivo está vacío.». `409 LIMITE_EVIDENCIAS`: «Ya hay 5 evidencias. Elimina una para adjuntar otra.» `409 SOLICITUD_FINALIZADA`: «La solicitud ya está cerrada o rechazada.»
- Textos de HU: «Mis solicitudes», «Registrar nueva solicitud», «Registrar solicitud», «Aún no tienes solicitudes registradas», «Detalle y seguimiento de solicitud», «Publicar comentario», «Asignar responsable», «Sin asignar», «Cerrar solicitud», «Rechazar solicitud», «Gestión de área», «Evidencias», «Eliminar».
- Conflicto `409` en transiciones o asignaciones: «La solicitud cambió mientras la revisabas. Se cargó su estado actual.»

## Foco de revisión

1. **Alta con evidencias en la que falla un archivo.** La solicitud ya existe: se abre su detalle y se informa qué archivos no se adjuntaron y por qué, sin duplicar la solicitud. Prueba `NewRequestPage › informa archivos fallidos tras crear la solicitud` (tarea 3).
2. **Acción sobre una solicitud que otro actor cambió.** Un `409` recarga el detalle y oculta las acciones que ya no aplican. Prueba `TransitionActions › recarga y recalcula tras 409` (tarea 6).
3. **Solicitud fuera de alcance por enlace directo.** Un `404` muestra «No encontramos esta solicitud o no tienes acceso a ella», sin distinguir entre ambos casos. Prueba `RequestDetailPage › 404 muestra el estado no encontrada` (tarea 4).
4. **Encuesta ya respondida al recargar,** sin marca en el contrato. Si `surveyAnswered` devuelve `null`, el formulario se muestra; un `409` lo reemplaza por «Ya respondiste esta encuesta». Prueba `SurveySection › 409 marca la encuesta como respondida` (tarea 7).
5. **Comentario de solo espacios.** No se envía y se muestra «Escribe un comentario». Prueba `CommentsSection › rechaza texto en blanco` (tarea 4).

---

## Estructura de archivos

```text
src/features/requests/requestsApi.js       # adaptador /requests/**
src/features/requests/availableActions.js  # regla pura de acciones por rol y estado
src/features/requests/attachmentRules.js   # validación local de archivos
src/features/requests/MyRequestsPage.jsx
src/features/requests/NewRequestPage.jsx
src/features/requests/RequestDetailPage.jsx
src/features/requests/detail/RequestSummary.jsx
src/features/requests/detail/HistoryTimeline.jsx
src/features/requests/detail/CommentsSection.jsx
src/features/requests/detail/AttachmentsSection.jsx
src/features/requests/detail/SurveySection.jsx
src/features/management/detail/TransitionActions.jsx
src/features/management/detail/AssignDialog.jsx
src/features/management/detail/PriorityControl.jsx
src/features/management/detail/AuditPanel.jsx
src/features/management/TechnicianInboxPage.jsx
src/features/management/AreaManagementPage.jsx
src/features/home/RequestsPreview.jsx      # sección del inicio creada vacía en la fase 01
src/mocks/handlers/requests.js
```

---

### Task 1: Adaptador de solicitudes y mocks

**Archivos:**
- Crear: `src/features/requests/requestsApi.js`, `src/mocks/handlers/requests.js`
- Modificar: `src/mocks/db.js` (solicitudes en todos los estados para Ana y Pedro, asignaciones de los técnicos de TI, comentarios, historial, eventos de auditoría y 1 evidencia), `src/mocks/handlers/index.js`
- Prueba: `src/features/requests/requestsApi.test.js`

**Interfaces:**
- Consume: `request`, `listEnabledCategories`, `useCatalogLabels` (fase 01), sesión simulada (fase 02).
- Produce (todas devuelven el JSON del contrato; `signal` opcional al final):
  - `listRequests({ page, size, estado, categoriaId, prioridadId })`, `getRequest(id)`, `createRequest({ categoriaId, ubicacion, descripcion })`.
  - `listHistory(id, { page })`, `listComments(id, { page })`, `addComment(id, contenido)`.
  - `listAttachments(id)`, `uploadAttachment(id, file)`, `downloadAttachment(id, attachmentId) -> {blob, filename}`, `deleteAttachment(id, attachmentId)`.
  - `listEligibleTechnicians(id)`, `assign(id, { tecnicoId, prioridadId })`, `changePriority(id, prioridadId)`, `changeStatus(id, { estado, motivo })`.
  - `listAuditEvents(id, { page })`, `submitSurvey(id, { calificacion, comentario })`.
  - Mock: aplica el alcance del contrato por rol (propietario, técnico con asignación vigente, supervisor del área; administrador → 403 en todo `/requests`), las transiciones de las Restricciones con 409 para las inválidas, `400 USAR_ASIGNACION` ante `ASIGNADO`, 404 fuera de alcance y las reglas de evidencias por tamaño y cantidad.

- [ ] **Paso 1: Crear la rama y escribir las pruebas**

```bash
git switch main && git pull && git switch -c feature/frontend-fase-03-solicitudes
```

```js
test('el estudiante lista solo sus solicitudes', ...) // como ana.demo: todos los items con solicitante Ana (vía getRequest)
test('el técnico recibe solo asignaciones vigentes', ...)
test('el supervisor filtra por estado', ...) // listRequests({estado:'NUEVO'}) → todos NUEVO; la query lleva estado=NUEVO
test('el administrador recibe 403 en /requests', ...)
test('createRequest devuelve 201 con código SOL-', ...)
test('changeStatus a ASIGNADO devuelve 400 USAR_ASIGNACION', ...)
test('getRequest fuera de alcance devuelve 404', ...)
test('uploadAttachment envía multipart con el campo archivo', ...) // el handler lee formData.get('archivo')
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/requests`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces.

- [ ] **Paso 4: Verificar**

Run: `npm test -- src/features/requests`
Expected: 8 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/requests src/mocks
git commit -m "feat(frontend): adaptador de solicitudes y mocks por rol"
```

---

### Task 2: Regla de acciones y validación de archivos

**Archivos:**
- Crear: `src/features/requests/availableActions.js`, `src/features/requests/attachmentRules.js`
- Prueba: `src/features/requests/availableActions.test.js`, `src/features/requests/attachmentRules.test.js`

**Interfaces:**
- Produce:
  - `availableActions(solicitud, usuario) -> Set<'INICIAR'|'RESOLVER'|'CERRAR'|'RECHAZAR'|'ASIGNAR'|'REASIGNAR'|'CAMBIAR_PRIORIDAD'|'COMENTAR'|'ADJUNTAR'|'VER_AUDITORIA'|'RESPONDER_ENCUESTA'>`.
    - `INICIAR`: `TECNICO`, `responsableActual.id === usuario.id`, estado `ASIGNADO`. `RESOLVER`: lo mismo con `EN_PROCESO`.
    - `CERRAR`: `SUPERVISOR` con `RESUELTO`. `RECHAZAR`: `SUPERVISOR` con `NUEVO|ASIGNADO|EN_PROCESO`.
    - `ASIGNAR` (sin responsable) o `REASIGNAR` (con responsable): `SUPERVISOR` y estado no terminal.
    - `CAMBIAR_PRIORIDAD`: `SUPERVISOR` y estado no terminal. `VER_AUDITORIA`: `SUPERVISOR`.
    - `COMENTAR`: cualquiera que vea el detalle. `ADJUNTAR`: estado no terminal.
    - `RESPONDER_ENCUESTA`: `ESTUDIANTE|DOCENTE`, `solicitante.id === usuario.id`, estado `CERRADO` y `surveyAnswered(solicitud) !== true`.
  - `validateFiles(files: File[], vigentes: number) -> { valid: File[], rejected: [{ file, reason }] }`: tipo por MIME o extensión (`.jpg`, `.jpeg`, `.png`, `.pdf`), tamaño de 1 a 5 242 880 bytes, y corta en `5 - vigentes`; motivos con los mensajes de las Restricciones (el servidor sigue validando por contenido).

- [ ] **Paso 1: Escribir las pruebas**

```js
// tabla de casos con test.each
test.each([
  ['TECNICO asignado', 'ASIGNADO', ['INICIAR', 'COMENTAR', 'ADJUNTAR']],
  ['TECNICO asignado', 'EN_PROCESO', ['RESOLVER', 'COMENTAR', 'ADJUNTAR']],
  ['TECNICO no asignado', 'ASIGNADO', ['COMENTAR', 'ADJUNTAR']],
  ['SUPERVISOR', 'NUEVO', ['ASIGNAR', 'RECHAZAR', 'CAMBIAR_PRIORIDAD', 'VER_AUDITORIA', 'COMENTAR', 'ADJUNTAR']],
  ['SUPERVISOR', 'RESUELTO', ['CERRAR', 'REASIGNAR', 'CAMBIAR_PRIORIDAD', 'VER_AUDITORIA', 'COMENTAR', 'ADJUNTAR']],
  ['SUPERVISOR', 'CERRADO', ['VER_AUDITORIA', 'COMENTAR']],
  ['ESTUDIANTE propietario', 'CERRADO', ['RESPONDER_ENCUESTA', 'COMENTAR']],
  ['DOCENTE propietario', 'CERRADO', ['RESPONDER_ENCUESTA', 'COMENTAR']],
  ['ESTUDIANTE propietario', 'RECHAZADO', ['COMENTAR']],
])('%s en %s', ...);
test('encuesta ya respondida no se ofrece', ...) // encuestaRespondida: true → sin RESPONDER_ENCUESTA
test('validateFiles rechaza tipo, tamaño y vacío con el mensaje del servidor', ...)
test('validateFiles corta en el límite de 5 vigentes', ...) // vigentes 4, 3 archivos válidos → valid 1, rejected 2 con mensaje de límite
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/requests/availableActions.test.js src/features/requests/attachmentRules.test.js`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 12 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/requests/availableActions.* src/features/requests/attachmentRules.*
git commit -m "feat(frontend): regla de acciones por rol y validación local de evidencias"
```

---

### Task 3: Mis solicitudes y registro con evidencias

**Archivos:**
- Crear: `src/features/requests/MyRequestsPage.jsx`, `src/features/requests/NewRequestPage.jsx`, `src/features/requests/index.js`
- Modificar: `src/app/routes.jsx`
- Prueba: `src/features/requests/MyRequestsPage.test.jsx`, `src/features/requests/NewRequestPage.test.jsx`

**Interfaces:**
- Consume: `listRequests`, `createRequest`, `uploadAttachment`, `listEnabledCategories`, `useCatalogLabels`, `validateFiles`, `useResource`, `useSubmit`, `DataTable`, `Pagination`, `EmptyState`, `ErrorState`.
- Produce:
  - `MyRequestsPage` (P03, título «Mis solicitudes»): columnas código, categoría, prioridad, estado (`Badge` con `REQUEST_STATUS_LABELS`) y fecha (`formatDateTime`); fila → `/solicitudes/:id`; botón «Registrar nueva solicitud»; vacío «Aún no tienes solicitudes registradas» con la misma acción; paginación del servidor.
  - `NewRequestPage` (P04, «Registrar solicitud»): «Categoría» (`SelectField` con categorías habilitadas), «Ubicación», «Descripción» (obligatorios, sin solo espacios) y «Evidencias (opcional)» (`input type=file multiple accept=".jpg,.jpeg,.png,.pdf"`) con lista de archivos elegidos y su motivo de rechazo. Al enviar: `createRequest`; luego `uploadAttachment` de cada archivo válido en secuencia; navegar a `/solicitudes/:id` con `state: { creada: codigo, fallidas: [{ nombre, motivo }] }`.
  - El detalle (tarea 4) muestra «Solicitud <código> registrada» y, si hay `fallidas`, una alerta con cada nombre y su motivo.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('lista con etiquetas legibles y abre el detalle', ...)
test('estado vacío ofrece registrar', ...)
test('cambiar de página pide page=1', ...)
test('error de carga muestra Reintentar y recupera', ...)
test('no envía con campos vacíos o solo espacios', ...)
test('registra y abre el detalle con el código', ...)
test('sube cada evidencia tras crear la solicitud', ...) // 2 archivos → 2 POST /attachments después de POST /requests
test('informa archivos fallidos tras crear la solicitud', ...) // 2.º upload 400 → state.fallidas con el mensaje del servidor; un solo POST /requests
test('un archivo .exe se rechaza antes de enviar', ...)
test('doble clic en Registrar crea una sola solicitud', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/requests/MyRequestsPage.test.jsx src/features/requests/NewRequestPage.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces y P03/P04.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 10 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/requests src/app/routes.jsx
git commit -m "feat(frontend): mis solicitudes y registro de solicitud con evidencias"
```

---

### Task 4: Detalle, historial y comentarios

**Archivos:**
- Crear: `src/features/requests/RequestDetailPage.jsx`, `detail/RequestSummary.jsx`, `detail/HistoryTimeline.jsx`, `detail/CommentsSection.jsx`
- Prueba: `src/features/requests/RequestDetailPage.test.jsx`

**Interfaces:**
- Consume: `getRequest`, `listHistory`, `listComments`, `addComment`, `availableActions`, `useCatalogLabels`.
- Produce:
  - `RequestDetailPage` (título «Detalle y seguimiento de solicitud»): carga en paralelo solicitud, historial y comentarios (`Promise.all` dentro de un solo `useResource`, o tres `useResource` iniciados juntos); expone `reload()` a las secciones; `404` → «No encontramos esta solicitud o no tienes acceso a ella» con enlace a la lista del rol.
  - `RequestSummary`: código, estado, categoría, prioridad, área, solicitante, ubicación, descripción, responsable actual o «Sin asignar»; en terminales «Último responsable»; SLA con `estado`, `fechaAviso` y `fechaLimite` formateados.
  - `HistoryTimeline`: orden cronológico con estado anterior → nuevo, fecha y motivo.
  - `CommentsSection`: lista con autor y fecha; `TextArea` «Comentario» y botón «Publicar comentario»; texto en blanco → «Escribe un comentario» sin petición; tras `201` añade el comentario devuelto y limpia el campo; si falla conserva el texto.
  - Ranura para las secciones de las tareas 5 a 7: `AttachmentsSection`, `SurveySection`, `TransitionActions`, `AuditPanel` se renderizan según `availableActions`.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('muestra resumen, historial y comentarios', ...)
test('404 muestra el estado no encontrada', ...)
test('responsable nulo muestra Sin asignar', ...)
test('rechaza texto en blanco', ...) // '   ' → 'Escribe un comentario', 0 POST /comments
test('publica y muestra el comentario con autor', ...)
test('si falla la publicación conserva el texto', ...)
test('muestra el aviso de solicitud registrada y los archivos fallidos', ...) // location.state del alta
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/requests/RequestDetailPage.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces y P05.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 7 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/requests
git commit -m "feat(frontend): detalle de solicitud con historial y comentarios"
```

---

### Task 5: Evidencias en el detalle

**Archivos:**
- Crear: `src/features/requests/detail/AttachmentsSection.jsx`
- Prueba: `src/features/requests/detail/AttachmentsSection.test.jsx`

**Interfaces:**
- Consume: `listAttachments`, `uploadAttachment`, `downloadAttachment`, `deleteAttachment`, `validateFiles`, `formatBytes`, `downloadBlob` (fase 01), `ConfirmDialog`.
- Produce:
  - `AttachmentsSection({ requestId, canAttach })` («Evidencias»): lista con nombre, tamaño, autor y fecha; botón «Descargar» por fila (usa `request` con Bearer, no un enlace directo); «Eliminar» solo si `puedeEliminar`, con confirmación; con `canAttach`, selector de archivo que valida, sube y recarga la lista; errores por archivo con el mensaje del servidor; 5 vigentes → selector deshabilitado con el texto del límite.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('lista evidencias con nombre, tamaño, autor y fecha', ...) // '2 MB'
test('adjunta un archivo válido y recarga', ...)
test('muestra el mensaje del servidor cuando rechaza el contenido', ...) // 400 campo archivo 'Solo se aceptan archivos JPG, PNG o PDF.'
test('con 5 evidencias deshabilita el selector', ...)
test('solo el autor ve Eliminar y debe confirmar', ...)
test('en solicitud cerrada no ofrece adjuntar pero permite descargar', ...)
test('descargar usa downloadBlob con el nombre del servidor', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/requests/detail/AttachmentsSection.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 7 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/requests/detail/AttachmentsSection.*
git commit -m "feat(frontend): evidencias en el detalle con carga, descarga y eliminación"
```

---

### Task 6: Acciones de técnico y supervisor, y auditoría

**Archivos:**
- Crear: `src/features/management/detail/TransitionActions.jsx`, `AssignDialog.jsx`, `PriorityControl.jsx`, `AuditPanel.jsx`
- Prueba: `src/features/management/detail/actions.test.jsx`

**Interfaces:**
- Consume: `availableActions`, `changeStatus`, `assign`, `listEligibleTechnicians`, `changePriority`, `listAuditEvents`, `pendingContract.listPriorityOptions`.
- Produce:
  - `TransitionActions({ solicitud, actions, onChanged })`: botones «Iniciar atención», «Marcar como resuelta», «Cerrar solicitud» y «Rechazar solicitud» según `actions`. Rechazar abre `ConfirmDialog` con `TextArea` «Motivo» obligatorio. Tras éxito → `onChanged()`. Ante `409` → aviso de conflicto de las Restricciones y `onChanged()`.
  - `AssignDialog({ solicitud, onAssigned })`: «Asignar responsable» o «Reasignar»; lista de `listEligibleTechnicians` y prioridad opcional si hay opciones; `409` igual que arriba.
  - `PriorityControl({ solicitud, onChanged })`: si `listPriorityOptions()` devuelve `null`, no se renderiza; si no, `SelectField` + «Guardar prioridad».
  - `AuditPanel({ requestId })`: tabla paginada de campo, valor anterior, valor nuevo, actor y fecha; solo se monta con `VER_AUDITORIA`.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('el técnico inicia desde ASIGNADO y resuelve desde EN_PROCESO', ...) // body {estado:'EN_PROCESO'} y luego {estado:'RESUELTO'}
test('el supervisor cierra desde RESUELTO', ...)
test('rechazar exige motivo', ...) // sin motivo no envía; con motivo body {estado:'RECHAZADO', motivo}
test('recarga y recalcula tras 409', ...) // onChanged llamado y aviso visible
test('asigna un técnico elegible', ...) // POST /assignments {tecnicoId:'19'}
test('el control de prioridad se oculta sin opciones', ...) // listPriorityOptions → null
test('la auditoría lista los cambios', ...)
test('nunca envía ASIGNADO por PATCH /status', ...) // ningún body con estado 'ASIGNADO' en todo el archivo de pruebas
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/management/detail`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces y los frames P05b, P05c, P05c2 y P05d.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 8 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/management/detail
git commit -m "feat(frontend): transiciones, asignación, prioridad y auditoría en el detalle"
```

---

### Task 7: Encuesta de satisfacción

**Archivos:**
- Crear: `src/features/requests/detail/SurveySection.jsx`
- Prueba: `src/features/requests/detail/SurveySection.test.jsx`

**Interfaces:**
- Consume: `submitSurvey`, `availableActions` (`RESPONDER_ENCUESTA`).
- Produce: `SurveySection({ requestId })`: grupo de radios «Calificación» de 1 a 5 (obligatorio), «Comentario (opcional)», botón «Enviar encuesta». Tras `201` o `409` reemplaza el formulario por «Gracias por tu respuesta» o «Ya respondiste esta encuesta».

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('envía la calificación elegida', ...) // body {calificacion: 4}
test('sin calificación no envía', ...)
test('409 marca la encuesta como respondida', ...)
test('no aparece en solicitudes no cerradas ni para el técnico', ...) // vía RequestDetailPage
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/requests/detail/SurveySection.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar.**

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 4 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/requests/detail/SurveySection.*
git commit -m "feat(frontend): encuesta de satisfacción en solicitudes cerradas"
```

---

### Task 8: Bandeja del técnico, gestión de área e inicio

**Archivos:**
- Crear: `src/features/management/TechnicianInboxPage.jsx`, `src/features/management/AreaManagementPage.jsx`, `src/features/management/index.js`
- Modificar: `src/features/home/RequestsPreview.jsx`, `src/app/routes.jsx`
- Prueba: `src/features/management/pages.test.jsx`, `src/features/home/RequestsPreview.test.jsx`

**Interfaces:**
- Consume: `listRequests`, `useCatalogLabels`, `pendingContract.listPriorityOptions`, `DataTable`, `Pagination`.
- Produce:
  - `TechnicianInboxPage` (`/bandeja`, P06): asignaciones vigentes en el orden del servidor (no reordenar en cliente).
  - `AreaManagementPage` (`/gestion`, P07, «Gestión de área»): filtros «Estado», «Categoría» y «Prioridad» (esta última solo si hay opciones) aplicados a la query; cambiar un filtro vuelve a `page=0`; columna responsable o «Sin asignar»; fila → detalle.
  - `RequestsPreview({ user })` (sección de `/inicio` creada en la fase 01): para `ESTUDIANTE` y `DOCENTE`, las 5 solicitudes más recientes y acceso a «Registrar nueva solicitud»; para `TECNICO`, las 5 primeras asignaciones. Enlace «Ver todas» a `/solicitudes` o `/bandeja`.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('la bandeja conserva el orden del servidor', ...)
test('gestión envía los filtros y vuelve a la página 0', ...) // en page 1, cambiar estado → query page=0&estado=...
test('una respuesta tardía de un filtro anterior no reemplaza la actual', ...)
test('inicio de estudiante y docente muestra sus solicitudes y la acción de registrar', ...)
test('inicio de técnico muestra sus asignaciones', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/management/pages.test.jsx src/features/home/RequestsPreview.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces.

- [ ] **Paso 4: Verificar**

Run: `npm test && npm run lint && npm run build`
Expected: todo en verde.

- [ ] **Paso 5: Verificación visual**

Run: `npm run dev:mock`; recorrer registro → asignación → inicio → resolución → cierre → encuesta con Ana, el supervisor de TI y el técnico de TI, a 360 y 1440 px.
Expected: coincide con P00 y P03 a P07; las filas se convierten en tarjetas a 360 px.

- [ ] **Paso 6: Commit**

```bash
git add src/features/management src/features/home/RequestsPreview.* src/app/routes.jsx
git commit -m "feat(frontend): bandeja del técnico, gestión de área e inicio por rol"
```

---

## Aceptación de la fase

- [ ] Registro, evidencias, asignación, resolución, cierre y encuesta, cubiertos por pruebas en verde.
- [ ] Comentario vacío, rechazo sin motivo, conflicto de transición, recurso fuera de alcance, evidencia inválida y encuesta ya respondida, cubiertos por pruebas.
- [ ] El ajuste de prioridad del supervisor y la marca de encuesta quedan anotados como pendientes de contrato en la [fase 06](06-integracion-y-entrega-local.md).

## Capturas de Figma

<details>
<summary>P00 · Inicio del estudiante</summary>

![P00 · Inicio del estudiante](capturas-figma/p00-inicio-estudiante.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=142-367)

</details>

<details>
<summary>P00 · Inicio del técnico</summary>

![P00 · Inicio del técnico](capturas-figma/p00-inicio-tecnico.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=230-2)

</details>

<details>
<summary>P03 · Mis solicitudes</summary>

![P03 · Mis solicitudes](capturas-figma/p03-mis-solicitudes.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=50-18)

</details>

<details>
<summary>P04 · Registrar solicitud</summary>

![P04 · Registrar solicitud](capturas-figma/p04-registrar-solicitud.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=54-89)

</details>

<details>
<summary>P05 · Detalle para estudiante</summary>

![P05 · Detalle para estudiante](capturas-figma/p05-detalle-estudiante.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=54-162)

</details>

<details>
<summary>P05b · Detalle para técnico</summary>

![P05b · Detalle para técnico](capturas-figma/p05b-detalle-tecnico.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=67-235)

</details>

<details>
<summary>P05c · Acciones del supervisor</summary>

![P05c · Acciones del supervisor](capturas-figma/p05c-detalle-supervisor.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=67-341)

</details>

<details>
<summary>P05c2 · Detalle de solicitud resuelta</summary>

![P05c2 · Detalle de solicitud resuelta](capturas-figma/p05c2-solicitud-resuelta.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=239-94)

</details>

<details>
<summary>P05d · Auditoría de la solicitud</summary>

![P05d · Auditoría de la solicitud](capturas-figma/p05d-auditoria.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=67-442)

</details>

<details>
<summary>P06 · Bandeja del técnico</summary>

![P06 · Bandeja del técnico](capturas-figma/p06-bandeja-tecnico.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=65-2)

</details>

<details>
<summary>P07 · Gestión de área</summary>

![P07 · Gestión de área](capturas-figma/p07-gestion-area.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=65-122)

</details>

<details>
<summary>P05 · Solicitud no encontrada</summary>

![P05 · Solicitud no encontrada](capturas-figma/p05-no-encontrada.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=56-77)

</details>

<details>
<summary>P05 · Confirmación de rechazo</summary>

![P05 · Confirmación de rechazo](capturas-figma/p05-confirmar-rechazo.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=69-921)

</details>
