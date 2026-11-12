---
version: alpha
name: UniService Dashboard
description: Sistema de diseño minimalista para la gestión de solicitudes y servicios universitarios, inspirado en un dashboard moderno de tickets.
colors:
  primary: "#FACC15"
  secondary: "#64748B"
  accent: "#EAB308"
  background: "#FAFAFA"
  surface: "#FFFFFF"
  surface-variant: "#F8F9FA"
  ink: "#18181B"
  ink-muted: "#71717A"
  on-primary: "#18181B"
  border: "#E4E4E7"
  error: "#DC2626"
  success: "#15803D"
  warning: "#B45309"
  info: "#0369A1"
themes:
  default: light
  light:
    background: "#FAFAFA"
    surface: "#FFFFFF"
    surface-variant: "#F8F9FA"
    ink: "#18181B"
    ink-muted: "#71717A"
    border: "#E4E4E7"
  dark:
    background: "#111315"
    surface: "#1B1D20"
    surface-variant: "#23262A"
    ink: "#F4F4F5"
    ink-muted: "#A1A1AA"
    border: "#34373C"
typography:
  display:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.01em
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  status-badge:
    rounded: "{rounded.sm}"
    typography: "{typography.label}"
---

# UniService Dashboard

## Overview

Un sistema visual limpio, profesional y compacto para estudiantes, docentes, técnicos, supervisores y administradores. Inspirado en la referencia de gestión de tickets: **sidebar delgada, tarjetas KPI, filtros horizontales y tablas legibles**. El diseño prioriza productividad, claridad y consistencia.

## Colors

El **amarillo primario** (`#FACC15`) identifica acciones principales y navegación activa, con texto oscuro. El fondo claro (`#FAFAFA`) contrasta suavemente con las tarjetas blancas (`#FFFFFF`). El gris secundario ordena textos y controles. Los colores de éxito, advertencia y error comunican estados reales, siempre acompañados de texto.

El **modo claro es predeterminado**; el oscuro utiliza los tokens de `themes.dark` sin alterar jerarquía ni componentes. Los tokens semánticos deben mapearse a variables CSS; evitar colores hardcodeados en cada pantalla.

## Typography

**Inter** en toda la interfaz: titulares semibold de 22–28px, cuerpo regular de 14–16px y etiquetas medium de 12–13px. Valores KPI de 28px, números tabulares en métricas y tablas. Priorizar lectura rápida sobre títulos decorativos.

## Layout

Espaciado basado en múltiplos de 4px: 16px dentro de formularios, 24px en tarjetas y entre bloques. **Sidebar colapsada de 60px**, expandida de 224px; topbar de 60px y contenido con máximo de 1440px. En móvil, sidebar como drawer, formularios a una columna y tablas adaptables.

## Shapes

Inputs y botones con radio de 8px; tarjetas con 12px; badges discretos de 4px; avatares circulares. Bordes de 1px y sombras mínimas. Evitar glassmorphism, gradientes decorativos y elevación excesiva.

## Components

**Botones:** una acción primaria amarilla por sección; secundarios neutros y destructivos con estilo de error. **Inputs:** etiqueta visible, borde suave, estados de foco, error y deshabilitado. **Cards:** superficie neutra, borde discreto y datos claros. **KPI:** etiqueta, valor y tendencia solo si hay datos reales. **Tablas:** búsqueda, filtros, ordenamiento, paginación, estados vacíos y acceso al detalle. **Badges:** mostrar siempre el nombre del estado o prioridad, nunca solo el color.

Las vistas principales incluyen **login, dashboard, solicitudes, detalle, asignaciones, administración y perfil**. Los estados funcionales son: Registrada, En evaluación, Asignada, En atención, Resuelta y Cerrada.

## Do's and Don'ts

- Do mantener la tabla de solicitudes como elemento principal en escritorio.
- Do reutilizar componentes y tokens en todas las pantallas y roles.
- Do ofrecer estados de carga, vacío, error, foco y confirmación.
- Do comprobar modo claro, oscuro, responsive y accesibilidad WCAG 2.2 AA (texto normal ≥4.5:1).
- Don't saturar la interfaz con amarillo ni convertir todas las acciones en botones primarios.
- Don't inventar métricas, estados, permisos o funcionalidades ajenas a las historias de usuario.
- Don't mezclar estilos, radios o librerías visuales sin una decisión documentada.
- Don't usar la imagen de referencia como definición de reglas de negocio.

## Agent Guidance

Antes de implementar interfaces, leer `DESIGN.md`, `ARCHITECTURE.md` y la historia `HU-XXX.md` correspondiente. Reutilizar componentes existentes; no improvisar tokens, endpoints ni permisos. Verificar visualmente ambos temas y los criterios de aceptación antes de cerrar una tarea.
