# vritti-core

pnpm workspace monorepo containing the VAP (Vritti AI Platform) backend and frontend.

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

## Form Default Values (react-hook-form)

Set `defaultValues` by **what the control is**, never by habit. quantum-ui's `<Form>` wraps every field in a `Controller` and calls `reset()` on `resetOnSuccess` and on Cancel, so the default is what the field returns to.

| Field | Default | Why |
|---|---|---|
| **Select / ID / lookup** (selectors, `currencyCode`, `uomId`, …) | **Omit** | `undefined` is native "nothing chosen"; `''` counts as a selection and fires a bogus resolve request (`values=&offeringId=` → 400 from `@IsUUID`) |
| **Text input** (`TextField`, `TextArea`, `PhoneField`) | `''` | Must stay controlled — `undefined` triggers React's uncontrolled→controlled warning, and `reset()` can't clear an uncontrolled input (stale text in the next dialog) |
| **Boolean** (`Switch`, `Checkbox`) | real `true` / `false` | Same controlled-input rule, and the off state is a real value |
| **Business default** (quantity `1`, first currency, a default enum) | the real value | It's data, not a placeholder |
| **Edit forms** | the existing record | Obviously |

- Clear a dependent field with `form.resetField(name)`, never `setValue(name, '')`.
- UUID fields use `z.uuid()` — never the deprecated `z.string().uuid()`, and never `z.string().min(1)` for an ID. A required select is `z.uuid('Variant is required')`; that one message also covers the missing (`undefined`) case.
- A required non-UUID string needs its message on the base type too — `z.string({ error: 'Name is required' }).min(1, 'Name is required')` — because `undefined` never reaches `.min(1)`.
- A dependent selector takes `parentId: string | undefined` and passes no `optionsEndpoint` until the parent exists.

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
- `comment-style.md` — Comment style rules
- `export-conventions.md` — Export patterns
