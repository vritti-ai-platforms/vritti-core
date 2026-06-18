---
description: GraphQL resolver conventions — resolvers as a 2nd entry-point beside controllers, reusing existing services
paths:
  - "src/**/*.resolver.ts"
  - "src/**/graphql/*.ts"
---

# GraphQL Resolver Files

GraphQL is a SECOND transport beside REST. Resolvers are a thin alternate entry-point into the
SAME services that controllers call. Code-first schema (`@nestjs/graphql` + Apollo on Fastify),
auto-generated into `src/schema.gql`. The global `VrittiAuthGuard`, the transport-aware exception
filter, and the `@vritti/api-sdk` param decorators all work under GraphQL via
`getRequestFromContext()` — no GraphQL-specific guard or filter is needed.

## File layout (per existing module — NO new top-level module)

```
<module>/<root|profile|security>/
├── controllers/...                 # existing REST — DO NOT TOUCH
├── services/...                    # REUSED — DO NOT TOUCH
├── dto/...                         # existing REST DTOs — DO NOT TOUCH
├── resolvers/<x>.resolver.ts        # NEW @Resolver, thin
└── graphql/                         # NEW code-first types
    ├── <x>.type.ts                  # response shape → @ObjectType
    └── <x>.input.ts                 # request shape  → @InputType
```

Register the resolver (and any local param decorator providers are not needed) in the
EXISTING module's `providers` array. Do not create a new `*.module.ts` for GraphQL.

## The 7 rules

1. **No business logic in resolvers.** Log `QUERY <name>` / `MUTATION <name>`, read
   session/request via decorators, make ONE service call, return. Same thinness as controllers.
2. **Reuse the existing service method — never duplicate.** The resolver calls the very same
   method the controller calls. If a method doesn't exist, it belongs in the service, not the resolver.
3. **GraphQL types are SEPARATE classes from the REST DTOs.** Never add `@Field` to a request/
   response DTO. Mirror its fields in a new `@ObjectType` (response) / `@InputType` (request) class.
   Copy `class-validator` decorators onto `@InputType` fields so GraphQL inputs are validated too.
4. **Auth via `@Public()` / `@RequireSession(...)`.** Import `SessionTypeValues` from `@/db/schema`
   (e.g. `@RequireSession(SessionTypeValues.MOBILE)`, `@RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)`).
5. **Reads = `@Query`, changes = `@Mutation`.** Always pass an explicit `{ name: '...' }`.
6. **Throw the same SDK exceptions** — they propagate natively because the SDK's
   `TransportAwareExceptionFilter` re-throws for the GraphQL transport.
7. **Register the resolver in the existing module's `providers`.** No `forwardRef`, no duplicate
   providers.

## Param decorators (work across HTTP + GraphQL)

From `@vritti/api-sdk`: `@UserId()`, `@SessionData()`, `@AccessToken()` (strips `Bearer `),
`@Hostname()`, `@ClientIp()`, `@UserAgent()`. All resolve through `getRequestFromContext(ctx)`.

- **Client IP / User-Agent**: use `@ClientIp()` / `@UserAgent()` — feed them to login/session creation.
- **Authorization header**: `@AccessToken()` gives the bare token. If a service expects the RAW
  `Authorization` header value (incl. the `Bearer ` prefix — e.g. `SecurityService.getSessions`),
  use a small local `@AuthHeader()` decorator reading `getRequestFromContext(ctx).headers.authorization`.

## Scalar / shape guidance

- **ALWAYS pass an explicit type thunk — `@Field(() => Type)` on EVERY field; never bare `@Field()`.**
  A bare `@Field()` relies on TS reflection, which FAILS for `T | null` unions (reflected as `Object`)
  and throws `UndefinedTypeError` at **schema-build time (app boot)** — `tsc`/`pnpm build` do NOT catch it.
- strings → `@Field(() => String)`; numbers → `@Field(() => Int)` (or `Float`); booleans →
  `@Field(() => Boolean)`; ids → `@Field(() => ID)`; dates (ISO strings like
  `createdAt`/`lastLoginAt`/`lastActive`) → `@Field(() => GraphQLISODateTime)` from `@nestjs/graphql`.
- optional/nullable → `@Field(() => Type, { nullable: true })`. When the source DTO field is
  `string | null`, type the GraphQL field `?: string | null` (so returning the DTO type-checks) — the
  explicit `() => String` thunk is REQUIRED, since the `| null` union otherwise breaks reflection.
- MAP-shaped fields (a `Record` keyed by id, e.g. `featuresByBuId`) → prefer a typed list-of-pairs
  (`[{ buId, features: [...] }]`) over a JSON scalar. Use a JSON scalar ONLY for a genuinely dynamic blob.
- The GraphQL response shape need NOT byte-match the REST DTO — optimize for a clean schema for the
  fresh GraphQL consumer.

## Shared response types

GraphQL `@ObjectType` names are global in the schema — two classes named `MessageResponse` collide.
Define a shared response type ONCE (e.g. the auth module's `MessageResponse`) and import it into
other resolvers rather than redeclaring it. A single `MessageResponse { message: String!, success: Boolean }`
covers both `{ message }` (logout) and `{ success, message }` (SuccessResponseDto) payloads.

## Verify statically

After adding resolvers: rebuild api-sdk if you touched it, then in core-server run
`npx tsc --noEmit -p tsconfig.json` and `pnpm build`, and confirm the regenerated
`src/schema.gql` contains the new types/queries/mutations. ⚠️ `tsc`/`pnpm build` do NOT run schema
generation — `@Field` type errors (`UndefinedTypeError`) surface ONLY when the app boots and builds
the schema, so the dev server must be restarted to truly validate the schema (and to load new resolvers).
