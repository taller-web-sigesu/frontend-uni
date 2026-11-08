# Plan de mejora UI/UX · Técnico y Supervisor

Fecha de revisión: 8 de noviembre de 2026.

Estado: **hallazgos UIUX-01 a UIUX-09 implementados en Figma** el 8 de noviembre de 2026. Las secciones 3 (interacciones) y 4 (responsive) quedan pendientes por decisión de alcance.

## 1. Alcance y método

Revisión de solo lectura mediante el MCP de Figma de la [página Técnico y Supervisor de GESTAL V2](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=17-7).

Se inspeccionaron capturas y propiedades de las ocho pantallas de la página. Se contrastaron los hallazgos con `../DESIGN.md`, `falta-implementar-02.md` y las historias HU-08, HU-11, HU-12 y HU-23 del repositorio de infraestructura.

| Pantalla | Nodo |
| --- | --- |
| P00 · Inicio — Técnico | `230:2` |
| P06 · Mi bandeja — Técnico | `65:2` |
| P05b · Detalle de solicitud — Técnico | `67:235` |
| P07 · Gestión de área — Supervisor | `65:122` |
| P08 · Dashboard de indicadores — Supervisor | `66:134` |
| P05c · Detalle de solicitud — Supervisor (acciones) | `67:341` |
| P05d · Detalle de solicitud — Supervisor (auditoría) | `67:442` |
| P11 · Aprobación de reservas — Supervisor | `70:611` |

Este documento es el único entregable de la tarea. No autoriza ni implica modificaciones de Figma, implementación de pantallas o creación de código. Las acciones siguientes describen trabajo futuro.

### Dirección propuesta

Conservar Inter, el amarillo institucional, la navegación por roles y los componentes existentes. Priorizar reglas de negocio, datos y acciones antes del pulido visual. El frontend inspeccionado contiene una pantalla de arranque React/Vite: los hallazgos se refieren al diseño, no a defectos comprobados en una aplicación funcional.

## 2. Hallazgos confirmados y correcciones

### UIUX-01 · Cierre incompatible con el estado de la solicitud

**Prioridad: alta. Pantalla: P05c (`67:341`).**

La solicitud muestra «En atención» y ofrece «Cerrar solicitud». HU-11 permite cerrar una solicitud resuelta, tras verificar su conformidad.

**Propuesta:** ofrecer el cierre únicamente en «Resuelta», con confirmación. No ofrecer cambios de estado ni reasignaciones en estados finales. Mantener el rechazo con motivo obligatorio conforme a HU-11.

**Criterio de aceptación:** el estado mostrado y las acciones disponibles cumplen la misma matriz de transiciones en tabla, detalle y confirmación.

### UIUX-02 · Período contradictorio en indicadores

**Prioridad: alta. Pantalla: P08 (`66:134`).**

El subtítulo indica «1 oct – 31 oct 2026», mientras el selector muestra del 01/11/2026 al 30/11/2026.

**Propuesta:** emplear un único período aplicado para subtítulo, métricas, gráficos y exportación. Diferenciar un rango en edición del aplicado si el flujo requiere confirmarlo.

**Criterio de aceptación:** al cambiar el período, todas las representaciones y la exportación corresponden al mismo rango.

### UIUX-03 · Gráficos con dimensiones equivocadas

**Prioridad: alta. Pantalla: P08 (`66:134`).**

«Por prioridad» muestra Reg/Pend/Aten/Cerr, etiquetas de estados. «Por responsable» muestra Redes/Soporte/Infraestructura/Otros, categorías en vez de personas.

**Propuesta:** usar prioridades reales y nombres de técnicos, respectivamente. Añadir valores y unidades visibles; evitar que interpretar el gráfico dependa únicamente de la longitud de sus barras.

**Criterio de aceptación:** título, etiquetas, valores y dimensión representada coinciden en los tres gráficos.

### UIUX-04 · Métricas duplicadas y bases poco claras

**Prioridad: alta. Pantalla: P08 (`66:134`).**

«Atendidas» aparece en la franja superior y en una tarjeta. El porcentaje de resueltas muestra «73.1 %» y «412 de 564 solicitudes», sin explicar su relación con los otros totales.

**Propuesta:** mantener los nueve indicadores de HU-12 sin duplicaciones. Documentar numerador, denominador y alcance temporal de cada indicador. Usar un conjunto de datos de ejemplo coherente; no inferir fórmulas nuevas a partir del mockup.

**Criterio de aceptación:** cada indicador tiene una definición inequívoca y sus cifras se pueden reconciliar con los datos de ejemplo.

### UIUX-05 · Botones de aprobación superpuestos

**Prioridad: alta. Pantalla: P11 (`70:611`).**

Los botones `70:679` y `70:681` miden 120 px y comienzan en x=914 y x=1018 dentro de la fila: se superponen 16 px. El patrón se repite en la segunda fila pendiente.

**Propuesta:** agrupar acciones con Auto Layout, ancho ajustado al texto y separación mínima de 8 px. Destacar Aprobar y usar una variante de peligro secundaria para Rechazar. Ajustar la columna de acciones al ancho necesario.

**Criterio de aceptación:** botones separados, etiquetas completas y ninguna superposición con otras columnas.

### UIUX-06 · Tarjetas KPI sin separación

**Prioridad: alta. Pantalla: P00 (`230:2`).**

Las tarjetas `230:67`, `230:71`, `230:75` y `230:79` miden 296 px, pero sus posiciones avanzan 292 px. Se superponen 4 px entre tarjetas y la última excede el borde derecho habitual del contenido.

**Propuesta:** distribuir cuatro columnas de 276 px con separaciones de 16 px dentro de los 1152 px disponibles, mediante Auto Layout.

**Criterio de aceptación:** tarjetas sin solapamientos y bordes exteriores alineados con el resto del contenido.

### UIUX-07 · Filas de auditoría más anchas que su panel

**Prioridad: media. Pantalla: P05d (`67:442`).**

Las filas `67:528`, `67:531` y `67:534` miden 640 px dentro de un panel de 400 px. Los textos actuales no evidencian todo el riesgo de recorte.

**Propuesta:** ajustar filas al ancho interior del panel, reservar una columna estable para fecha/hora y permitir crecimiento vertical del mensaje.

**Criterio de aceptación:** nombres y eventos largos se leen completos, sin desbordamiento horizontal ni solapamiento vertical.

### UIUX-08 · Paginación y cantidades inconsistentes

**Prioridad: media. Pantallas: P11, P00 y P06.**

P11 presenta cuatro filas, pero indica «Mostrando 1–5 de 9». P00 combina «8 solicitudes asignadas» con un total de 24 en «Solicitudes prioritarias», sin explicar el alcance de cada conjunto. P06 muestra cuatro filas frente a ocho asignadas, sin un mecanismo visible para recorrer el resto.

**Propuesta:** vincular rango, total y filas al mismo conjunto de ejemplo. Explicar si los contadores incluyen solo solicitudes activas o también históricas. Añadir paginación a la bandeja cuando el conjunto exceda las filas mostradas. En los resúmenes del inicio, usar un subconjunto explícito y «Ver todas» para abrir la lista completa.

**Criterio de aceptación:** cada contador tiene un alcance claro y todos los registros anunciados son accesibles.

### UIUX-09 · Texto técnico y nomenclatura irregular

**Prioridad: media. Pantallas: P06, P08, P05d y badges compartidos.**

Se observan «El servidor impone el orden…», «El backend no reporta este dato», el identificador `EN_PROCESO` en auditoría y prioridades escritas tanto en mayúsculas como en formato de oración.

**Propuesta:**

- En la bandeja: «Primero las solicitudes de mayor prioridad; dentro de cada prioridad, las más antiguas».
- En vencidas: conservar «No disponible», como establece HU-12, con una explicación orientada al usuario, sin referencias al backend.
- En auditoría: presentar «En atención» en lugar del identificador técnico correspondiente, sin cambiar el valor interno.
- Unificar prioridades como «Alta», «Media» y «Baja».
- Ordenar la auditoría por fecha y hora; actualmente 08:56 aparece después de 08:55 en una secuencia descendente.

**Criterio de aceptación:** términos consistentes entre tabla, detalle, historial y auditoría, sin exponer nombres internos innecesarios.

## 3. Mejoras de interacción propuestas

Estas propuestas completan la experiencia observada. No implican que los estados o componentes estén ausentes de todo el archivo: antes de diseñarlos deberá revisarse su disponibilidad en las páginas compartidas de componentes, flujos y estados.

### Asignación y reasignación

- Identificar dentro del panel de P07 la solicitud que se está asignando.
- Mostrar una selección inequívoca del técnico y aclarar su pertenencia al área; diferenciar especialidad y área si ambas se presentan.
- Incorporar el ajuste de prioridad previsto en HU-08.
- Diseñar validación sin técnico seleccionado, guardado en curso, éxito y error conservando los datos elegidos.

**Aceptación:** la persona sabe qué solicitud modifica, a quién asigna y con qué prioridad antes de confirmar.

### Acceso al detalle y auditoría

- Conservar las reglas ya corregidas de P06: Asignada → Iniciar atención; En atención → Marcar resuelta; Resuelta → Ver detalle.
- Añadir acceso explícito al detalle mediante el código enlazado en todas las filas; no depender exclusivamente de un hotspot sobre la fila.
- Conectar las variantes P05c y P05d con pestañas visibles «Actividad» y «Auditoría», preservando solicitud y permisos.
- En solicitudes resueltas fuera de plazo, presentar el SLA como resultado histórico, por ejemplo «Resuelta fuera de plazo», cuando los datos lo justifiquen.

**Aceptación:** abrir el detalle no requiere ejecutar una transición; cambiar de pestaña conserva el contexto.

### Aprobación y rechazo de reservas

- Completar rechazo con motivo obligatorio, error junto al campo y confirmación.
- Representar reserva propia, conflicto de horario y reserva ya procesada según HU-23.
- Situar la explicación cerca de la acción afectada; el aviso general de no autoaprobación no sustituye el estado particular de cada fila.
- Mostrar resultado de la operación y actualizar fila, contadores e historial de forma coherente.

**Aceptación:** los casos de rechazo sin motivo, autoaprobación y conflicto no se presentan como éxitos.

### Jerarquía visual

- Reducir el énfasis permanente de «Cerrar sesión» con una variante secundaria.
- Sustituir los cuadrados genéricos del menú por iconos consistentes, conservando etiquetas textuales.
- Reutilizar los componentes existentes y los tokens de `DESIGN.md`; no introducir una identidad visual nueva.

## 4. Responsive, accesibilidad y estados

- Preparar variantes a 1440, 1024 y 390 px. En móvil: navegación en drawer, tarjetas apiladas y paneles de detalle o asignación a ancho completo.
- Usar Auto Layout en tarjetas, acciones, filtros y filas variables. Permitir ajuste de texto sin depender de coordenadas fijas.
- Mantener datos y acciones esenciales accesibles en tablas pequeñas; evitar desbordamiento de toda la página.
- Reutilizar o completar carga, vacío, error, foco y deshabilitado. Diferenciar una lista vacía de una búsqueda sin resultados.
- Medir contraste con colores efectivos, verificar etiquetas de controles y foco visible. Usar 44 × 44 px como objetivo de área táctil para controles interactivos.
- En la futura implementación, comprobar teclado, retorno del foco tras cerrar diálogos, anuncios de errores y zoom al 200 %.
- Validar ambos temas si se implementa el modo oscuro definido en `DESIGN.md`; las capturas revisadas corresponden al tema claro.

La revisión de capturas y propiedades no certifica accesibilidad ni comportamiento responsive de una implementación.

## 5. Secuencia de trabajo futuro

1. **Coherencia funcional y de datos:** resolver UIUX-01 a UIUX-04, definir matrices por estado y reconciliar los datos de ejemplo.
2. **Geometría y componentes:** resolver UIUX-05 a UIUX-08 con componentes compartidos, Auto Layout y anchos adaptables.
3. **Experiencia y contenido:** aplicar UIUX-09, completar asignación y aprobaciones, conectar detalle y auditoría, ajustar jerarquía visual.
4. **Validación:** recorrer flujos por rol, revisar estados, textos extensos, responsive y accesibilidad.

No se requieren en este plan nuevos endpoints, esquemas, permisos ni cambios de reglas de negocio. Cualquier incompatibilidad con contratos existentes deberá resolverse antes de implementar, sin deducir contratos a partir del diseño.

## 6. Checklist de aceptación

- [x] Asignar, iniciar atención, resolver y cerrar respeta estados y roles.
- [ ] Rechazar sin motivo muestra validación y conserva lo escrito.
- [ ] Aprobar una reserva propia o con conflicto muestra una explicación específica y no simula éxito.
- [x] Período, métricas, gráficos y exportación son coherentes.
- [x] Los nueve indicadores de HU-12 están representados sin duplicaciones.
- [x] Tarjetas y botones no se superponen.
- [x] Paginación, totales y filas visibles coinciden.
- [x] Auditorías y comentarios extensos no se recortan.
- [x] Tabla y detalle conservan la misma terminología y reglas de acciones.
- [ ] Los enlaces y acciones del prototipo se recorren por rol; los hotspots duplicados se eliminan solo después de comprobar sus destinos.
- [ ] Las variantes a 1440, 1024 y 390 px mantienen información y acciones accesibles.
- [ ] La futura implementación verifica teclado, foco, contraste y zoom al 200 %.

## 7. Implementación realizada

- **UIUX-01:** P05c queda en «En atención» con Reasignar y Rechazar; se crea `P05c2 · Detalle de solicitud — Supervisor (resuelta)` con estado «Resuelta», único botón «Cerrar solicitud» e historial actualizado.
- **UIUX-02:** el subtítulo de P08 dice «1 nov – 30 nov 2026», igual que el selector de fechas.
- **UIUX-03:** «Por prioridad» usa Baja/Media/Alta/Crítica; «Por responsable» usa Luis Rojas, Ana Torres, Carlos Vega y Otros; los tres gráficos muestran valores numéricos.
- **UIUX-04:** se elimina la tarjeta duplicada «Atendidas». Datos reconciliados: registradas 564 = pendientes 96 + atendidas 468; resueltas 412 (73.1 % de 564); categorías 210/150/120/84; prioridades 120/240/180/24; responsables 160/140/120/48.
- **UIUX-05:** Aprobar y Rechazar pasan a 96 px en x=900 y x=1012, sin superposición; la cabecera ACCIONES se alinea a 900.
- **UIUX-06:** las cuatro tarjetas KPI de P00 miden 276 px y avanzan 292 px, sin solaparse.
- **UIUX-07:** las filas de auditoría de P05d se ajustan a 341 px con texto multilínea.
- **UIUX-08:** P11 indica «Mostrando 1–4 de 9»; P06 incorpora paginación «1–4 de 8»; P00 técnico usa «1–4 de 8».
- **UIUX-09:** nota de P06 orientada al usuario; vencidas explica «Se habilita al activar el módulo de SLA»; auditoría muestra «En atención» y ordena 09:40, 09:12, 08:56, 08:55; prioridades unificadas como «Alta», «Media» y «Baja».
- **Jerarquía:** «Cerrar sesión» pasa a variante secundaria según lo acordado.

## 8. Límites de la revisión

Se verificaron visualmente las ocho pantallas indicadas y se consultó geometría de los elementos señalados. No se ejecutó un recorrido interactivo completo del prototipo ni se auditó todo el archivo. La existencia de capas de hotspots superpuestas merece revisión, pero no demuestra por sí sola una navegación rota.

El registro anterior marca como implementadas varias mejoras. Se conservarán las confirmadas en esta revisión —acciones de P06, denominación «Inicio» del supervisor y separación de botones de P05c— evitando repetir trabajo ya resuelto.

No se ejecutaron pruebas de la aplicación: la tarea es documental y no incluye cambios de código. Este archivo registra recomendaciones pendientes, no correcciones realizadas en Figma.
