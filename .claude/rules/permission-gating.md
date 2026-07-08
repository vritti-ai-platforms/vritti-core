---
description: RBAC permission gating in the frontend — codes, PermissionGate, permission props, table self-gating
paths:
  - "src/**/*.{ts,tsx}"
---

# Permission Gating (Frontend)

How to gate UI and API calls on the user's resolved permissions. Permissions arrive over the SSE
auth-state stream and are exposed through `@vritti/quantum-ui/PermissionGate`.

## Two axes — render vs enable

- **render = role**: the user's role grants the feature → it's visible. Not granted → it does not exist for them (render nothing).
- **enable = role ∧ plan ∧ BU**: granted but plan- or BU-locked → visible but **disabled with a lock + upsell**, not hidden.

`usePermission(code)` returns `{ granted, locked, reason, unlockPlans }`:
- `granted: false` → hide (render nothing / `null`).
- `granted && locked` → show a lock (`reason` = `'PLAN' | 'BU'`), disabled; `lockedTip({ reason, unlockPlans })` gives the copy.
- `granted && !locked` → fully enabled.

## Permission codes — NEVER hardcode string literals

Codes are authored in the cloud catalog and shared as `as const` maps in the `@vritti/commerce-permissions`
workspace package, one subpath per feature. Import from the subpath; never write `'uom.view'` inline.

```tsx
// WRONG — silent typo = permanently denied, no compiler help
<Button permission="uom.create">Add</Button>

// CORRECT
import { UOM } from '@vritti/commerce-permissions/uom';
<Button permission={UOM.create}>Add</Button>
```

New feature → add `libs/commerce-permissions/src/<feature>.ts` (`export const X = { … } as const`) + its two-line
`exports` entry in the package.json, then `pnpm --filter @vritti/commerce-permissions build`. Codes MUST match the
catalog exactly.

## Gating surfaces — pick by scope

| Surface | Use for | Behavior |
|---|---|---|
| `<PermissionGate permission=… fallback=…>` | a **view / page / subtree** | children (and their queries) mount **only** when `granted && !locked`; else renders `fallback` |
| `permission` prop on `Button` / `RowActions` / `DataTable` | a single **action** or a **table** | gated in place — hidden when not granted, disabled + lock when locked |
| `usePermission(code)` | bespoke logic | raw `{ granted, locked, reason, unlockPlans }` |

### `<PermissionGate>` — the mount-boundary gate

Children mount only when granted **and** unlocked, so their data queries never fire otherwise.
`fallback` is a node **or** a callback. The callback receives the gate result **plus a ready-to-render
`title` + `tip`** that already resolve the not-granted vs granted-but-locked split — render them directly.
**Never import or call `lockedTip` inside a fallback**; that copy is handed to you as `tip`.

```tsx
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';

// title/tip cover both cases (no access / plan- or BU-locked); reason drives the lock icon
<PermissionGate
  permission={UOM.dim.view}
  fallback={({ reason, title, tip }) => (
    <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
  )}
>
  <UomDimensionsPage />
</PermissionGate>
```

Need feature-specific copy? The callback still gets `granted`/`reason`/`unlockPlans` — branch and override
`title`/`tip` yourself. `lockedTip({ reason, unlockPlans })` stays exported only for **feature-level** lock
displays *outside* a gate (sidebar item, upsell panel).

Must **conditionally mount** (render fallback *instead of* children) — never CSS-hide a still-mounted subtree, or its hooks keep firing. Default (no `fallback`): renders nothing when not granted, a lock chip when locked.

### Action gating — mutations

Gate write buttons/row-actions with the `permission` prop using the **write** code. The API also enforces it
(hard 403 → toast, UI intact), so this is UX, not security.

```tsx
<Button permission={UOM.create} onClick={openAdd}>Add UOM</Button>
```

## DataTable views — self-gate the query hook (do NOT repeat `usePermission` at call sites)

A `DataTable`'s `permission` prop gates the **display** (locked → table shell with a lock empty-state + disabled
filters; not granted → renders nothing). But it **cannot** disable the query that produced its data — the query
lives in the consumer's hook. So a guarded list/table GET would still fire and **403** when locked.

**Rule: bake the gate into that feature's table query hook.** The hook owns its guarded endpoint, so it owns the
`view` permission too — self-gate `enabled`, and return only the query result (no `granted`/`locked` in the response).

```ts
// hooks/uom/useUomTable.ts
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { UOM } from '@vritti/commerce-permissions/uom';

export function useUomTable(dimensionId: string | null, options?: Omit<UseQueryOptions<…>, 'queryKey' | 'queryFn'>) {
  // The table endpoint is guarded by uom.view — self-gate so a locked/denied user never fires the request
  const { granted, locked } = usePermission(UOM.view);
  return useQuery<…>({
    queryKey: [...UOM_TABLE_KEY, dimensionId],
    queryFn: () => getUomTable(dimensionId as string),
    ...options,
    enabled: !!dimensionId && granted && !locked && (options?.enabled ?? true),
  });
}
```

```tsx
// UomTable.tsx — call site stays clean: no usePermission, no enabled wiring
const { data: response, isLoading } = useUomTable(dimensionId);   // fetch self-gated
…
<DataTable table={table} isLoading={isLoading} permission={UOM.view} … />  // display gated by the prop
```

So the fetch gate lives in the hook and the display gate lives in `DataTable` — both from the same code, zero
boilerplate at the call site. `usePermission(CODE)` runs in both spots; that's fine (cheap context read).

## Invalidations

Default `invalidateQueries` (`refetchType: 'active'`) is safe with gating: a gated-out (unmounted / disabled) query
is **inactive** → only marked stale, not refetched, so no request/403 fires; it refetches when it next becomes active.
**Never pass `refetchType: 'all'`** on a permission-gated query — it force-refetches inactive queries and hits the 403.
Permission changes propagate via SSE → `PermissionProvider`, not via query invalidation.

## Backend pairing (context)

- **Mutations** (`POST/PUT/PATCH/DELETE`) are hard-guarded with `@RequirePermission(CODE)` on the gateway controller.
- **Views** (`GET`) are gated **client-side**; only guard a list/table GET on the server when the UI also gates it
  (via the self-gated hook above) — otherwise the 403 tears down the page.
```
