# Fase 06 · Integración, pruebas y entrega local — Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** cerrar la entrega con recorridos E2E en CI, verificación contra el backend real en Docker local, una matriz de evidencia por HU y una revisión visual y de accesibilidad.

**Arquitectura:** Playwright ejecuta los recorridos de cada rol contra `vite preview` en modo simulado (rápido y determinista) en CI. La misma batería, con `E2E_API=real`, se ejecuta a mano contra el Compose de `infra-uni` con las cuentas de demostración. La matriz `docs/verificacion/matriz-hu.md` registra el resultado por HU y modo.

**Tecnologías:** Playwright, `@axe-core/playwright`, GitHub Actions, Docker Compose de `infra-uni`.

**Especificación:**
- HU-01 a HU-29 en `../infra-uni/docs/requirements/user-stories/`.
- `../infra-uni/docs/DOCKER.md`, `../infra-uni/docs/adr/ADR-0005-ci-cd-calidad.md`, `../backend-uni/docs/INTEGRACION-FRONTEND.md` (cuentas y comprobación rápida).
- Entrada: las fases 01 a 05 están en `main` con sus pruebas en verde. Versión anterior: commit `46f8cf9`.

## Restricciones globales

Rigen las de la [fase 01](01-base-visual-y-api-simulada.md#restricciones-globales-aplican-a-las-seis-fases). Además:

- CI ejecuta, en este orden: `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium` y `npm run test:e2e` (modo simulado).
- Las pruebas contra la API real no corren en CI: requieren el Compose local.
- Cuentas reales: las de `INTEGRACION-FRONTEND.md`, contraseña `Demo2026!`. Nunca se versionan otras credenciales.
- Fuera de Docker, el proxy de Vite debe apuntar a `http://localhost:8080`: `vite.config.js` lee `VITE_PROXY_TARGET` con `http://backend:8080` como valor por defecto.
- Revisión visual: escritorio a 1440 px contra cada frame; adaptación a 360 y 768 px; contraste WCAG 2.2 AA (texto normal ≥ 4.5:1).

## Foco de revisión

1. **Cookie de renovación en el navegador real.** Tras recargar, la sesión se restaura con la cookie `refresh_token` (`HttpOnly`, `Path=/api/v1/auth`) y el JWT no aparece en `localStorage` ni `sessionStorage`. Prueba E2E `sesion › restaura tras recargar sin guardar el token` (tarea 1).
2. **Revocación inmediata.** Tras cerrar sesión, el JWT anterior recibe `401`. Prueba E2E `sesion › el token anterior queda revocado` (tarea 2, solo modo real).
3. **Descarga de evidencias desde Supabase** (`302` a URL firmada de otro origen). El navegador quita `Authorization` en la redirección; si el almacenamiento no permite CORS, la descarga falla. Se registra en la matriz como riesgo hasta activar Supabase (local usa disco).
4. **Violaciones de accesibilidad automáticas.** Cero violaciones `serious` o `critical` de axe en cada pantalla principal. Prueba E2E `a11y › pantallas principales sin violaciones graves` (tarea 1).
5. **Huecos del contrato.** Cada hueco de la tabla de la fase 01 aparece en la matriz como «Pendiente de integración» con el endpoint que falta, hasta que backend lo publique. Revisión manual de `matriz-hu.md` (tarea 3).

---

## Estructura de archivos

```text
playwright.config.js
e2e/fixtures.js                 # login(page, rol), cuentas por rol y modo
e2e/sesion.spec.js
e2e/solicitudes.spec.js
e2e/administracion.spec.js
e2e/reservas.spec.js
e2e/a11y.spec.js
.github/workflows/ci.yml
docs/verificacion/matriz-hu.md
docs/verificacion/revision-visual.md
README.md                       # modos simulado y real, cómo reproducir
vite.config.js                  # VITE_PROXY_TARGET
```

---

### Tarea 1: Playwright en modo simulado

**Archivos:**
- Crear: `playwright.config.js`, `e2e/*.spec.js`, `e2e/fixtures.js`
- Modificar: `package.json` (`test:e2e`: `playwright test`; `preview:mock`: `vite build --mode mock && vite preview --port 4173`)
- Prueba: los propios `e2e/*.spec.js`

**Interfaces:**
- Consume: todas las pantallas de las fases 02 a 05; modo simulado de la fase 01.
- Produce:
  - `playwright.config.js`: `webServer` = `npm run preview:mock` en `4173` cuando `E2E_API` no es `real`; con `E2E_API=real`, `baseURL` `http://localhost:3000` y sin `webServer`. Proyectos `chromium` escritorio (1440×900) y `mobile` (360×740).
  - `login(page, rol)` en `fixtures.js` con las cuentas de demostración por rol (`ESTUDIANTE`, `DOCENTE`, `TECNICO`, `SUPERVISOR`, `ADMINISTRADOR`).
  - Recorridos (uno por `test`):
    - `sesion`: ingreso por rol con destino correcto; credenciales inválidas; primer ingreso → cambio → inicio; restaura tras recargar sin guardar el token; cerrar sesión.
    - `solicitudes`: estudiante registra con una evidencia → supervisor asigna → técnico inicia y resuelve → supervisor cierra → estudiante responde la encuesta; rechazo con motivo; enlace a solicitud ajena → no encontrada.
    - `administracion`: indicadores con rango y exportación CSV (evento `download` con nombre `solicitudes.csv`); crear docente; aprobar cuenta pendiente; restablecer contraseña; renombrar estado; política SLA en conflicto.
    - `reservas`: alta pendiente; conflicto de franja; cancelación; aprobación por supervisor; horario de espacio.
    - `a11y`: `AxeBuilder` en `/login`, `/inicio`, `/solicitudes`, `/solicitudes/:id`, `/gestion`, `/indicadores`, `/admin/usuarios`, `/reservas/nueva`; sin violaciones `serious` ni `critical`.

- [ ] **Paso 1: Crear la rama e instalar**

```bash
git switch main && git pull && git switch -c feature/frontend-fase-06-integracion
npm i -D @playwright/test @axe-core/playwright && npx playwright install chromium
```

- [ ] **Paso 2: Escribir `e2e/sesion.spec.js` y ejecutarlo antes de configurar**

Run: `npx playwright test e2e/sesion.spec.js`
Expected: FAIL (sin `webServer` ni `baseURL`).

- [ ] **Paso 3: Configurar `playwright.config.js`, `fixtures.js` y los scripts**

- [ ] **Paso 4: Verificar sesión**

Run: `npm run test:e2e -- e2e/sesion.spec.js`
Expected: todo en verde en `chromium` y `mobile`.

- [ ] **Paso 5: Escribir y ejecutar el resto de recorridos**

Run: `npm run test:e2e`
Expected: todo en verde. Si un recorrido falla por un defecto de pantalla, corregirlo con su prueba unitaria primero (superpowers:systematic-debugging).

- [ ] **Paso 6: Commit**

```bash
git add playwright.config.js e2e package.json package-lock.json
git commit -m "test(frontend): recorridos E2E por rol y accesibilidad en modo simulado"
```

---

### Tarea 2: CI y recorrido contra el backend real

**Archivos:**
- Crear: `.github/workflows/ci.yml`
- Modificar: `vite.config.js` (`VITE_PROXY_TARGET`), `e2e/sesion.spec.js` (prueba de revocación con `test.skip(process.env.E2E_API !== 'real')`)

**Interfaces:**
- Produce: workflow `ci` en `push` y `pull_request` con Node 22 y los pasos de las Restricciones; sube `playwright-report/` como artefacto si falla.

- [ ] **Paso 1: Escribir la prueba de revocación (solo modo real)**

```js
test('el token anterior queda revocado', async ({ page, request }) => {
  // login como admin; capturar Authorization de una petición a /api/v1/admin/users con page.waitForRequest
  // cerrar sesión desde el topbar
  // request.get('/api/v1/admin/users', { headers: { Authorization } }) → status 401
});
```

- [ ] **Paso 2: Levantar el Compose y ejecutar contra la API real**

```bash
cd ../infra-uni && docker compose up -d --build
```

Run: `E2E_API=real npx playwright test --project=chromium`
Expected: `sesion`, `solicitudes`, `administracion` y `reservas` en verde, salvo los pasos que dependen de huecos del contrato (selector de prioridad del supervisor y marca de encuesta). Anotar cada fallo en la matriz (tarea 3) con su causa; no ocultarlo con `skip`.

- [ ] **Paso 3: Comprobar a mano lo que Playwright no cubre**

En `http://localhost:3000` con las herramientas de desarrollo: la cookie `refresh_token` es `HttpOnly` con `Path=/api/v1/auth`; las peticiones `/auth/*` llevan `Origin: http://localhost:3000`; `docker compose ps` muestra los servicios `healthy`.
Expected: todo coincide; anotar el resultado en la matriz.

- [ ] **Paso 4: Crear el workflow y verificarlo en local**

Run: `npm ci && npm run lint && npm test && npm run build && npm run test:e2e`
Expected: todo en verde (la misma secuencia que CI).

- [ ] **Paso 5: Commit**

```bash
git add .github/workflows/ci.yml vite.config.js e2e/sesion.spec.js
git commit -m "ci(frontend): lint, pruebas, build y E2E simulado; recorrido real documentado"
```

---

### Tarea 3: Matriz por HU, revisión visual e instrucciones

**Archivos:**
- Crear: `docs/verificacion/matriz-hu.md`, `docs/verificacion/revision-visual.md`
- Modificar: `README.md`, `ARCHITECTURE.md` (sección «Estado actual comprobado en archivos»)

**Interfaces:**
- Produce:
  - `matriz-hu.md`: una fila por HU-01 a HU-29 con columnas `HU`, `Pantallas`, `Pruebas unitarias` (archivo), `E2E simulado` (spec y test), `E2E real` (✔, ✘ con causa, o «Pendiente de integración: <endpoint o campo que falta>`), `Fecha`.
  - `revision-visual.md`: por ruta, el frame de Figma comparado a 1440 px y las observaciones a 360 y 768 px (contraste, etiquetas, avisos de error, foco y teclado).
  - `README.md`: cómo ejecutar `npm run dev` (API real vía Compose), `npm run dev:mock`, `npm test`, `npm run test:e2e` y `E2E_API=real npx playwright test`; cuándo usar `VITE_PROXY_TARGET`.

- [ ] **Paso 1: Llenar la matriz** con los resultados reales de las tareas 1 y 2.

- [ ] **Paso 2: Revisión visual**

Run: `npm run dev:mock`; comparar cada ruta con su frame (galerías de las fases 01 a 05) a 1440 px y revisar 360 y 768 px con teclado (Tab, Shift+Tab, Escape).
Expected: diferencias anotadas en `revision-visual.md`; las que afectan a una HU se corrigen con su prueba y se vuelve a ejecutar `npm test`.

- [ ] **Paso 3: Verificación final**

Run: `npm ci && npm run lint && npm test && npm run build && npm run test:e2e`
Expected: todo en verde.

- [ ] **Paso 4: Commit**

```bash
git add docs/verificacion README.md ARCHITECTURE.md
git commit -m "docs(frontend): matriz de verificación por HU, revisión visual e instrucciones"
```

---

## Evidencia mínima por fase

| Fase funcional | Evidencia mínima |
| --- | --- |
| [02 · Sesión](02-acceso-sesion-y-perfil.md) | Ingreso por rol, cuenta pendiente, primer ingreso, recarga, renovación simultánea y revocación inmediata. |
| [03 · Solicitudes](03-solicitudes-y-atencion.md) | Registro con evidencia, comentario, asignación, resolución, cierre, encuesta y recurso fuera de alcance. |
| [04 · Indicadores y administración](04-indicadores-y-administracion.md) | Filtros y CSV coherentes, desactivación, aprobación de cuenta, restablecimiento, catálogo y conflicto de vigencia SLA. |
| [05 · Reservas](05-reservas-y-ambientes.md) | Alta, decisión, cancelación del propietario, conflicto entre consulta y guardado y horario administrado. |

**Cierre.** Los cinco roles completan sus recorridos con el backend real en Docker local, CI pasa y la matriz permite comprobar las HU-01 a HU-29, con los huecos del contrato marcados como pendientes.

## Capturas de Figma

Usar las galerías de cada fase al comparar los recorridos de escritorio con los frames originales.

- [Capturas de la fase 01](01-base-visual-y-api-simulada.md#capturas-de-figma)
- [Capturas de la fase 02](02-acceso-sesion-y-perfil.md#capturas-de-figma)
- [Capturas de la fase 03](03-solicitudes-y-atencion.md#capturas-de-figma)
- [Capturas de la fase 04](04-indicadores-y-administracion.md#capturas-de-figma)
- [Capturas de la fase 05](05-reservas-y-ambientes.md#capturas-de-figma)
