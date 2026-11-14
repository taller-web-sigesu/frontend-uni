# AGENTS.md — Frontend

## Política obligatoria de ramas
- Nunca edites ni confirmes cambios directamente en `main`.
- Antes de modificar código, verifica la rama actual y crea una rama por tarea desde `main` (`feature/...`, `fix/...` o `docs/...`).
- Integra cambios a `main` únicamente mediante una PR revisada por otro compañero.

## Dev environment tips
- Stack: React + Vite.
- Read `DESIGN.md` before modifying the user interface.
- Read `ARCHITECTURE.md` when available.
- Find user stories in `../infra-uni/docs/requirements/user-stories/`.
- Reuse existing components and follow the design system.
- Run `npm install` to install dependencies when needed.
- Run `npm run dev` for development outside Docker.
- Use Docker Compose from `infra-uni` for the shared local environment.

## Testing instructions
- Run `npm run build` to verify the production build.
- Run `npm run lint` if the script exists.
- Run the configured tests if available.
- Add or update tests when changing application behavior.
- Check responsive layouts and accessibility (the app is light-only; dark mode is out of scope).
- Do not claim tests passed unless they were executed.

## PR instructions
- Title format: `[frontend] Brief description`.
- Keep changes focused on the assigned user story.
- Do not invent API endpoints; follow the agreed API contracts.
- Verify the affected screens before submitting a PR.
- Include a summary of changes and tests performed.
