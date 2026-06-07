# vritti-core

pnpm workspace monorepo containing the Vritti Core (Platforms) backend and frontend.

## Apps

| App | Stack | Port | Path |
|-----|-------|------|------|
| core-server | NestJS + Fastify + Drizzle | 3000 | `apps/core-server/` |
| core-web | React + Rsbuild + Tailwind v4 | 3012 | `apps/core-web/` |

## External Dependencies

`@vritti/quantum-ui` and `@vritti/api-sdk` are linked via pnpm overrides (see `pnpm-workspace.yaml`). They live outside this repo at `../quantum-ui` and `../api-sdk`.

## Commands

```bash
pnpm dev              # Start both apps in parallel
pnpm dev:ssl          # Start both with HTTPS
pnpm build            # Build all projects
pnpm lint             # Lint all projects (Biome)
pnpm test             # Run unit tests
pnpm test:e2e         # Run e2e tests
pnpm check            # Biome check --write across all
nx graph              # Show project dependency graph
npx nx release        # Version bump + changelog (conventional commits)
```

## Testing

| Scope | Tool | Location |
|-------|------|----------|
| Server unit | Jest + SWC | `apps/core-server/` |
| Web unit/component | Vitest + Testing Library | `apps/core-web/` |
| Server e2e | Jest + Supertest | `e2e/core-server-e2e/` |
| Web e2e | Playwright | `e2e/core-web-e2e/` |

## Structure

```
vritti-core/
├── apps/
│   ├── core-server/     # NestJS backend
│   └── core-web/        # React frontend
├── e2e/
│   ├── core-server-e2e/ # API e2e tests
│   └── core-web-e2e/    # Browser e2e tests
├── libs/                  # Future shared packages
├── .claude/rules/         # Convention rule files
├── biome.json             # Shared linter/formatter
└── nx.json                # Nx config with versioning
```

## Auth & Session Architecture

- Auth routes are top-level: `/auth/*` (NOT nested under another prefix)
- Session types: ONBOARDING, CLOUD, COMPANY, RESET, ADMIN
- `@RequireSession(SessionTypeValues.NEXUS)` restricts endpoints to a session type
- Default session type: `['NEXUS']` (configured via `configureApiSdk({ guard: { defaultSessionTypes: ['NEXUS'] } })`)
- `@RequireSession()` replaces the old `@Admin()`, `@Onboarding()`, `@Reset()` decorators

## Conventions

See `.claude/rules/` for detailed pattern documentation:
- `swagger-docs.md` — API controller Swagger docs pattern
- `error-handling.md` — RFC 9457 exception patterns
- `auth-architecture.md` — Auth system facts, session types, `@RequireSession`
- `backend-controller.md` — Controller thin layer rules
- `backend-service.md` — Service business logic rules
- `backend-repository.md` — Repository data access rules
- `backend-dto.md` — DTO organization (request/response/entity)
- `frontend-conventions.md` — Frontend patterns and component usage
- `frontend-hook.md` — TanStack Query hook conventions
- `frontend-service.md` — Axios service conventions
- `value-formatting.md` — DetailField / DataTable cells / useFormatters for dates, currency, numbers
- `comment-style.md` — Comment style rules
- `export-conventions.md` — Export patterns

---

## core-app (React Native)

`apps/core-app/` is a bare React Native app (NOT Expo). It is the mobile host shell that
loads micro-apps over Module Federation.

- Bundler: `@callstack/repack` (rspack). Native modules: `react-native-nitro-modules`.
- UI: `@vritti/quantum-ui-native` — **subpath exports only** (linked from `../quantum-ui-native`).
- Styling: NativeWind v4 (`className` Tailwind). Navigation: React Navigation + `PushNavigator`.
- State: TanStack Query. Forms: react-hook-form + zod.

### Commands

```bash
pnpm dev:app                                       # Metro for core-app (:8081)
pnpm dev:app:ios                                   # run iOS
pnpm dev:app:android                               # run Android
npx tsc --noEmit -p apps/core-app/tsconfig.json    # typecheck core-app only
```

> Note: the root `pnpm typecheck` runs every project (`nx run-many --all`). core-app has
> no nx `typecheck` target, so scope to the tsconfig above. PostToolUse hooks run this
> automatically after editing files under `apps/core-app/`.

### Convention files (auto-loaded for `apps/core-app/src/**`)

These live in `.claude/rules/` with `paths:` frontmatter, so the harness loads them
automatically when you work in core-app:
- `native-conventions.md` — imports, colors, navigation, text, forms
- `native-hook.md` — TanStack Query hook patterns
- `native-screen.md` — screen structure, route registration, file layout
- `native-service.md` — axios service patterns

### Top rules (full detail in `.claude/rules/native-conventions.md`)

1. SUBPATH imports ONLY: `@vritti/quantum-ui-native/Button` — NEVER barrel `@vritti/quantum-ui-native`
2. NEVER hardcode colors — use `className` semantic tokens (`bg-card`, `text-muted-foreground`) or `getTheme()` (`'transparent'` is the only allowed literal)
3. FlatList → `FlashList`; ActivityIndicator → `Spinner`; Pressable/TouchableOpacity → `Button`; raw RN `Text` → `@vritti/quantum-ui-native/Text`
4. Services: NO async/await — return `.then()` chains. Import axios from `@vritti/quantum-ui-native/utils`
5. Hooks: use `AxiosError` not `Error`; `export function` not `export const`; direct `mutationFn`/`queryFn` reference
6. Screens: wrap in `ScreenContainer`; forms in a `form/` subdirectory; screens call hooks, never services directly

### getTheme()

- Takes NO parameters — reads Appearance internally.
- NEVER memoize with an `isDark` dependency. To memoize, use `useColorScheme()` as the dependency.

### Known Bugs — DO NOT REPEAT

<!-- Add every recurring core-app mistake here. -->
- Barrel imports from `@vritti/quantum-ui-native` defeat tree-shaking and bloat the bundle
- `getTheme(isDark ? 'dark' : 'light')` — the param was removed; it takes no args
- `useMemo(() => getTheme(), [isDark])` — isDark is not what getTheme reads
- Hardcoded hex/rgb/hsl colors break dark mode entirely; `bg-gray-100`/`text-gray-500` instead of semantic tokens
- Untyped `usePushNavigator()` — always pass the route type generic
- Defining interfaces inside service files — types go in `types/`
- async/await in services — use `.then()` chains
- `export const` for hooks/services — use `export function`
- Screen component directly containing form JSX — forms belong in a `form/` subdirectory
- Screen calling services directly — screens call hooks, hooks call services

### Architecture

```
apps/core-app/src/host/
├── screens/<feature>/
│   ├── <Feature>Screen.tsx          ← main screen (ScreenContainer wrapper)
│   ├── form/<Feature>Form.tsx       ← form component (receives form + onSubmit props)
│   └── components/<Reusable>.tsx    ← screen-local components
├── hooks/<domain>/                  ← TanStack Query wrappers around services
├── services/<domain>/               ← pure axios functions, no React
├── schemas/<domain>/<screen>.ts     ← zod schemas + inferred types
├── types/<domain>.ts                ← shared TypeScript interfaces
└── routes/<feature>/                ← PushScreenConfig array + route type union
```
