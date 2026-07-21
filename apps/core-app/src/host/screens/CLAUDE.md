# Screen Directory (core-app)

Every screen wraps in `ScreenContainer`. Forms go in a `form/` subdirectory.
Screen-local presentational components go in `components/<Name>.tsx` — one component per file,
never defined inline in the screen file. Inline hooks move to `../../hooks/<domain>/`; shared
constants (icons, labels) move to the feature's `utils.ts`. The screen file holds ONLY the screen.
Screens call hooks, NEVER services directly.
Use `export const` for components (hooks/services use `export function`).

Read: `.claude/rules/native-screen.md` and `.claude/rules/native-conventions.md`
