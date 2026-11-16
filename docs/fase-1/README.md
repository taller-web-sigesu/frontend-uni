# Prototipo Fase I — Gestal

Muestra de desarrollo con **HTML, CSS y JavaScript puro** para la Fase I del curso. No usa React, backend ni base de datos: los datos se cargan con `fetch` desde `data.json` y la sesión es simulada.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura semántica: login, listado, registro, detalle y gestión. |
| `styles.css` | Diseño responsive con los tokens visuales de UniService. |
| `app.js` | Eventos, validaciones, manipulación del DOM, `fetch`, `sessionStorage` y `localStorage`. |
| `data.json` | Datos simulados de áreas, categorías, prioridades, técnicos y solicitudes. |

## Cómo ejecutarlo

Abre `index.html` directamente o, para probar `fetch` sin restricciones del navegador, levanta un servidor local:

```bash
npx serve fase-1
```

o

```bash
python -m http.server 5173 --directory fase-1
```

Luego abre `http://localhost:5173` (o la URL que indique `serve`).

## Cuentas de demostración

Todas usan la contraseña **`Demo2026!`**:

| Correo | Rol |
| --- | --- |
| `ana@universidad.example` | Estudiante |
| `docente@universidad.example` | Docente |
| `tecnico@universidad.example` | Técnico |
| `supervisor@universidad.example` | Supervisor |
| `admin@universidad.example` | Administrador |

## Qué demuestra

- Formularios con validación en JavaScript y mensajes de error junto al campo.
- Renderizado dinámico de listados y detalle con manipulación del DOM.
- `fetch` a un archivo JSON local y estados de carga/error.
- `sessionStorage` para la sesión simulada y `localStorage` para conservar las solicitudes creadas.
- Filtros, búsqueda, registro de solicitudes, comentarios, asignación y cambios de estado.
- Vistas diferentes según el rol seleccionado.
- Diseño responsive para escritorio, tablet y móvil.

> Es un prototipo de Fase I: no implementa autenticación real, seguridad de servidor ni persistencia en MySQL.
