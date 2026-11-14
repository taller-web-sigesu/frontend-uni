# Arquitectura del frontend — frontend-uni

> **Estado:** fases 01 a 06 implementadas; HU-01 a HU-29 verificadas (ver `docs/verificacion/matriz-hu.md`).
> **Última actualización:** 2026-11-13.
> **Alcance:** interfaz web y consumo de la API.

## Referencias y propiedad

La [arquitectura global](https://github.com/taller-web-sigesu/infra-uni/blob/main/docs/ARCHITECTURE.md) define los límites entre repositorios y las decisiones compartidas. Este documento es la referencia de arquitectura interna del frontend; no duplica contratos ni reglas de negocio del backend.

Leer [AGENTS.md](AGENTS.md), [DESIGN.md](DESIGN.md) y la historia correspondiente en [user-stories](https://github.com/taller-web-sigesu/infra-uni/tree/main/docs/requirements/user-stories) antes de modificar la interfaz.

## Estado actual comprobado en archivos

- `package.json`: React y React DOM 19.3.0, React Router 7, Vite 8.3.5; Vitest, Testing Library, MSW 2, ESLint, Playwright y `@axe-core/playwright` en desarrollo.
  - Scripts: `dev`, `dev:mock`, `build`, `preview`, `preview:mock`, `test`, `lint` y `test:e2e`.
- `src/app/`: tabla única de rutas con los roles de cada una (`routes.jsx`), el router y las páginas 403 y 404.
- `src/features/`: módulos por flujo: `auth`, `home`, `requests`, `management`, `dashboard`, `administration` y `reservations`.
- `src/services/`: cliente HTTP con `ApiError` y renovación del JWT, `useResource`, `useSubmit` y formato de fechas en hora de Lima.
  - `pendingContract.js` es el único lugar para los huecos del contrato.
- `src/mocks/`: API simulada con MSW para las pruebas y para `dev:mock` y `preview:mock`. El estado se guarda en `sessionStorage` sin el JWT. No entra en el build de producción.
- `vite.config.js`:
  - Puerto 3000 con HMR con polling.
  - Proxy `/api` hacia `VITE_PROXY_TARGET`, por defecto `http://backend:8080` en Docker.
  - Vitest solo incluye `src/**/*.test.{js,jsx}`.
- `playwright.config.js` y `e2e/`:
  - Recorridos por rol y prueba de accesibilidad con axe.
  - Por defecto contra el build simulado en el puerto 4173; con `E2E_API=real`, contra el Compose en el puerto 3000.
- `.github/workflows/ci.yml`: `npm ci`, lint, pruebas, build, instalación de Chromium y E2E simulado; sube el informe de Playwright si falla.
- `Dockerfile.dev`: entorno de desarrollo conectado al Compose de infraestructura.

Ejecución comprobada el 2026-11-13 (detalle en `docs/verificacion/`):
- Lint sin errores y build correcto.
- 274 pruebas unitarias.
- E2E simulado: 46 en verde y 2 omitidas.
- E2E contra el backend real: 24 de 24.

## Responsabilidad y tecnologías objetivo

- **Nombre:** Portal web universitario.
- **Responsabilidad:** interfaz responsive para autenticarse, registrar/consultar solicitudes, trabajar asignaciones según rol, administrar catálogos, gestionar reservas de ambientes y visualizar indicadores.
- **Tecnologías propuestas:** React + Vite + JavaScript, React Router, Fetch (o un cliente HTTP consensuado), CSS y biblioteca UI definida a partir de `DESIGN.md`.
- **Diseño:** `frontend-uni/DESIGN.md` es la referencia visual: tokens, tipografía, colores, espaciado, accesibilidad y componentes. Puede partir de Refero Styles, pero debe adaptarse y validarse para el producto.
- **Estado:** manejo local de UI y sesión; no duplicar reglas de negocio ni usar el estado del navegador como fuente de verdad de datos persistentes.
- **Despliegue propuesto:** Vercel; sujeto a validación del equipo.
- **Límite de confianza:** validación visual/UX no sustituye validación ni autorización del backend.

React Router y la biblioteca UI son propuestas pendientes de incorporación. Las versiones instalables se mantienen en `package.json`; las plataformas cloud siguen siendo candidatas.

## Organización objetivo

Crear las carpetas cuando se implemente su funcionalidad:

```text
src/
├── app/                      # Router, providers y arranque
├── components/
│   ├── ui/                   # Componentes presentacionales reutilizables
│   └── layout/               # Shell, navegación y layouts por rol
├── features/
│   ├── auth/                 # Login y sesión; registro si el alcance lo aprueba
│   ├── requests/             # Registro, listado y detalle de solicitudes
│   ├── management/           # Asignaciones, atención e historial
│   ├── dashboard/            # Indicadores y filtros
│   ├── reservations/         # Espacios, disponibilidad, reservas y aprobación
│   └── administration/       # Usuarios y catálogos
├── services/                 # Cliente HTTP y adaptadores de API
└── styles/                   # Estilos y tokens aplicados
tests/                        # Pruebas de UI y end-to-end previstas
```

## Integración, estado y seguridad

- Consumir HTTP/JSON con prefijo `/api/v1`; no acceder directamente a MySQL ni copiar entidades Java.
- El contrato objetivo pertenece a `backend-uni/docs/api/openapi.yaml`, todavía pendiente. Los endpoints del documento backend son propuestas salvo los identificados como existentes; no inventar rutas para implementar una pantalla.
- Mantener estado local de UI y sesión; los datos persistentes y las decisiones de autorización pertenecen al backend.
- Contemplar carga, error, estados vacíos, validaciones y accesibilidad. Ocultar botones según rol no sustituye la autorización del servidor.
- La estrategia propuesta mantiene un JWT de acceso de corta duración en memoria y un refresh token en cookie `HttpOnly`, sin `localStorage` (ver [ADR-0002](https://github.com/taller-web-sigesu/infra-uni/blob/main/docs/adr/ADR-0002-autenticacion-sesion.md), estado Propuesto). No hay autenticación implementada todavía.
- Si se incorpora renovación con cookies, coordinar `HttpOnly`, `Secure`, SameSite, CSRF y CORS con backend.

## Plan de implementación

El plan aprobado está en [`infra-uni/docs/superpowers/plans/2026-11-04-ingenieria-pendiente.md`](https://github.com/taller-web-sigesu/infra-uni/blob/main/docs/superpowers/plans/2026-11-04-ingenieria-pendiente.md). Orden de trabajo:

1. **Base:** React Router, `app/`, `components/layout`, `services/`, tokens de `DESIGN.md`, modo claro (sin modo oscuro, fuera de alcance) y responsive.
2. **Sesión y API:** cliente HTTP centralizado, access token en memoria, refresh con cookie, manejo de 401 y errores.
3. **Features:** `auth`, `requests`, `management`, `dashboard`, `administration` y `reservations`, con estados de carga, vacío y error.
4. **Calidad:** Vitest + Testing Library, ESLint, Playwright y accesibilidad WCAG 2.2 AA.
5. **Entrega:** build de Vite, preview/staging en Vercel y smoke/E2E en CI.

**Decisiones relacionadas:** [ADR-0002](https://github.com/taller-web-sigesu/infra-uni/blob/main/docs/adr/ADR-0002-autenticacion-sesion.md) (sesión) y [ADR-0005](https://github.com/taller-web-sigesu/infra-uni/blob/main/docs/adr/ADR-0005-ci-cd-calidad.md) (CI/CD).

## Desarrollo y verificación

El procedimiento local está en [README de infraestructura](https://github.com/taller-web-sigesu/infra-uni/blob/main/README.md) y [DOCKER.md](https://github.com/taller-web-sigesu/infra-uni/blob/main/docs/DOCKER.md): Docker Desktop y los tres repositorios hermanos. Vite aplica HMR sobre el código montado.

Para verificar cambios, ejecutar `npm run build` en el entorno disponible. Vitest + Testing Library para UI, ESLint para calidad y Playwright para recorridos completos son herramientas propuestas, todavía sin configurar. El CI objetivo ejecutará dependencias, lint/pruebas disponibles, build y preview/staging con smoke/E2E cuando aplique.

No afirmar que las pruebas pasan sin ejecutar los comandos y revisar sus salidas. Actualizar este documento cuando se implemente una parte de la estructura objetivo.
