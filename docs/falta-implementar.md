# Falta implementar

Pendientes detectados en la revisión del 6 de noviembre de 2026.

> Estado: **implementado en Figma** el 6 de noviembre de 2026. Este documento se conserva como registro de lo que se hizo y de las decisiones tomadas.

---

## 1. Página 04 · Estudiante — falta la pantalla "Inicio"

**Situación inicial**

- El sidebar mostraba "Inicio", pero ese ítem apuntaba a `P03 · Mis solicitudes`.
- El login (`P01`) llevaba directo a `P03`.
- No existía un frame de inicio para el rol Estudiante.

**Implementado**

- `P00 · Inicio — Estudiante` creado en 1440×1024, ubicado a la izquierda de P03.
- Cuatro KPI (`Kpi Card`), tarjeta de últimas solicitudes, tarjeta de próximas reservas y CTA "Registrar solicitud".
- Sidebar "Inicio" y `P01 · Ingresar` apuntan a P00; la tarjeta de solicitudes abre P05, la de reservas abre P10, y los enlaces "Ver todas" y "Reservar ambiente" llevan a P03, P10 y P09.

**Especificación de referencia**

- Crear `P00 · Inicio — Estudiante` (1440×1024; variante 1280 si se conserva la pareja responsive).
- Contenido mínimo:
  - Saludo con nombre y rol.
  - Tres indicadores: solicitudes activas, resueltas del mes y reservas próximas.
  - Accesos rápidos: "Registrar solicitud" → P04 y "Reservar ambiente" → P09.
  - Bloque "Próximas reservas" (2 filas) → P10.
  - Bloque "Últimas solicitudes" (3 filas) → P05.
  - Estado vacío cuando no haya actividad.
- Datos: `GET /requests` y `GET /reservations?vista=propias`. No existe endpoint de resumen para estudiante; los indicadores se derivan en cliente.
- Navegación: sidebar "Inicio" → P00; `P01 · Ingresar` → P00; desde P00 hacia P03, P04, P05, P09 y P10.
- Criterio de cierre: P00 existe, usa tokens y componentes, y "Inicio" deja de apuntar a P03.

---

## 2. Página 06 · Administrador — "Dashboard" debe decir "Inicio" y falta el frame

**Situación inicial**

- El sidebar de `P12`, `P13`, `P14` y `P15` mostraba "Dashboard" y no navegaba a ninguna pantalla.
- No existía un frame de inicio para Administración.

**Implementado**

- Sidebar de P12, P13, P14 y P15 renombrado a "Inicio".
- `P00 · Inicio — Administrador` creado en 1440×1024, a la izquierda de P12.
- Cuatro KPI, solicitudes recientes, reservas pendientes y accesos rápidos a P12, P13 y P14.

**Especificación de referencia**

- Renombrar el ítem del sidebar de P12, P13, P14 y P15 de "Dashboard" a "Inicio".
- Crear `P00 · Inicio — Administrador` (1440×1024):
  - Cuatro indicadores: usuarios activos, solicitudes abiertas, reservas pendientes y SLA en riesgo.
  - Accesos directos: Usuarios → P12, Catálogos → P13 y Configuración → P14.
  - Tabla "Solicitudes recientes" (4 filas) con estado y prioridad.
  - Bloque "Reservas pendientes de aprobación" (2 filas).
  - Estados de carga y error.
- Datos: `GET /dashboard/summary` y `/reports` (los mismos que P08).
- Navegación: "Inicio" → P00; desde P00 hacia P12, P13 y P14.
- Criterio de cierre: el ítem dice "Inicio", el frame existe y es su destino.

---

## 3. Consistencia y notas de implementación

- Nombrar los frames `P00` y colocarlos antes de P01/P12 en el orden de cada página.
- Mantener 1440 y 1280 solo si se conserva la pareja responsive de P01/P02.
- Usar variables de color y texto; no introducir hex sueltos.
- Reutilizar componentes existentes; un solo CTA amarillo por pantalla.
- No duplicar P08: el dashboard de indicadores del supervisor se mantiene igual.
- Prototipo: la API de Figma solo permite `NAVIGATE` dentro de la misma página, así que los enlaces de P00 admin a P12/P13/P14 sí son cableables; cualquier cruce entre páginas queda fuera.

---

## 4. Checklist

- [x] `P00 · Inicio — Estudiante` creado.
- [x] Sidebar "Inicio" del estudiante apunta a P00.
- [x] `P01 · Ingresar` apunta a P00.
- [x] Sidebar de administración renombrado de "Dashboard" a "Inicio".
- [x] `P00 · Inicio — Administrador` creado.
- [x] Enlaces de P00 admin a P12, P13 y P14.
- [ ] Estados vacío, carga y error revisados.
- [ ] Contraste WCAG 2.2 AA verificado.
