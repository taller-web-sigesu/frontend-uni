# Fase 04 · Indicadores, usuarios, catálogos y SLA — Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** implementar el tablero de indicadores con exportación CSV, la administración de usuarios con aprobación de cuentas y restablecimiento de contraseña, los catálogos, las políticas SLA y el inicio del administrador (HU-12 a HU-18, HU-28 y HU-29).

**Arquitectura:** `features/dashboard` lee `GET /dashboard/summary` con un rango en edición separado del aplicado; el CSV se pide con los mismos filtros aplicados. `features/administration` tiene un adaptador por recurso (`usersApi`, `catalogsAdminApi`, `slaApi`) y pantallas de lista con formulario en diálogo. Un componente genérico `CatalogTable` sirve a áreas, categorías y prioridades.

**Tecnologías:** las de la fase 01. Gráficos con barras horizontales en HTML/CSS (sin biblioteca), siempre con etiqueta y valor en texto.

**Especificación:**
- HU-12 a HU-14 (`EP-04-Dashboard`), HU-15 a HU-17, HU-28 y HU-29 (`EP-05-Administracion`) y HU-18 (`EP-06-SLA-Auditoria`) en `../infra-uni/docs/requirements/user-stories/`.
- `../backend-uni/docs/api/dashboard.md`, `usuarios.md`, `catalogos.md` y `calidad-servicio.md` (SLA).
- Figma: [P08 Indicadores](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=66-134), [Inicio administrador y P12 a P14](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=17-8) y la galería al final. La bandeja de cuentas pendientes y el restablecimiento no tienen frame: usar la composición de P12.
- Depende de la [fase 02](02-acceso-sesion-y-perfil.md); los recorridos con datos reales requieren la [fase 03](03-solicitudes-y-atencion.md). Versión anterior: commit `46f8cf9`.

## Restricciones globales

Rigen las de la [fase 01](01-base-visual-y-api-simulada.md#restricciones-globales-aplican-a-las-seis-fases). Además:

- Rango inicial: mes actual de Lima (`currentMonthInLima`). Se envía con `limaDaysToUtcRange`: inicio inclusivo y fin exclusivo, en UTC.
- Supervisor: sin selector de área (el servidor usa la suya). Administrador: selector «Área» con «Todas las áreas» (sin `areaId`) y las áreas de `GET /admin/catalogs/areas`.
- Indicadores (nueve): registradas, pendientes, atendidas, por categoría, por prioridad, por responsable, promedio de horas de atención, porcentaje resuelto y vencidas/por vencer. Con `vencidas.disponible === false`, mostrar «No disponible».
- CSV: `GET /dashboard/reports?tipo=solicitudes|indicadores` + los filtros aplicados; nombre de archivo de `Content-Disposition`.
- Usuarios: `areaId` obligatorio para `TECNICO` y `SUPERVISOR`; vacío y no enviado para `ESTUDIANTE`, `DOCENTE` y `ADMINISTRADOR`. Roles de `GET /admin/roles`. La desactivación se confirma.
- Cuentas pendientes: rechazar exige motivo (hasta 500 caracteres). `409 CUENTA_NO_PENDIENTE` → recargar la bandeja.
- Restablecimiento: la contraseña temporal se muestra una sola vez en un diálogo con «Copiar» y el aviso «Esta contraseña no se volverá a mostrar». No se guarda en estado después de cerrar el diálogo. No se ofrece sobre la propia cuenta ni sobre cuentas inactivas, pendientes o rechazadas.
- Estados de solicitud: solo se edita `nombre`. Las bajas son lógicas (`activo: false`) y los registros inactivos siguen listados con badge «Inactivo».
- SLA: el alta exige exactamente una de categoría o prioridad; la edición no permite cambiar el alcance; `409` de vigencias se muestra junto al formulario. Texto de precedencia: «Si una solicitud tiene política por categoría y por prioridad, se aplica la de categoría.»

## Foco de revisión

1. **Exportar después de editar el rango sin aplicarlo.** El CSV usa el rango aplicado (el que se ve en el tablero), no el que está en edición. Prueba `DashboardPage › exporta con los filtros aplicados` (tarea 2).
2. **Rango invertido o vacío.** «Aplicar» queda deshabilitado con «La fecha final debe ser igual o posterior a la inicial», sin petición. Prueba `DashboardPage › no aplica un rango invertido` (tarea 2).
3. **Cambiar el rol de un usuario de Técnico a Estudiante.** El área desaparece del formulario y el `PATCH` envía `areaId: null`. Prueba `UserFormDialog › limpia el área al cambiar a un rol sin área` (tarea 3).
4. **Cerrar el diálogo de la contraseña temporal y volver a abrir el usuario.** La contraseña ya no aparece en ningún lugar. Prueba `ResetPasswordDialog › no conserva la contraseña al cerrar` (tarea 4).
5. **Categoría inactiva en datos históricos.** El tablero y las tablas muestran su nombre (los administradores leen el catálogo completo) o el texto de respaldo, nunca un hueco. Prueba `DashboardPage › muestra categorías sin nombre con respaldo` (tarea 2).

---

## Estructura de archivos

```text
src/features/dashboard/dashboardApi.js       # getSummary, downloadReport
src/features/dashboard/DashboardPage.jsx
src/features/dashboard/DateRangeFilter.jsx
src/features/dashboard/KpiCard.jsx
src/features/dashboard/BarList.jsx
src/features/administration/usersApi.js      # usuarios, roles, pendientes, estado de cuenta, restablecimiento
src/features/administration/catalogsAdminApi.js
src/features/administration/slaApi.js
src/features/administration/users/UsersPage.jsx
src/features/administration/users/UserFormDialog.jsx
src/features/administration/users/PendingAccountsPanel.jsx
src/features/administration/users/ResetPasswordDialog.jsx
src/features/administration/catalogs/CatalogsPage.jsx
src/features/administration/catalogs/CatalogTable.jsx
src/features/administration/catalogs/RequestStatusesTable.jsx
src/features/administration/sla/SlaPoliciesPage.jsx
src/features/home/AdminShortcuts.jsx          # sección del inicio del administrador (creada vacía en fase 01)
src/mocks/handlers/dashboard.js, admin.js
```

---

### Tarea 1: Adaptadores y mocks de dashboard y administración

**Archivos:**
- Crear: `src/features/dashboard/dashboardApi.js`, `src/features/administration/usersApi.js`, `catalogsAdminApi.js`, `slaApi.js`, `src/mocks/handlers/dashboard.js`, `src/mocks/handlers/admin.js`
- Modificar: `src/mocks/db.js` (2 cuentas pendientes, 1 rechazada, 1 categoría inactiva, 2 políticas SLA), `src/mocks/handlers/index.js`
- Prueba: `src/features/administration/adminApi.test.js`, `src/features/dashboard/dashboardApi.test.js`

**Interfaces:**
- Consume: `request` (fase 01).
- Produce:
  - `getSummary({ fechaDesde, fechaHasta, areaId })`, `downloadReport({ tipo, fechaDesde, fechaHasta, areaId }) -> {blob, filename}`.
  - `listUsers({ page })`, `getUser(id)`, `createUser(data)`, `updateUser(id, patch)`, `listRoles()`, `listPendingAccounts({ page })`, `decideAccount(id, { estadoCuenta, motivo })`, `resetPassword(id) -> { contrasenaTemporal }`.
  - `catalogsAdminApi`: `list(kind, { page })`, `create(kind, data)`, `update(kind, id, patch)` con `kind` ∈ `'areas'|'categories'|'priorities'` (rutas `/admin/catalogs/<kind>`); `listRequestStatuses()`, `renameRequestStatus(id, nombre)`.
  - `slaApi`: `listPolicies({ page })`, `createPolicy(data)`, `updatePolicy(id, patch)`.
  - Mock: supervisor con `areaId` ajeno → 403; rango invertido → 400; CSV de solicitudes con el encabezado exacto `codigo,categoria,area,estado,prioridad,responsable,creadoEn`; `POST /admin/users` con técnico sin área → 400 con campo `areaId`; correo duplicado → 409; `password-reset` sobre la propia cuenta → 403 y sobre una cuenta inactiva → 409 `CUENTA_NO_ACTIVA`; SLA superpuesta → 409.

- [ ] **Paso 1: Crear la rama y escribir las pruebas**

```bash
git switch main && git pull && git switch -c feature/frontend-fase-04-indicadores-admin
```

```js
test('getSummary envía el rango y el área', ...) // query fechaDesde=2026-11-01T05:00:00Z&fechaHasta=2026-12-01T05:00:00Z&areaId=2
test('el supervisor recibe 403 al pedir otra área', ...)
test('downloadReport devuelve el CSV con el encabezado exacto', ...) // (await blob.text()).split('\n')[0] === 'codigo,categoria,area,estado,prioridad,responsable,creadoEn'
test('createUser técnico sin área devuelve error en areaId', ...)
test('resetPassword sobre la propia cuenta devuelve 403', ...)
test('decideAccount RECHAZADA sin motivo devuelve 400', ...)
test('catalogsAdminApi usa la ruta del tipo', ...) // list('priorities') → GET /api/v1/admin/catalogs/priorities
test('createPolicy superpuesta devuelve 409', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/administration src/features/dashboard`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 8 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/dashboard src/features/administration src/mocks
git commit -m "feat(frontend): adaptadores y mocks de indicadores y administración"
```

---

### Tarea 2: Tablero de indicadores y exportación

**Archivos:**
- Crear: `src/features/dashboard/DashboardPage.jsx`, `DateRangeFilter.jsx`, `KpiCard.jsx`, `BarList.jsx`, `src/features/dashboard/index.js`
- Modificar: `src/app/routes.jsx`
- Prueba: `src/features/dashboard/DashboardPage.test.jsx`

**Interfaces:**
- Consume: `getSummary`, `downloadReport`, `downloadBlob` (fase 01), `limaDaysToUtcRange`, `currentMonthInLima`, `useCatalogLabels` (fase 01), `catalogsAdminApi.list('areas')` (solo administrador).
- Produce:
  - `DashboardPage` (`/indicadores`, P08): `DateRangeFilter({ value, onApply })` con «Desde», «Hasta» y «Aplicar»; estado `draft` separado de `applied`; `useResource` depende solo de `applied` y del área.
  - Tres `KpiCard({ label, value })` (registradas, pendientes, atendidas), más promedio de horas (1 decimal), porcentaje resuelto (`%`) y vencidas/por vencer o «No disponible».
  - `BarList({ title, items: [{ label, value }] })` para categoría, prioridad y responsable; cada barra tiene `aria-label="<etiqueta>: <valor>"` y el valor visible. Responsable `null` → «Sin asignar»; sin nombre → «Responsable <id>».
  - Botones «Exportar solicitudes (CSV)» y «Exportar indicadores (CSV)» con `pending` propio.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('carga el mes actual de Lima al entrar', ...) // vi.setSystemTime(new Date('2026-11-13T12:00:00Z')) → fechaDesde=2026-11-01T05:00:00Z, fechaHasta=2026-12-01T05:00:00Z
test('editar el rango no recarga hasta Aplicar', ...)
test('no aplica un rango invertido', ...)
test('exporta con los filtros aplicados', ...) // editar draft sin aplicar, exportar → query con el rango aplicado
test('vencidas no disponibles muestra No disponible', ...)
test('el administrador elige Todas las áreas y no envía areaId', ...)
test('el supervisor no ve selector de área', ...)
test('muestra categorías sin nombre con respaldo', ...)
test('las barras exponen etiqueta y valor como texto', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/dashboard/DashboardPage.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces y P08.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 9 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/dashboard src/app/routes.jsx
git commit -m "feat(frontend): tablero de indicadores con rango aplicado y exportación CSV"
```

---

### Tarea 3: Administración de usuarios

**Archivos:**
- Crear: `src/features/administration/users/UsersPage.jsx`, `UserFormDialog.jsx`, `src/features/administration/index.js`
- Modificar: `src/app/routes.jsx`
- Prueba: `src/features/administration/users/UsersPage.test.jsx`

**Interfaces:**
- Consume: `usersApi`, `catalogsAdminApi.list('areas')`, `ROLE_LABELS`, `DataTable`, `ConfirmDialog`.
- Produce:
  - `UsersPage` (`/admin/usuarios`, P12, «Administración de usuarios»): pestañas «Usuarios» y «Pendientes de aprobación» (la segunda la llena la tarea 4); tabla con nombre, correo, rol, área y estado (Activo/Inactivo); acciones «Editar», «Desactivar» (con confirmación) y «Restablecer contraseña» (tarea 4); botón «Crear usuario».
  - `UserFormDialog({ user?, roles, areas, onSaved })`: «Nombre completo», «Correo», «Rol», «Área» (visible y obligatoria solo para `TECNICO`/`SUPERVISOR`), «Teléfono (opcional)» y «Contraseña inicial» (solo en el alta; aplica `validatePassword`). La edición envía solo los campos cambiados; al pasar a un rol sin área envía `areaId: null`. Los errores del servidor se asocian a su campo y el formulario conserva los valores.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('lista usuarios con rol y estado legibles', ...)
test('crea un docente sin área', ...) // body sin areaId, rol 'DOCENTE'
test('exige área para técnico', ...)
test('limpia el área al cambiar a un rol sin área', ...)
test('muestra el 409 de correo duplicado en el campo correo', ...)
test('desactivar pide confirmación y envía activo false', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/administration/users/UsersPage.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces y P12.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 6 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/administration src/app/routes.jsx
git commit -m "feat(frontend): administración de usuarios con alta, edición y desactivación"
```

---

### Tarea 4: Cuentas pendientes y restablecimiento de contraseña

**Archivos:**
- Crear: `src/features/administration/users/PendingAccountsPanel.jsx`, `ResetPasswordDialog.jsx`
- Modificar: `src/features/administration/users/UsersPage.jsx`
- Prueba: `src/features/administration/users/accounts.test.jsx`

**Interfaces:**
- Consume: `listPendingAccounts`, `decideAccount`, `resetPassword`, `useSession` (para excluir la propia cuenta).
- Produce:
  - `PendingAccountsPanel`: tabla con nombre, correo y fecha de registro en el orden del servidor (más antigua primero); «Aprobar» y «Rechazar» (diálogo con «Motivo» obligatorio, máximo 500 caracteres); tras decidir, recarga. `409 CUENTA_NO_PENDIENTE` → aviso «Esta cuenta ya fue revisada» y recarga.
  - `ResetPasswordDialog({ user, onClose })`: confirma «¿Restablecer la contraseña de <nombre>? Se cerrarán sus sesiones activas.»; al confirmar muestra la contraseña temporal en un campo de solo lectura con «Copiar» (`navigator.clipboard.writeText`) y el aviso de las Restricciones. Al cerrar, el estado local se descarta.
  - En `UsersPage`, «Restablecer contraseña» solo aparece si `user.activo`, `user.estadoCuenta === 'ACTIVA'` (o el campo no existe) y `user.id !== session.user.id`.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('lista pendientes de la más antigua a la más reciente', ...)
test('aprobar envía estadoCuenta ACTIVA y retira la fila', ...)
test('rechazar exige motivo', ...)
test('409 CUENTA_NO_PENDIENTE recarga y avisa', ...)
test('muestra la contraseña temporal una sola vez', ...)
test('no conserva la contraseña al cerrar', ...) // cerrar y reabrir el diálogo del mismo usuario → no aparece el texto anterior
test('no ofrece restablecer sobre la propia cuenta ni sobre inactivas', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/administration/users/accounts.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 7 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/administration/users
git commit -m "feat(frontend): aprobación de cuentas y restablecimiento de contraseña"
```

---

### Tarea 5: Catálogos

**Archivos:**
- Crear: `src/features/administration/catalogs/CatalogsPage.jsx`, `CatalogTable.jsx`, `RequestStatusesTable.jsx`
- Modificar: `src/app/routes.jsx`
- Prueba: `src/features/administration/catalogs/CatalogsPage.test.jsx`

**Interfaces:**
- Consume: `catalogsAdminApi`.
- Produce:
  - `CatalogsPage` (`/admin/catalogos`, P13): pestañas «Áreas», «Categorías», «Prioridades» y «Estados».
  - `CatalogTable({ kind, columns, fields })`: lista paginada con activos e inactivos; «Crear», «Editar» y «Desactivar»/«Activar» (confirmación al desactivar). `fields` describe el formulario por tipo: áreas `codigo`, `nombre`, `descripcion`; categorías `codigo`, `nombre`, `areaId` (áreas activas), `prioridadPredeterminadaId` (prioridades activas), `descripcion`; prioridades `codigo`, `nombre`, `nivel` (entero), `color`. `codigo` solo se edita en el alta. `409` se muestra junto al formulario.
  - `RequestStatusesTable`: código, nombre y si es final; «Editar nombre» abre un diálogo con un único campo «Nombre».

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('lista áreas activas e inactivas con su badge', ...)
test('crea una categoría con área y prioridad activas', ...)
test('el código no es editable después del alta', ...)
test('desactivar pide confirmación y envía activo false', ...)
test('409 por duplicado se muestra en el formulario', ...)
test('en estados solo se edita el nombre', ...) // PATCH body === {nombre:'Registrado'}
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/administration/catalogs`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces y P13.

- [ ] **Paso 4: Verificar**

Run: el mismo comando.
Expected: 6 passed.

- [ ] **Paso 5: Commit**

```bash
git add src/features/administration/catalogs src/app/routes.jsx
git commit -m "feat(frontend): administración de áreas, categorías, prioridades y estados"
```

---

### Tarea 6: Políticas SLA e inicio del administrador

**Archivos:**
- Crear: `src/features/administration/sla/SlaPoliciesPage.jsx`
- Modificar: `src/features/home/AdminShortcuts.jsx`, `src/app/routes.jsx`
- Prueba: `src/features/administration/sla/SlaPoliciesPage.test.jsx`, `src/features/home/AdminShortcuts.test.jsx`

**Interfaces:**
- Consume: `slaApi`, `catalogsAdminApi.list('categories'|'priorities')`.
- Produce:
  - `SlaPoliciesPage` (`/admin/sla`, P14): tabla con alcance («Categoría: <nombre>» o «Prioridad: <nombre>»), horas objetivo, horas de aviso, vigencia y estado; texto de precedencia de las Restricciones. Alta: radio «Aplicar por» (Categoría o Prioridad) que muestra un solo selector, «Horas objetivo», «Horas de aviso» (menor que el objetivo), «Vigente desde» y «Vigente hasta» opcionales (`datetime-local` en hora de Lima, convertido a UTC). Edición: alcance de solo lectura. `409` junto al formulario.
  - `AdminShortcuts`: accesos a Indicadores, Usuarios, Catálogos, SLA y Reservas (`/reservas/aprobacion`), sin listado de solicitudes.

- [ ] **Paso 1: Escribir las pruebas**

```jsx
test('el alta envía solo categoriaId o solo prioridadId', ...)
test('horas de aviso mayores que el objetivo no se envían', ...)
test('la edición no permite cambiar el alcance', ...)
test('muestra el conflicto de vigencia junto al formulario', ...)
test('el inicio del administrador muestra los cinco accesos', ...)
```

- [ ] **Paso 2: Ejecutar**

Run: `npm test -- src/features/administration/sla src/features/home/AdminShortcuts.test.jsx`
Expected: FAIL.

- [ ] **Paso 3: Implementar** según Interfaces y P14.

- [ ] **Paso 4: Verificar**

Run: `npm test && npm run lint && npm run build`
Expected: todo en verde.

- [ ] **Paso 5: Verificación visual**

Run: `npm run dev:mock`; recorrer indicadores con el supervisor de TI y con el administrador, y cada pantalla de administración, a 360 y 1440 px.
Expected: coincide con P00 (administrador), P08 y P12 a P14.

- [ ] **Paso 6: Commit**

```bash
git add src/features/administration/sla src/features/home src/app/routes.jsx
git commit -m "feat(frontend): políticas SLA e inicio del administrador"
```

---

## Aceptación de la fase

- [ ] Rango aplicado, exportación coherente, filtro fuera de alcance, desactivación de cuenta, aprobación y rechazo de cuentas, contraseña temporal mostrada una vez, edición del nombre de un estado, datos históricos legibles y conflicto de vigencias SLA, cubiertos por pruebas en verde.
- [ ] Los nombres de prioridad y responsable en el tablero del supervisor quedan anotados como pendientes de contrato en la [fase 06](06-integracion-y-entrega-local.md).

## Capturas de Figma

<details>
<summary>P00 · Inicio del administrador</summary>

![P00 · Inicio del administrador](capturas-figma/p00-inicio-admin.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=143-233)

</details>

<details>
<summary>P08 · Indicadores</summary>

![P08 · Indicadores](capturas-figma/p08-indicadores.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=66-134)

</details>

<details>
<summary>P12 · Administración de usuarios</summary>

![P12 · Administración de usuarios](capturas-figma/p12-usuarios.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=72-26)

</details>

<details>
<summary>P13 · Catálogo de áreas</summary>

![P13 · Catálogo de áreas](capturas-figma/p13-catalogo-areas.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=73-59)

</details>

<details>
<summary>P13 · Catálogo de categorías</summary>

![P13 · Catálogo de categorías](capturas-figma/p13-catalogo-categorias.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=201-142)

</details>

<details>
<summary>P13 · Catálogo de prioridades</summary>

![P13 · Catálogo de prioridades](capturas-figma/p13-catalogo-prioridades.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=201-336)

</details>

<details>
<summary>P13 · Catálogo de estados</summary>

![P13 · Catálogo de estados](capturas-figma/p13-catalogo-estados.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=201-518)

</details>

<details>
<summary>P14 · Políticas SLA</summary>

![P14 · Políticas SLA](capturas-figma/p14-politicas-sla.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=73-157)

</details>
