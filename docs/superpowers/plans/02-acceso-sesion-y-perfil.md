# Fase 02 · Acceso, sesión y perfil

**Alcance.** HU-01 y HU-02. Depende de la [fase 01](01-base-visual-y-api-simulada.md). El flujo simulado permite avanzar mientras backend implementa sesión.

**Fuentes.** [Contrato de autenticación](https://github.com/taller-web-sigesu/backend-uni/blob/main/docs/api/autenticacion.md) · [Plan de sesión backend](https://github.com/taller-web-sigesu/backend-uni/blob/main/docs/plan/01-fundaciones-y-sesion.md) · [P01 Ingreso](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=47-2) · [P02 Primer ingreso](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=47-80) · [P16 Perfil](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=74-549)

## Tareas

- [ ] En `src/features/auth/`, implementar `/login` con `POST /auth/login`, campos correo y contraseña, visibilidad de contraseña, error genérico de credenciales y tratamiento de `429`. En `/cambiar-contrasena` y `/perfil`, usar `PATCH /auth/password`; validar coincidencia de la confirmación local y reemplazar las credenciales con la respuesta. Mostrar en perfil los datos disponibles en sesión.
- [ ] En `src/app/`, restaurar sesión antes de decidir rutas. Redirigir primer ingreso al cambio obligatorio y permitir cerrar sesión desde allí. En una sesión habilitada dirigir a supervisor a `/indicadores` y a los demás roles a `/inicio`. Aplicar permisos al navegar y al abrir enlaces directos.
- [ ] Mantener el JWT en memoria. Enviar la cookie de refresh mediante el navegador y seguir los controles de origen y CSRF acordados con backend. Compartir un refresh entre peticiones simultáneas de la pestaña y serializarlo entre pestañas del mismo origen con Web Locks. Ante `401` de negocio, renovar y reintentar una vez. Excluir las operaciones de autenticación de ese reintento.
- [ ] Cerrar sesión con `POST /auth/logout`. Tras confirmación o rechazo del refresh, limpiar datos privados, invalidar respuestas pendientes y volver al ingreso. Si falla la red durante logout, mostrar que la revocación está pendiente y ofrecer reintento.

## Aceptación

- [ ] Probar login válido e inválido, `429`, primer ingreso, cambio de contraseña y acceso directo con rol incorrecto.
- [ ] Probar recarga, dos peticiones protegidas concurrentes y dos pestañas con refresh. Confirmar que las respuestas tardías no restauren una sesión cerrada.
- [ ] En Docker, comprobar la cookie, los controles de origen y CSRF, y la revocación inmediata del JWT y del refresh de la sesión cerrada.

## Capturas de Figma

<details>
<summary>P01 · Inicio de sesión</summary>

![P01 · Inicio de sesión](capturas-figma/p01-iniciar-sesion.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=47-2)

</details>

<details>
<summary>P01 · Inicio de sesión a 1280 px</summary>

![P01 · Inicio de sesión a 1280 px](capturas-figma/p01-iniciar-sesion-1280.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=47-50)

</details>

<details>
<summary>P02 · Cambio de contraseña obligatorio</summary>

![P02 · Cambio de contraseña obligatorio](capturas-figma/p02-cambio-obligatorio.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=47-80)

</details>

<details>
<summary>P02 · Cambio obligatorio a 1280 px</summary>

![P02 · Cambio obligatorio a 1280 px](capturas-figma/p02-cambio-obligatorio-1280.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=47-103)

</details>

<details>
<summary>P16 · Perfil y contraseña</summary>

![P16 · Perfil y contraseña](capturas-figma/p16-perfil.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=74-549)

</details>

<details>
<summary>P01 · Credenciales inválidas</summary>

![P01 · Credenciales inválidas](capturas-figma/p01-credenciales-invalidas.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=56-60)

</details>

<details>
<summary>P01 · Límite de intentos</summary>

![P01 · Límite de intentos](capturas-figma/p01-limite-intentos.png)

[Ver frame en Figma](https://www.figma.com/design/9qJJaiyMwZ1ZON36LkmbyR/GESTAL-V2?node-id=56-69)

</details>
