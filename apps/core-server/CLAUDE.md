# vritti-platforms-server

Standalone NestJS API for the Vritti Platforms product.

## Stack

- **NestJS 11** + Fastify
- **Drizzle ORM** (PostgreSQL)
- **@vritti/api-sdk** — shared server SDK (linked via pnpm)
- **Biome** — linter/formatter
- **Jest + SWC** — testing
- **Swagger** — API documentation

## Commands

```bash
pnpm dev              # Start in watch mode
pnpm dev:ssl          # Start with HTTPS
pnpm build            # Build for production
pnpm prod             # Run production build
pnpm lint             # Biome lint
pnpm check            # Biome check --write
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:cov         # Run tests with coverage
pnpm test:e2e         # Run e2e tests
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:reset         # Force push schema (destructive)
pnpm db:start         # Start local PostgreSQL via Docker
pnpm db:stop          # Stop local PostgreSQL
```

Commands suffixed with `:w` (e.g. `db:push:w`) use `dotenv-cli` for Windows/cross-env compatibility.

## Structure

```
src/
├── app.module.ts       # Root module
├── main.ts             # Bootstrap
├── common/             # Shared guards, decorators, interceptors
├── config/             # Configuration modules
├── db/                 # Drizzle schema and migrations
├── modules/            # Feature modules (controller → service → repository)
├── services/           # Global services
└── utils/              # Utility functions
```

## External Dependencies

`@vritti/api-sdk` is linked externally (lives at `../api-sdk`). It provides base repositories, DTOs, filters, exceptions, and shared utilities.

## Conventions

See `.claude/rules/` for detailed pattern documentation:
- `backend-controller.md` — Controller thin layer rules
- `backend-service.md` — Service business logic rules
- `backend-repository.md` — Repository data access rules
- `backend-repository-queries.md` — this.model vs this.db query patterns
- `backend-dto.md` — DTO organization (request/response/entity)
- `backend-module-structure.md` — Module file/folder structure
- `swagger-docs.md` — API controller Swagger docs pattern
- `error-handling.md` — RFC 9457 exception patterns
- `comment-style.md` — Comment style rules
- `export-conventions.md` — Export patterns
