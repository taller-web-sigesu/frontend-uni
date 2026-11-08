# Falta implementar · 02

Segunda revisión de pendientes, 6 de noviembre de 2026.

> Estado: **implementado en Figma** el 6 de noviembre de 2026. Se conserva como registro de lo que se cambió.

---

## 1. P03 · Mis solicitudes — la tabla no ocupa todo el ancho

**Situación actual**

- La tabla mide 1152 px, pero sus cinco columnas se concentran a la izquierda: CÓDIGO en 24, CATEGORÍA en 244, ESTADO en 504, PRIORIDAD en 724 y FECHA en 904.
- La última columna termina cerca de 947 px, así que quedan **~205 px vacíos** a la derecha.
- No hay columna de acciones; abrir el detalle depende de un hotspot sobre toda la fila.

**Propuesta**

- Agregar la columna **ACCIONES** con el enlace "Ver detalle" y redistribuir las seis columnas:

| Columna    | x   |
| ---------- | --- |
| CÓDIGO     | 24  |
| CATEGORÍA  | 200 |
| ESTADO     | 440 |
| PRIORIDAD  | 640 |
| FECHA      | 810 |
| ACCIONES   | 1000 |

- Mantener el hotspot de fila como acceso secundario.

**Criterio de cierre:** el contenido llega hasta x≈1100 y la tabla se percibe llena en 1440 px.

**Implementado:** columna ACCIONES agregada con "Ver detalle"; columnas en 24 / 200 / 440 / 640 / 810 / 1000.

---

## 2. P06 · Mi bandeja (Técnico) — la columna Acciones es ambigua

**Situación actual** (verificado en el frame)

| Estado      | Acción que muestra hoy |
| ----------- | ---------------------- |
| En atención | Iniciar atención       |
| Asignada    | Marcar resuelta        |
| En atención | Ver detalle            |
| Resuelta    | Ver detalle            |

- Dos filas con el mismo estado ("En atención") muestran acciones distintas.
- "Marcar resuelta" aparece sobre una solicitud **Asignada**, que todavía no se ha empezado a atender.
- El usuario no puede anticipar qué hará el botón.

**Propuesta**

- Definir una regla única por estado y aplicarla a todas las filas:

| Estado      | Acción            |
| ----------- | ----------------- |
| Asignada    | Iniciar atención  |
| En atención | Marcar resuelta   |
| Resuelta    | Ver detalle       |
| Cerrada     | Ver detalle       |

- Una sola acción principal por fila; "Ver detalle" como enlace, no como botón.
- Revisar P07 · Gestión de área con la misma regla si comparte la columna.

**Criterio de cierre:** ningún estado tiene dos acciones distintas y cada botón nombra la transición exacta.

**Implementado:** P06 quedó En atención → "Marcar resuelta", Asignada → "Iniciar atención", Resuelta → "Ver detalle". En P07, Registrada → "Asignar" y el resto → "Ver detalle"; además se repartieron sus columnas para que las acciones no desborden la tabla de 720 px.

---

## 3. P05 · Supervisor — "Inicio / Dashboard" es redundante

**Situación actual**

- El sidebar de P07, P08, P11, P05c y P05d muestra "Dashboard".
- El breadcrumb dice "Inicio / Dashboard" y el título de P08 es "Dashboard".
- Para el supervisor, el dashboard **es** su pantalla de inicio, así que el breadcrumb repite el destino.

**Propuesta**

- Renombrar el ítem del sidebar a **Inicio** en todas las pantallas del supervisor.
- Breadcrumb "Inicio" y título "Inicio" en P08.
- Actualizar el cableado: "Inicio" → P08 en P07, P11, P05c y P05d.
- No se duplica P08: sigue siendo la pantalla de indicadores, solo cambia la etiqueta.

**Criterio de cierre:** ninguna pantalla del supervisor dice "Dashboard" en navegación ni breadcrumb.

**Implementado:** sidebar, breadcrumb y título de P08 dicen "Inicio"; los hotspots del supervisor se regeneraron con el nuevo mapeo (Inicio → P08).

---

## 4. P11 · Aprobación de reservas — acciones por estado (confirmación)

**Confirmado en el frame**

- **Pendiente** → aparecen los dos botones: **Aprobar** y **Rechazar**.
- **Confirmada** → aparece el enlace **Ver detalle**.
- **Rechazada** → aparece el enlace **Ver detalle**.

**Propuesta**

- La regla es correcta; se mantiene.
- Aprobar como acción primaria y Rechazar como acción de peligro, con "Ver detalle" como enlace.
- Documentar la regla en la tabla de handoff para que no se confunda con la columna de P06.

**Criterio de cierre:** la regla queda escrita y aplicada en las cuatro filas.

**Estado:** confirmado y sin cambios; las cuatro filas ya cumplen la regla.

---

## 5. P05c · Detalle (Supervisor) — acciones demasiado juntas

**Situación actual**

| Botón            | x     | Ancho |
| ---------------- | ----- | ----- |
| Reasignar        | 950   | 120   |
| Rechazar         | 1070  | 120   |
| Cerrar solicitud | 1240  | 120   |

- Reasignar y Rechazar están **pegados** (0 px de separación).
- El espacio antes de "Cerrar solicitud" es de 50 px, así que el ritmo es irregular y cuesta distinguir acciones.

**Propuesta**

- Reordenar y separar sin cambiar colores ni variantes:

| Botón            | x     | Separación previa |
| ---------------- | ----- | ----------------- |
| Reasignar        | 1000  | —                 |
| Rechazar         | 1144  | 24 px             |
| Cerrar solicitud | 1288  | 24 px             |

- Alinear el grupo al borde derecho del contenido (1408) y dejar 24 px mínimos entre botones.
- Si se quiere reforzar la jerarquía, usar 32 px antes de Rechazar sin tocar los colores.

**Criterio de cierre:** ningún par de botones queda a menos de 16 px y el orden visual va de la acción neutra a la destructiva y luego a la primaria.

**Implementado:** Reasignar en 1000, Rechazar en 1144 y Cerrar solicitud en 1288, con 24 px entre botones y colores intactos.

---

## 6. Página 05 — no se distingue Técnico de Supervisor

**Situación actual**

- La página se llama "Técnico y Supervisor" y mezcla pantallas de ambos roles sin separación visual:
  - Técnico: P06 · Mi bandeja, P05b · Detalle.
  - Supervisor: P07 · Gestión de área, P08 · Inicio, P11 · Aprobaciones, P05c/P05d.
- Los sidebars sí cambian (Técnico: Inicio / Mi bandeja / Reservas / Perfil; Supervisor: Dashboard / Gestión de área / Reservas / Aprobaciones), pero al recorrer la página no hay ninguna marca de rol.
- Varias pantallas comparten nombre de flujo, lo que hace fácil confundir quién hace qué.

**Propuesta A (recomendada)**

- Dividir en dos páginas, aceptando la redundancia:
  - `05A · Técnico` con P06 y P05b.
  - `05B · Supervisor` con P08, P07, P11, P05c y P05d.
- Cada página con su propio punto de inicio de flujo y su sidebar correcto.

**Propuesta B (alternativa de bajo costo)**

- Mantener una sola página y añadir dos bandas de sección: "Rol · Técnico" y "Rol · Supervisor", con fondo tenue y encabezado.
- Añadir un chip de rol junto al usuario en el topbar de cada pantalla.

**Criterio de cierre:** al abrir la página se entiende de inmediato qué pantallas pertenecen a cada rol, sin leer el nombre completo del frame.

**Implementado (opción B):** la página 05 se reorganizó en dos bloques con banda "Rol · Técnico" (P06, P05b) y "Rol · Supervisor" (P07, P08, P11, P05c, P05d), cada banda con su subtítulo y número de pantallas. Se eligió esta opción porque separar en páginas rompería los enlaces de prototipo entre técnico y supervisor (`NAVIGATE` solo funciona dentro de la misma página).

---

## 7. Consistencia

- Mantener 1440×1024 y los tokens existentes; no introducir hex sueltos.
- Un solo CTA amarillo por pantalla.
- Reutilizar `Badge / Status`, `Badge / Priority`, `Pagination` y los botones del sistema.
- Revisar el handoff (`08`) para que la regla de acciones de P06 y P11 quede escrita.

---

## 8. Checklist

- [x] P03 con columnas distribuidas y columna ACCIONES.
- [x] Regla de acciones única en P06 (y P07 si aplica).
- [x] Supervisor: "Dashboard" reemplazado por "Inicio" en sidebar, breadcrumb y título.
- [x] Regla de P11 confirmada y documentada en este archivo.
- [x] P05c con separación mínima de 24 px entre acciones.
- [x] Roles Técnico y Supervisor separados por banda de sección.
- [x] Prototipo de navegación actualizado por rol.
