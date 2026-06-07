# Screen Directory (core-app)

Every screen wraps in `ScreenContainer`. Forms go in a `form/` subdirectory.
Screens call hooks, NEVER services directly.
Use `export const` for components (hooks/services use `export function`).

Read: `.claude/rules/native-screen.md` and `.claude/rules/native-conventions.md`
