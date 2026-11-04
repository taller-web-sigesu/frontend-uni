# Arquitectura del frontend — frontend-uni

> **Estado:** base React implementada en código; arquitectura funcional objetivo pendiente.
> **Última actualización:** 2026-11-02.
> **Alcance:** interfaz web y consumo de la API.

## Referencias y propiedad

La [arquitectura global](../infra-uni/docs/ARCHITECTURE.md) define los límites entre repositorios y las decisiones compartidas. Este documento es la referencia de arquitectura interna del frontend; no duplica contratos ni reglas de negocio del backend.

Leer [AGENTS.md](AGENTS.md), [DESIGN.md](DESIGN.md) y la historia correspondiente en [user-stories](../infra-uni/docs/requirements/user-stories/) antes de modificar la interfaz.

## Estado actual comprobado en archivos

- `package.json`: React y React DOM 19.3.0, Vite 8.3.5 y plugin React 6.1.2; scripts `dev`, `build` y `preview`.
- `src/main.jsx`: entrada de la aplicación; `src/App.jsx`: pantalla inicial y consulta `GET /api/v1/status`; `src/styles.css`: estilos actuales.
- `vite.config.js`: puerto 3000, HMR con polling y proxy `/api` hacia `http://backend:8080` en Docker.
- `Dockerfile.dev`: entorno de desarrollo conectado al Compose de infraestructura.
- Aún no existen router, módulos funcionales, autenticación, cliente HTTP centralizado ni herramientas de pruebas/lint configuradas.

La revisión de estos archivos no demuestra ejecución, conectividad ni build exitoso.

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
- La propuesta inicial mantiene JWT de acceso de corta duración en memoria, sin `localStorage`. JWT frente a sesión sigue pendiente de decisión; no hay autenticación implementada.
- Si se incorpora renovación con cookies, coordinar `HttpOnly`, `Secure`, SameSite, CSRF y CORS con backend.

## Desarrollo y verificación

El procedimiento local está en [README de infraestructura](../infra-uni/README.md) y [DOCKER.md](../infra-uni/docs/DOCKER.md): Docker Desktop y los tres repositorios hermanos. Vite aplica HMR sobre el código montado.

Para verificar cambios, ejecutar `npm run build` en el entorno disponible. Vitest + Testing Library para UI, ESLint para calidad y Playwright para recorridos completos son herramientas propuestas, todavía sin configurar. El CI objetivo ejecutará dependencias, lint/pruebas disponibles, build y preview/staging con smoke/E2E cuando aplique.

No afirmar que las pruebas pasan sin ejecutar los comandos y revisar sus salidas. Actualizar este documento cuando se implemente una parte de la estructura objetivo.
