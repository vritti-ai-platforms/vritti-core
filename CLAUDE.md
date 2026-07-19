# vritti-core

pnpm workspace monorepo containing the Vritti Core (Platforms) backend and frontend.

## Apps

| App | Stack | Port | Path |
|-----|-------|------|------|
| core-server | NestJS + Fastify + Drizzle | 3000 | `apps/core-server/` |
| core-web | React + Rsbuild + Tailwind v4 | 3012 | `apps/core-web/` |

## External Dependencies

`@vritti/quantum-ui` and `@vritti/api-sdk` are linked via pnpm overrides (see `pnpm-workspace.yaml`). They live outside this repo at `../quantum-ui` and `../api-sdk`. After editing either linked package you must **rebuild it** (`pnpm build` in that folder) AND reload the consuming dev server — a stale bundle causes runtime `undefined` errors (e.g. a new nested permission code).

### quantum-ui components — import per-subpath, never the barrel
`import { Button } from '@vritti/quantum-ui/Button'` (NOT `from '@vritti/quantum-ui'`). Prefer an existing component over hand-rolled HTML; if one's missing, add it via the quantum-ui-architect. Key surfaces: layout (`PageHeader`, `PageContent`, `Card`, `DetailField`, `Tabs`, `DangerZone`, `Empty`, `Sidebar`), data (`DataTable` + `RowActions` + cell comps, `TreeView`, `Sortable`, charts), forms (`Form`+`FormSection`, `TextField`/`Select`/`Switch`/`CurrencyField`/…), overlays (`Dialog`, `DropdownMenu`, `Tooltip`, `Alert`, `Sonner`), gating (`PermissionGate`, `usePermission`), pre-built selectors `@vritti/quantum-ui/selects/<entity>`, and hook/util subpaths (`/hooks`, `/format`, `/money`, `/lodash`, `/slug`, `/icons`). The **`permission` prop is built into** `Button` / `DataTable` / `RowActions` items / `Tabs` `TabItem` / `DangerZone` (which also has `showWarning`) — pass the code, don't wrap in a manual `usePermission(...).granted &&`. Full catalog + gating rules: `.claude/rules/permission-gating.md` and the `vritti-frontend` agent.

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

## Permission Codes (RBAC)

Commerce permission codes live in **3 layers that MUST stay identical** (a mismatch fails closed):

1. **Lib** `libs/commerce-permissions/src/<feature>.ts` — `export const ORG_X = { featureCode, view, add, edit, delete, <sub>: { view, add, edit, delete } } as const`. Full dotted codes `org.<feature>.<action>`; sub-resources are **nested groups** (e.g. `ORG_PEOPLE.addresses.view`, `ORG_INVENTORY_ITEMS.mrp.edit`). Rebuild the lib after edits (`pnpm --filter @vritti/commerce-permissions build`); consumers import the built `dist/`.
2. **Catalog scripts** `scripts/catalog/<feature>.mjs` (+ `author-feature.mjs`) — author features/permissions into the cloud admin-api, wire `dependsOn` (`add/edit/delete→[view]`; `<sub>.view→[view]`; `<sub>.{add,edit,delete}→[<sub>.view]`), entitle the plan, and **publish** (pushes the signed snapshot to LIVE deployments — consent-gated). `code` in the def is the BARE action; `resolveFeature` matches **(code, scope)**. Run: `ADMIN_BASE_URL=… NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/catalog/<f>.mjs [--no-publish]`.
3. **Enforcement** — gateway controllers: class `@RequireFeature(ORG_X.featureCode)` + per-endpoint `@RequirePermission(ORG_X.action)` (`GET`→view, `POST`→add, `PATCH`→edit, `DELETE`→delete; sub-resource paths → nested code). Frontend gating surfaces (`DataTable`/`Button`/`RowActions`/`Tabs` item/`DangerZone` `permission` prop + `usePermission` self-gated query hooks) → see `.claude/rules/permission-gating.md`.

## Conventions

See `.claude/rules/` for detailed pattern documentation:
- `swagger-docs.md` — API controller Swagger docs pattern
- `error-handling.md` — RFC 9457 exception patterns
- `auth-architecture.md` — Auth system facts, session types, `@RequireSession`
- `backend-controller.md` — Controller thin layer rules
- `backend-service.md` — Service business logic rules
- `backend-repository.md` — Repository data access rules
- `backend-dto.md` — DTO organization (request/response/entity)
- `backend-module-structure.md` — module folder split + dependency direction (domain owns its boundary DTOs; API layer imports them downward; domain NEVER imports up from an API layer)
- `frontend-conventions.md` — Frontend patterns and component usage
- `frontend-hook.md` — TanStack Query hook conventions
- `frontend-service.md` — Axios service conventions
- `value-formatting.md` — DetailField / DataTable cells / useFormatters for dates, currency, numbers
- `money-handling.md` — money as `bigint` minor units + `{currency,value}` wire shape; never `Number(majorToMinor(...))`
- `comment-style.md` — Comment style rules
- `export-conventions.md` — Export patterns
- `code-conventions.md` — Canonical entity `code` format (IsCode / codeCheck / zodCodeField)
- `permission-gating.md` — Frontend RBAC gating (permission codes, PermissionGate, `permission`/`showWarning` props, self-gated table hooks)

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
- `native-storage.md` — Keychain (secrets) vs MMKV (non-secret prefs) split

### Top rules (full detail in `.claude/rules/native-conventions.md`)

1. SUBPATH imports ONLY: `@vritti/quantum-ui-native/Button` — NEVER barrel `@vritti/quantum-ui-native`
2. NEVER hardcode colors — use `className` semantic tokens (`bg-card`, `text-muted-foreground`) or `getTheme()` (`'transparent'` is the only allowed literal)
3. FlatList → `FlashList`; ActivityIndicator → `Spinner`; Pressable/TouchableOpacity → `Button`; raw RN `Text` → `@vritti/quantum-ui-native/Text`
4. Services: NO async/await — return `.then()` chains. Import axios from `@vritti/quantum-ui-native/utils`
5. Hooks: use `AxiosError` not `Error`; `export function` not `export const`; direct `mutationFn`/`queryFn` reference
6. Screens: wrap in `ScreenContainer`; forms in a `form/` subdirectory; screens call hooks, never services directly
7. Storage: secrets (tokens, base URL) → Keychain adapter; non-secret prefs → MMKV, but only via `src/host/config/storage.ts` (never import `react-native-mmkv` elsewhere)

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
- Bare string child in `<Button>` (e.g. `<Button>Save</Button>`) — Button renders children raw in a View → "Text strings must be rendered within a `<Text>`"; pass a `<Text>` child

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
