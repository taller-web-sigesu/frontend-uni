# Frontend — Universidad Actúa

Portal web en React 19 + Vite + React Router, basado en [`DESIGN.md`](DESIGN.md).
Cubre sesión y perfil, solicitudes, atención por rol, indicadores, administración
y reservas de ambientes (HU-01 a HU-29). La verificación por HU está en
[`docs/verificacion/matriz-hu.md`](docs/verificacion/matriz-hu.md).
Lo que falta está en [`docs/verificacion/pendientes.md`](docs/verificacion/pendientes.md).

## Despliegues

Hay **dos despliegues separados**:

| Entorno | URL | Rama | Backend |
| --- | --- | --- | --- |
| Staging | https://frontend-uni-tdk7.vercel.app | `main` | https://uniservice-backend-staging.onrender.com |
| Producción | https://frontend-uni-wx9m.vercel.app | `production` | https://uniservice-backend-prod.onrender.com |

Staging se actualiza al integrar en `main`. Producción se despliega al promover `main` → `production`; su `vercel.json` apunta al backend de producción y el backend de producción exige aprobación y smoke.

### Usuarios de prueba (staging)

Todas las cuentas usan la contraseña **`Demo2026!`**:

| Correo | Rol |
| --- | --- |
| `admin.demo@universidad.example` | Administrador |
| `supervisor.ti.demo@universidad.example` | Supervisor TI |
| `supervisor.mant.demo@universidad.example` | Supervisor Mantenimiento |
| `supervisor.bib.demo@universidad.example` | Supervisor Biblioteca |
| `tecnico.ti.demo@universidad.example` | Técnico TI |
| `tecnica.ti.demo@universidad.example` | Técnica TI |
| `tecnico.mant.demo@universidad.example` | Técnico Mantenimiento |
| `ana.demo@universidad.example` | Estudiante |
| `pedro.demo@universidad.example` | Docente |

Producción no carga cuentas demo. El informe completo de Fase III está en [infra-uni/docs/fase-3/INFORME-FASE-III.md](https://github.com/taller-web-sigesu/infra-uni/blob/main/docs/fase-3/INFORME-FASE-III.md).

## Trabajo en equipo

**Obligatorio:** crea una rama por tarea (`feature/...`, `fix/...` o `docs/...`)
desde `main`. No cambies ni confirmes trabajo directamente en `main`; integra
mediante una PR revisada por otro compañero.

## Modos de ejecución

| Modo | Comando | API | Dirección |
| --- | --- | --- | --- |
| Docker (recomendado) | `infra-uni/iniciar.bat` | Backend real del Compose | [http://localhost:3000](http://localhost:3000) |
| Desarrollo con API real | `npm run dev` | Proxy `/api` a `VITE_PROXY_TARGET` | http://localhost:3000 |
| Desarrollo simulado | `npm run dev:mock` | API simulada (MSW) en el navegador | http://localhost:3000 |
| Build simulado | `npm run preview:mock` | API simulada (MSW) | http://localhost:4173 |

- En Docker, el proxy de Vite apunta a `http://backend:8080`, el valor por defecto.
- Fuera de Docker, con el backend en tu máquina, indica el destino:

  ```bash
  VITE_PROXY_TARGET=http://localhost:8080 npm run dev
  ```

- **Cuentas de demostración** (modo real y simulado): `admin.demo`, `supervisor.ti.demo`, `tecnico.ti.demo`, `ana.demo` y `pedro.demo`, todas `@universidad.example`, con contraseña `Demo2026!`. Fuente: `backend-uni/docs/INTEGRACION-FRONTEND.md`. No versiones otras credenciales.
- **API simulada:** guarda su estado en `sessionStorage` (sin el JWT) para que recargar conserve la sesión. Para empezar de cero, cierra la pestaña.

## Pruebas

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

- `npm test` ejecuta las pruebas unitarias y de integración con Vitest, jsdom y MSW.
- `npm run test:e2e` ejecuta los recorridos de Playwright en `e2e/` contra el build simulado, en escritorio (1440 px) y móvil (360 px). Es lo mismo que corre CI (`.github/workflows/ci.yml`).
- **Contra el backend real:** levanta el Compose de `infra-uni` y ejecuta:

  ```bash
  E2E_API=real npx playwright test --project=chromium
  ```

  Usa `http://localhost:3000` y las cuentas de demostración, y deja datos de prueba en la base local. En PowerShell: `$env:E2E_API='real'; npx playwright test --project=chromium`.
- **Si un recorrido falla:** `npx playwright show-report` abre el informe con trazas.
