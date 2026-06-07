# Hooks Directory (core-app)

Thin TanStack Query wrappers. Use `AxiosError`, not `Error`.
`export function`, not `export const`. Pass a direct `mutationFn`/`queryFn`
reference when the signature already matches — don't re-wrap it.
Query keys: exported const arrays like `['domain', 'resource']`.

Read: `.claude/rules/native-hook.md`
