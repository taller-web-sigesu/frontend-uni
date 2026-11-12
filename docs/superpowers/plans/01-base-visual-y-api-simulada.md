# Fase 01 · Base visual, navegación y API simulada

**Objetivo.** Preparar la base compartida para implementar las HU-01 a HU-25 en React + Vite con JavaScript, tema claro y diseño adaptable. La entrega funcional se verifica en Docker local y CI.

## Orden de entrega

1. Base visual, navegación y API simulada.
2. [Acceso, sesión y perfil](02-acceso-sesion-y-perfil.md).
3. [Solicitudes y atención](03-solicitudes-y-atencion.md).
4. [Indicadores y administración](04-indicadores-y-administracion.md).
5. [Reservas y ambientes](05-reservas-y-ambientes.md).
6. [Integración y entrega local](06-integracion-y-entrega-local.md).

## Referencias y dependencias

Usar Figma para composición, DESIGN.md para tokens, las HU para comportamiento y permisos, y OpenAPI aprobado para métodos, campos y errores. Los documentos REST actuales son propuestas. Al integrar, reemplazar los datos simulados por las respuestas reales del mismo adaptador HTTP.

- [Arquitectura frontend](../../../ARCHITECTURE.md) · [Sistema visual](../../../DESIGN.md) · [Revisión UI/UX](../../FIGMA/v2/mejora-ui-ux-01.md)
- [Historias de usuario](https://github.com/taller-web-sigesu/infra-uni/tree/main/docs/requirements/user-stories) · [Diseño REST](https://github.com/taller-web-sigesu/backend-uni/blob/main/docs/API-DISENIO.md) · [Contratos y plan backend](https://github.com/taller-web-sigesu/backend-uni/blob/main/docs/plan/00-contratos-y-decisiones.md)
- [Componentes](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=17-4) · [Estados](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=17-9) · [Handoff](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=17-10)

| Flujo | Proyección que debe cerrar backend antes de integrar |
| --- | --- |
| Solicitudes | Etiquetas legibles de categorías, prioridades y estados. Marca de encuesta respondida persistente. |
| Supervisión | Opciones de prioridad editables mediante lectura autorizada para el supervisor. |
| Indicadores | Etiquetas de categorías, prioridades y responsables junto a sus agrupaciones. |
| Reservas | Identificador del propietario en la bandeja de aprobación y opciones del tipo de espacio para el selector. |

- [ ] Incorporar las formas acordadas al contrato y a las respuestas simuladas antes de conectar cada flujo. Usar una lectura autorizada para cada selector. Para datos de una fila o agrupación, preferir incluirlos en la respuesta de la operación que los muestra.

## Tareas

- [ ] En `src/app/`, configurar React Router con layouts público y autenticado. En `src/components/layout/`, implementar sidebar y topbar de escritorio y menú lateral modal por debajo de 768 px. Usar formularios de una columna y convertir las filas en tarjetas etiquetadas en móvil.
- [ ] En `src/components/ui/` y `src/styles/`, incorporar tokens de tema claro y los componentes comunes. Incluir botones, campos, badges, tablas, paginación, diálogos, esqueletos, mensajes de error y estados vacíos. Devolver el foco al cerrar diálogos, mantener foco visible y usar texto para identificar estados.
- [ ] En `src/services/`, centralizar Fetch con prefijo `/api/v1`, IDs como cadenas y página inicial cero con tamaño 20. Interpretar JSON, CSV y `204`. Normalizar errores `application/problem+json`, incluidos códigos y errores de campo si existen. Distinguir red, 400, 401, 403, 404, 409 y 429. Al cambiar filtros, volver a página cero y descartar respuestas obsoletas.
- [ ] Activar MSW de forma explícita en desarrollo y pruebas. Usar datos ficticios deterministas por rol y simular lecturas, escrituras y errores sobre el mismo cliente HTTP. En modo real, mostrar la falla de red y permitir reintentar lecturas.
- [ ] Aplicar las reglas pertinentes de `vercel-react-best-practices`. Cargar rutas por módulo bajo demanda, iniciar juntas las lecturas independientes y derivar valores durante el render. Ejecutar escrituras desde eventos, bloquear el envío pendiente y conservar los datos del formulario si falla.

**Aceptación.** Comprobar navegación, diálogos, carga, vacío, error y reintento a 360, 768 y 1440 px. Verificar que una respuesta antigua no reemplace un filtro nuevo y que ambos modos usan los mismos adaptadores.

## Capturas de Figma

<details>
<summary>Estados transversales</summary>

![Estados transversales](capturas-figma/estados-transversales.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=56-2)

</details>
