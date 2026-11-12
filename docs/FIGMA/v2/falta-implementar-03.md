# Falta implementar · 03

Tercera revisión de pendientes, 12 de noviembre de 2026: rol **Docente** ([decisiones 02](../../../../infra-uni/docs/decisiones/decisiones-02.md)).

> Estado: **pendiente en Figma**.

---

## 1. Qué cambia

El docente tiene los mismos permisos que el estudiante: registra y sigue solicitudes, adjunta evidencias, comenta, responde la encuesta y reserva ambientes. No tiene área y su cuenta la crea el administrador; no se auto-registra.

No hacen falta pantallas nuevas: el docente reutiliza las pantallas de `04 · Estudiante`.

## 2. Cambios en Figma

- `00 · Cover`: agregar Docente a la leyenda de roles.
- `03 · Flows`: agregar Docente a la matriz rol × pantalla con las mismas pantallas que Estudiante.
- `P12 · Administración de usuarios`: agregar «Docente» al selector de rol; con ese rol el campo Área queda deshabilitado.
- Sidebar y topbar: el docente ve el mismo menú que el estudiante; en el perfil y en la topbar se muestra el rol «Docente».
- Pantalla de registro (si ya existe): el formulario no ofrece elegir rol; todo auto-registro es Estudiante.

## 3. Checklist

- [ ] Leyenda de roles en `00 · Cover`.
- [ ] Matriz rol × pantalla en `03 · Flows`.
- [ ] Selector de rol en P12 con «Docente» y área deshabilitada.
- [ ] Etiqueta de rol «Docente» en topbar y perfil (P16).
