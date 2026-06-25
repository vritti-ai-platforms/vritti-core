# commerce-ma — Development Guide

`commerce-ma` is the **Commerce micro-app**: a Module Federation **remote** consumed by the
`core-app` React Native host. It is self-contained — the host loads its main module over MF and
renders it; there are no hardcoded commerce routes in the host.

## Stack

- **React Native** 0.83 (bare, NOT Expo) — bundled with `@callstack/repack` (rspack)
- **Module Federation remote** — served by Metro on **port 9002**; consumes the host's shared singletons
- **UI**: `@vritti/quantum-ui-native` — **subpath imports only** (`/Button`, `/Form`, …), never the barrel
- **Styling**: NativeWind v4 (`className` semantic tokens) — never hardcode colors
- **Data**: **Apollo Client v4** over GraphQL to core-server. The client + cache live in the **host**;
  this remote consumes them via the MF-shared `@apollo/client` / `@apollo/client/react` singletons.
- **GraphQL typing**: graphql-codegen **client-preset** → typed `graphql()` documents in `src/gql/`
- **Forms**: react-hook-form + zod, driven by quantum `<Form>` name-wiring (no RHF `<Controller>`)
- **TanStack Query** is still present only for the legacy `Select` pickers (FK fields are placeholders
  pending the Select→Apollo migration) — do NOT add a `QueryClientProvider`.

## Commands

```bash
pnpm start                                   # Metro for this remote (:9002) — user-managed, don't restart it
pnpm codegen                                 # generate src/gql/ from core-server's schema.gql — RUN BEFORE tsc/dev
pnpm codegen:watch                           # regenerate on change
npx tsc --noEmit -p tsconfig.json            # typecheck (no nx target for this app)
```

> `src/gql/` is **git-ignored** — a fresh checkout has no generated types, so `pnpm codegen` must run
> before `tsc` or the dev bundler. Re-run it whenever you add/change a GraphQL operation.
>
> quantum-ui-native is aliased to its `lib/` **source** (rspack), so a quantum edit needs a Metro
> restart (:8081 host + :9002) to take effect. The user runs the dev servers — don't kill/restart them.

## Structure — layer-first

Cross-cutting concerns are **top-level `src/<layer>/<domain>/` folders**; a `features/<domain>/` folder
holds UI only. See `.claude/rules/commerce-ma-structure.md` (local) and root
`.claude/rules/native-graphql.md` for the full convention.

```
src/
├── gql/                              # codegen output — git-ignored
├── graphql/inventory-items/          # GraphQL operations: fragments.ts queries.ts mutations.ts index.ts(barrel)
├── hooks/inventory-items/            # ONE hook per file (named after the hook) + index.ts barrel
├── services/inventory-items/         # non-React data/helpers (option lists, label/filter utils) + barrel
├── schemas/inventory-items/          # zod schemas + inferred form types
├── types/                            # shared hand types (enum unions — see enum caveat in native-graphql.md)
└── features/inventory-items/         # UI ONLY
    ├── index.tsx                     # NAVIGATOR ONLY: `screens` config + PushNavigator default export
    ├── cache.ts                      # registerConnection(...) cache policies (side-effect-imported by index.tsx)
    ├── types.ts                      # feature route/nav types (RouteName, *Params, Navigation, query-data)
    ├── screens/                      # <Thing>Screen.tsx per screen; a tabbed screen is a FOLDER <Thing>Screen/
    │                                 #   with index.tsx + its own nested tabs/ (e.g. InventoryItemDetailScreen/)
    ├── components/                   # screen-local components (cards, header actions like CreateButton)
    └── forms/                        # form components (quantum <Form>)
```

## Key conventions (full detail in `.claude/rules/`)

1. **One hook per file**, file named exactly after the hook (`useCreateInventoryItem.ts`). Never bundle
   multiple hooks in one file. Consumers import from the `hooks/<domain>` barrel.
2. **GraphQL operations** use `graphql()` from `src/gql` (never `gql` from `@apollo/client`); a shared
   per-entity fragment is reused across feed/single/create/update so cached records identity-merge by `id`.
3. **CRUD without refetch** (the GitHub/Shopify method) via the generic helpers from
   `@vritti/quantum-ui-native/apollo`: create → `prependEdgeToConnection`; update → the mutation returns
   the entity → Apollo auto-merges by id (no surgery); delete → `removeEdgeFromConnection` + `evictEntity`.
   Never blanket-refetch the list. Detail/edit read `inventoryItem(id)` with `fetchPolicy: 'cache-only'`
   (the `Query.inventoryItem` `read` redirect is registered by this app — see #4).
4. **Cache field policies** are registered by THIS app at runtime, not hardcoded in the host. The feature
   entry (`features/inventory-items/index.tsx`) calls `registerConnection({ field: 'inventoryItems', … })`
   at module top-level (before any query). The host's `createApolloClient` cache stays schema-agnostic.
5. **Forms**: quantum `<Form>` wires fields by `name` via each field's `fieldBinding`. No `<Controller>`.
6. **quantum-ui-native**: subpath imports only; `<Button>` needs a `<Text>` child; `FlashList` not
   FlatList; `Spinner` not ActivityIndicator; semantic color tokens only.

## Convention rules

This app's conventions live in two places:
- **Local** — `apps/micro-apps/commerce-ma/.claude/rules/commerce-ma-structure.md` (the concrete folder map)
- **Shared (repo root)** — `.claude/rules/`:
  - `native-graphql.md` — Apollo + codegen client-preset, layer-first structure, one-hook-per-file
  - `native-conventions.md` — imports, colors, Button/FlashList/Spinner, forms
  - `native-screen.md` / `native-service.md` / `native-storage.md` — screens, services, storage
  - `comment-style.md`, `export-conventions.md`
