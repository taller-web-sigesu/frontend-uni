# Revisión visual y de accesibilidad

Revisión del 13/11/2026 sobre el build simulado (`npm run preview:mock`).

## Comprobaciones automáticas

Recorrí 17 rutas en tres anchos (1440, 768 y 360 px) con `prefers-color-scheme` claro y oscuro: 108 comprobaciones en total.

| Ruta | Rol | Desborde horizontal | Contraste (axe `color-contrast`) | Tamaño de objetivo (axe `target-size`) |
| --- | --- | --- | --- | --- |
| `/login`, `/registro` | — | Ninguno | Sin violaciones | Sin violaciones |
| `/inicio`, `/solicitudes`, `/solicitudes/nueva`, `/solicitudes/1`, `/reservas`, `/reservas/nueva`, `/reservas/1`, `/perfil` | Estudiante | Ninguno | Sin violaciones | Sin violaciones |
| `/bandeja` | Técnico | Ninguno | Sin violaciones | Sin violaciones |
| `/gestion`, `/indicadores`, `/reservas/aprobacion` | Supervisor | Ninguno | Sin violaciones | Sin violaciones |
| `/admin/usuarios`, `/admin/catalogos`, `/admin/sla`, `/admin/ambientes` | Administrador | Ninguno | Sin violaciones | Sin violaciones |

Además, `e2e/a11y.spec.js` ejecuta axe con WCAG 2.0, 2.1 y 2.2 AA en ocho pantallas principales, a 1440 y a 360 px. No quedan violaciones `serious` ni `critical`.

**Corregido en esta fase:** `label-content-name-mismatch` (grave) en el logo de todas las pantallas con sesión. El `aria-label` «Universidad Actúa, inicio» no coincidía con el texto visible (WCAG 2.5.3). Ahora el nombre sale del texto visible más «, inicio» oculto a la vista. En móvil, el nombre de la marca se oculta solo a la vista y no al lector. Prueba: `layout.test.jsx › el nombre accesible del logo contiene su texto visible`.

## Comparación con Figma a 1440 px

Muestra: P09 reservar ambiente, P12 usuarios y P07 gestión de área, frente a las capturas de `docs/superpowers/plans/capturas-figma/`.

| Pantalla | Diferencias | ¿Afecta a una HU? |
| --- | --- | --- |
| Estructura común | Sin migas de pan; la marca está en el topbar y no en la barra lateral; los elementos del menú no llevan casilla; el nombre y el botón «Cerrar sesión» van arriba a la derecha. Son decisiones de la fase 01. | No |
| P09 Reservar ambiente | Los filtros (tipo, pabellón, capacidad, fecha) van en una fila sobre las tarjetas. La lista de reglas de la política se reemplaza por el aviso «La política vigente de reservas se valida al enviar», porque el contrato no expone la política a los solicitantes. Las franjas se muestran como una lista de texto y no como fichas. | No |
| P12 Usuarios | Faltan los filtros por rol, área y estado del frame; HU-15 no los exige. Los correos largos se parten a mitad de palabra y las acciones de fila ocupan dos líneas a 1440 px. | No (menor, pendiente) |
| P07 Gestión de área | Coincide en filtros y tabla. A 360 px la tabla se convierte en tarjetas y no desborda. | No |

## Adaptación a 360 y 768 px

- Ninguna ruta desborda horizontalmente.
- El menú lateral se abre como diálogo («Abrir menú»).
- Las tablas pasan a tarjetas con etiqueta y valor.

## Teclado y foco

- Los diálogos cierran con Escape y devuelven el foco al botón que los abrió (`Dialog` y menú móvil, pruebas unitarias de las fases 01 y 02).
- Los recorridos E2E operan solo con roles y etiquetas accesibles (`getByRole` y `getByLabel`). Cada control usado tiene nombre accesible.
- No recorrí cada pantalla a mano con Tab y Shift+Tab.

## Pendiente (no afecta a ninguna HU)

- **Tema oscuro:** `DESIGN.md` define `themes.dark`, pero `src/styles/tokens.css` solo implementa el claro. Con `prefers-color-scheme: dark` la aplicación sigue en claro, que es legible y pasa el contraste.
- **Usuarios a 1440 px:** los correos se cortan a mitad de palabra y las acciones de fila ocupan dos líneas.
