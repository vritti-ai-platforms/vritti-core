---
description: Canonical entity "code" format — IsCode / codeCheck / zodCodeField (never hand-roll a code regex)
paths:
  - "**/dto/request/**"
  - "**/dto/**/*.dto.ts"
  - "**/graphql/*.input.ts"
  - "**/db/schema/**"
  - "**/schemas/**"
  - "**/*.dto.ts"
---

# Entity `code` Conventions

Every entity identifier `code` (app, feature, role, uom-dimension, item SKU, site, cost-category, plan,
business, region, …) uses ONE canonical format — **lowercase-kebab**:

```
^[a-z][a-z0-9-]*$          # start with a lowercase letter, then lowercase letters / digits / hyphens
```

Permission codes use the **dotted** variant (dot-separated segments, e.g. `add.salt`, `pos.view`):

```
^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$
```

**Never hand-roll a code regex.** Use the shared helper for each layer — one source of truth.

## Server DTOs / GraphQL inputs → `@IsCode()`

```typescript
import { IsCode } from '@vritti/api-sdk/decorators';

@IsString() @MaxLength(50) @IsCode() code: string;             // lowercase-kebab (format only)
@IsCode({ dotted: true }) code: string;                        // permission code
@IsCode({}, { message: 'Enter a valid SKU' }) code: string;   // custom message (class-validator 2nd arg)
```

- `@IsCode()` validates FORMAT only — keep `@IsString()` / `@MinLength()` / `@MaxLength()` beside it.
- Works in both REST DTOs and GraphQL `@InputType` classes (both are class-validator validated).

## DB CHECK constraints → `codeCheck()`

```typescript
import { codeCheck } from '@vritti/api-sdk/drizzle-pg-core';

(table) => [ codeCheck('uom_dimensions_code_chk', table.code) ],
(table) => [ codeCheck('feature_permission_code_chk', table.code, { dotted: true }) ],
```

Never write `check('…', sql`${table.code} ~ '^[a-z…'`)` or `= lower(code)` by hand.

## Frontend zod forms → `zodCodeField()`

```typescript
import { z, zodCodeField } from '@vritti/quantum-ui/zod';         // web (cloud-web, core-web, *-mf)
import { z, zodCodeField } from '@vritti/quantum-ui-native/zod';  // native (core-app, commerce-ma)

code: zodCodeField(),                                 // includes .min(1) + format regex
code: zodCodeField({ max: 100 }),
code: zodCodeField({ dotted: true }),                 // permission code
code: zodCodeField({ message: 'Enter a valid SKU' }), // custom format message
```

Never inline `.regex(/^[a-z][a-z0-9-]*$/, '…')` for a code field.

## Rules

- **One format, all codes.** Item SKUs and site codes are lowercase-kebab too (uppercase codes were unified).
  Codes are rejected, never coerced — callers must send lowercase.
- **Generic default message.** Defaults are domain-neutral — "Lowercase letters, numbers, and hyphens only"
  / "Lowercase words separated by dots". Pass `message` (zod) or `{ message }` (class-validator) to override
  per field; never bake an entity name into the shared default.
- **NOT codes — leave alone:** passwords, OTP (`\d{6}`), semver version, currency (`[A-Z]{3}`),
  country (`[A-Z]{2}`), org subdomain (`^[a-z0-9-]+$` — allows a leading digit).
- **Keep the mirror in sync.** The canonical pattern lives in `@vritti/api-sdk/decorators`
  (`code-pattern.ts`). `quantum-ui` and `quantum-ui-native` `lib/utils/zod.ts` mirror it (the frontend can't
  import the server SDK) — change all of them together, or they drift.
- **Native subpath needs a bundler alias.** `@vritti/quantum-ui-native/zod` resolves via the rspack
  `quantumAliases` map in each RN app's config (NOT package.json `exports`) — add the alias when a new app
  consumes it, and restart the bundler.

## Sources

| Layer | Symbol | File |
|---|---|---|
| Pattern (canonical) | `CODE_PATTERN`, `codeMessage` | `api-sdk/src/decorators/code-pattern.ts` |
| Server validator | `IsCode` | `api-sdk/src/decorators/is-code.decorator.ts` |
| DB constraint | `codeCheck` | `api-sdk/src/drizzle-pg-core.ts` |
| Web form | `zodCodeField` | `quantum-ui/lib/utils/zod.ts` |
| Native form | `zodCodeField` | `quantum-ui-native/lib/utils/zod.ts` |
