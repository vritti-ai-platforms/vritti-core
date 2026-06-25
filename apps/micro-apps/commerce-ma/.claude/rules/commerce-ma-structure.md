---
description: commerce-ma layer-first folder structure + naming (concrete map of the actual app)
paths:
  - "apps/micro-apps/commerce-ma/src/**/*.{ts,tsx}"
---

# commerce-ma — Layer-First Structure

This micro-app is organized **layer-first**: cross-cutting concerns are top-level `src/<layer>/<domain>/`
folders, and `features/<domain>/` contains UI only. (Mirrors `core-app`'s `host/` layout.) For the GraphQL
/ Apollo / codegen detail this builds on, see the repo-root rule `.claude/rules/native-graphql.md`.

## The layers

```
src/
├── gql/                              # codegen client-preset output — GIT-IGNORED (run `pnpm codegen` first)
├── graphql/<domain>/                 # GraphQL operations only
│   ├── fragments.ts                  #   graphql(`fragment …`) — one shared fragment per entity
│   ├── queries.ts                    #   graphql(`query …`)
│   ├── mutations.ts                  #   graphql(`mutation …`)
│   └── index.ts                      #   barrel
├── hooks/<domain>/                   # React hooks — ONE hook per file, named after the hook
│   ├── index.ts                      #   barrel (export * from each hook)
│   └── use<Thing>.ts                 #   exactly one exported hook each
├── services/<domain>/                # non-React data/helpers (option lists, label/filter utils, axios)
│   └── index.ts                      #   barrel
├── schemas/<domain>/                 # zod schemas + inferred types (form values)
├── types/                            # shared hand TS types (enum unions for the codegen `string` caveat)
└── features/<domain>/                # UI ONLY — no operations/hooks/schemas here
    ├── index.tsx                     #   NAVIGATOR ONLY: the `screens` PushScreenConfig[] + the PushNavigator
    │                                 #   default export. NO screen bodies here.
    ├── cache.ts                      #   registerConnection(...) cache policies; side-effect-imported by index.tsx
    ├── types.ts                      #   feature route/nav types (RouteName union, *Params, Navigation, query-data shapes)
    ├── screens/                      #   screens — a simple screen is <Thing>Screen.tsx; a screen that owns sub-content
    │                                 #   (tabs) is a FOLDER <Thing>Screen/ with index.tsx + its own tabs/ (the tabs
    │                                 #   belong to that screen — ScreenHeader variant="tabs")
    ├── components/                   #   screen-local components (cards, header actions like CreateButton, chips, sheets)
    └── forms/                        #   quantum <Form> components
```

## Current contents (inventory-items)

```
src/graphql/inventory-items/   fragments.ts queries.ts mutations.ts index.ts
src/hooks/inventory-items/     useInventoryItemsFeed.ts useCreateInventoryItem.ts
                               useUpdateInventoryItem.ts useDeleteInventoryItem.ts index.ts
src/services/inventory-items/  filterOptions.ts index.ts
src/schemas/inventory-items/   inventory-item.ts
src/types/                     list.ts
src/features/inventory-items/  index.tsx (navigator only)  cache.ts  types.ts
                               screens/{InventoryListScreen,InventoryItemCreateScreen,InventoryItemEditScreen}.tsx
                               screens/InventoryItemDetailScreen/  index.tsx  tabs/{OverviewTab,ComingSoonTab}.tsx
                               components/{InventoryItemCard,CreateButton,…}.tsx
                               forms/InventoryItemForm.tsx
```

The detail screen is tabbed (mirrors web) and so is a FOLDER: `screens/InventoryItemDetailScreen/index.tsx` exports
`InventoryItemDetailHeader` (builds `ScreenHeader variant="tabs"`) + `InventoryItemDetail` (body =
`useScreenHeaderTabContent()`); its tab-content components live in its OWN `tabs/` folder (the tabs belong to that
screen). Overview is built; the rest are `ComingSoonTab` placeholders, filled in screen-by-screen.

## Rules

1. **One hook per file**; the file name IS the hook name (`useDeleteInventoryItem.ts` → `useDeleteInventoryItem`).
   Never put multiple hooks in one file. Re-export via the domain barrel; import hooks from the barrel
   (`../../hooks/<domain>`), not individual files.
2. **A feature folder is UI only.** GraphQL ops → `src/graphql/`, hooks → `src/hooks/`, zod → `src/schemas/`,
   helpers/option-lists → `src/services/`, shared types → `src/types/`. Don't recolocate these under the feature.
3. **Import a layer through its barrel** where one exists: `../../graphql/<domain>`, `../../hooks/<domain>`,
   `../../services/<domain>`. Schemas are imported by file (`../../schemas/<domain>/<schema>`).
4. **`graphql()` documents import from `src/gql`** (codegen), never `gql` from `@apollo/client`. `src/gql/`
   is git-ignored — `pnpm codegen` before `tsc`/dev.
5. **CRUD keeps the cache live with surgery, no list refetch** — see `native-graphql.md` and the hooks here.
6. **A feature's `index.tsx` is the navigator only** — the `screens` PushScreenConfig[] + the `PushNavigator`
   default export, nothing else. Each screen body lives in its own `screens/<Thing>Screen.tsx` — or, when a screen
   owns tabs, a folder `screens/<Thing>Screen/` with `index.tsx` + its own nested `tabs/` (the tabs belong to that
   screen); the feature's route/nav types in `types.ts`; and the `registerConnection(...)` cache-policy
   call in `cache.ts`, which `index.tsx` imports for its side effect so it runs once at feature-module eval (before
   any screen queries). Header-action components (e.g. `CreateButton`) live in `components/`.

## When adding a new domain (e.g. `customers`)

Create `src/graphql/customers/`, `src/hooks/customers/`, `src/services/customers/` (if needed),
`src/schemas/customers/`, and `src/features/customers/` — each following the layout above (`index.tsx` navigator,
`screens/`, `cache.ts`, `types.ts`). Register the entity's cache field policy via `registerConnection(...)` in the
feature's `cache.ts` (the host cache stays schema-agnostic).
