---
description: Frontend patterns for Vritti microfrontends
paths:
  - "src/**/*.{ts,tsx}"
---

# Frontend Conventions

## React Import

Always use `import type React from 'react'` — never `import * as React from 'react'`.

```tsx
// WRONG
import * as React from 'react';

// CORRECT
import type React from 'react';
```

## Component Library
- Use components from `@vritti/quantum-ui` (shadcn-based, Tailwind v4)
- Do NOT install shadcn directly in microfrontends — use quantum-ui exports
- Import from specific paths: `import { Button } from '@vritti/quantum-ui/Button'`

## Button — never use HTML `<button>`
- ALWAYS use `<Button>` from `@vritti/quantum-ui/Button`, never raw `<button>`
- For ghost/link-style actions: `<Button variant="ghost">` or `<Button variant="link">`
- For icon-only buttons: `<Button variant="ghost" size="icon">`

```tsx
// WRONG
<button onClick={onBack} className="text-primary">Back</button>
<button type="submit">Submit</button>

// CORRECT
import { Button } from '@vritti/quantum-ui/Button';
<Button variant="ghost" onClick={onBack}>Back</Button>
<Button type="submit">Submit</Button>
```

## `disabledTip` — never repeat the `disabled` condition

`Button`, `Switch` and `CompactSwitch` only render the tooltip when the control is **actually
disabled**. `Button` checks `if (!tip || !isActuallyDisabled || asChild) return button;`, and the
switches go through the shared `withDisabledTip(control, tip, disabled)` — `if (!tip || !disabled)
return control;`. So guarding the tip with the same condition can never change what the user sees.

```tsx
// WRONG — the ternary is dead weight; the component already gates on `disabled`
disabled={blocked > 0}
disabledTip={blocked > 0 ? `${pluralize('offering', blocked, true)} cannot be made active yet.` : undefined}

// WRONG — the inverse spelling of the same thing
disabled={!offering.canEdit}
disabledTip={offering.canEdit ? undefined : 'This offering belongs to a wider scope.'}

// CORRECT
disabled={blocked > 0}
disabledTip={`${pluralize('offering', blocked, true)} cannot be made active yet.`}
```

Keep the ternary when the condition **differs** from `disabled` — then it is load-bearing, because the
tip must not explain the wrong reason:

```tsx
// CORRECT — disabled for two reasons, the tip only explains one of them
disabled={inUse || valueFields.fields.length <= 1}
disabledTip={inUse ? 'Used by a variant' : undefined}

// CORRECT — picks between two messages rather than suppressing one
disabledTip={offering.canEdit ? 'Generate a variant first' : 'This offering belongs to a wider scope.'}

// CORRECT — suppressed while the data that decides the message is still loading
disabled={!signupConfig?.enabled}
disabledTip={signupConfig && !signupConfig.enabled ? 'Sign-up is not configured yet.' : undefined}
```

Rule of thumb: if the guard is character-for-character the `disabled` expression (or its negation),
delete it.

## Spinner — never use Loader2
- ALWAYS use `<Spinner>` from `@vritti/quantum-ui/Spinner`, never `Loader2` from lucide-react
- Spinner already includes `animate-spin` — just set size and color via className

```tsx
// WRONG
import { Loader2 } from 'lucide-react';
<Loader2 className="h-8 w-8 animate-spin text-primary" />

// CORRECT
import { Spinner } from '@vritti/quantum-ui/Spinner';
<Spinner className="size-8 text-primary" />
```

## PageHeader — status badges go in `titleSlot`, not `actions`
`PageHeader` (`@vritti/quantum-ui/PageHeader`) has a `titleSlot` rendered inline next to the title. Put **status badges** (Active/Inactive, tax mode, state, etc.) there. The `actions` prop is for **action controls only** (buttons) — never mix badges into it.

```tsx
// WRONG — badges crammed into actions alongside buttons
<PageHeader
  title={catalog.name}
  actions={
    <div className="flex items-center gap-2">
      <Badge variant="success">Active</Badge>
      <Badge variant="outline">Tax inclusive</Badge>
      <Button>Edit</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  }
/>

// CORRECT — status in titleSlot, only buttons in actions
<PageHeader
  title={catalog.name}
  description={catalog.channelName}
  titleSlot={
    <div className="flex items-center gap-2">
      {catalog.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
      <Badge variant="outline">{catalog.taxInclusive ? 'Tax inclusive' : 'Tax exclusive'}</Badge>
    </div>
  }
  actions={
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">Edit</Button>
      <Button variant="destructive" size="sm">Delete</Button>
    </div>
  }
/>
```

## Badge — use `variant`, never className color overrides
`Badge` (`@vritti/quantum-ui/Badge`) ships `success`, `warning`, `destructive`, `secondary`, `outline` variants. Use the variant — do NOT hand-roll colors with `className`.

```tsx
// WRONG
<Badge className="bg-success/15 text-success">Active</Badge>

// CORRECT
<Badge variant="success">Active</Badge>
```

## Icons
- Use lucide-react icons, NOT custom inline SVG icons
- Common status icons: `CheckCircle2` (success), `AlertCircle` (error), `Info` (info), `TriangleAlert` (warning)
- Status page icon container pattern:
  ```tsx
  <div className="flex justify-center">
    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-{variant}/15">
      <IconComponent className="h-8 w-8 text-{variant}" />
    </div>
  </div>
  ```

## Alert Component
- Use quantum-ui Alert with `title` and `description` props
- NOT AlertTitle/AlertDescription as separate components
- Available variants: `default`, `destructive`, `warning`, `success`, `info`
- Pattern:
  ```tsx
  import { Alert } from '@vritti/quantum-ui/Alert';

  <Alert
    variant="destructive"
    title="Error"
    description="Error message here"
  />
  ```

## quantum-ui Initialization
Every microfrontend that uses quantum-ui axios must call `configureQuantumUI` before rendering:
```typescript
import { configureQuantumUI } from '@vritti/quantum-ui';
import quantumUIConfig from '../quantum-ui.config';

configureQuantumUI(quantumUIConfig);
```
Without this, quantum-ui falls back to defaults (wrong endpoints, wrong baseURL).

## Dialog State — use `useDialog`, never bare `useState(false)`
- ALWAYS use `useDialog()` from `@vritti/quantum-ui/hooks` to control dialog open/close state
- Never write `const [open, setOpen] = useState(false)` for a dialog

```tsx
// WRONG
const [editOpen, setEditOpen] = useState(false);
<Button onClick={() => setEditOpen(true)}>Edit</Button>
<Dialog open={editOpen} onOpenChange={setEditOpen} ... />

// CORRECT
import { useDialog } from '@vritti/quantum-ui/hooks';
const editDialog = useDialog();
<Button onClick={editDialog.open}>Edit</Button>
<Dialog
  open={editDialog.isOpen}
  onOpenChange={(v) => { if (!v) editDialog.close(); }}
  ...
/>
```

For dialogs triggered from a `DropdownMenu` item, use the `dialog` item type instead — no hook or state needed:
```tsx
// CORRECT — dialog lives inside the dropdown item definition
{
  type: 'dialog' as const,
  id: 'edit',
  label: 'Edit',
  icon: Pencil,
  dialog: {
    title: 'Edit Item',
    description: '...',
    content: (close) => <EditForm data={row.original} onSuccess={close} onCancel={close} />,
  },
}
```
The DropdownMenu renders the Dialog outside its content so it survives the dropdown unmount.

## Destructive Actions — use `useConfirm`, never inline confirm
- ALWAYS use `useConfirm()` from `@vritti/quantum-ui/hooks` before destructive mutations (delete, revoke, reset)
- Never use `window.confirm()` or roll a custom state-based confirm dialog
- Make the message specific: include the resource name and what will be lost

```tsx
// WRONG — no confirmation
onClick: () => deleteMutation.mutate(id)

// WRONG — generic message
description: 'Are you sure you want to delete this item? This action cannot be undone.'

// CORRECT
import { useConfirm } from '@vritti/quantum-ui/hooks';

const confirm = useConfirm();

async function handleDelete(id: string, name: string) {
  const confirmed = await confirm({
    title: `Delete ${name}?`,
    description: `${name} and all its associated data will be permanently removed. This action cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'destructive',
  });
  if (confirmed) deleteMutation.mutate(id);
}
```

Pass the resource name (and relevant context) into `handleDelete` so the description is specific, not generic.

## Slug-based Routes — use `buildSlug` + `useSlugParams`
- For detail page URLs that should show a readable name, use `buildSlug(name, id)` from `@vritti/quantum-ui/slug`
- The slug format is `name-slug~uuid` — the Breadcrumb auto-humanizes the name part
- In the detail page, use `useSlugParams()` from `@vritti/quantum-ui/hooks` to extract `{ name, id }`

```tsx
// Navigating to detail page
import { buildSlug } from '@vritti/quantum-ui/slug';
navigate(`/regions/${buildSlug(region.name, region.id)}`);
// → URL: /regions/us-east~bdfc838c-...

// In the detail page (route param must be named :slug)
import { useSlugParams } from '@vritti/quantum-ui/hooks';
const { id } = useSlugParams(); // UUID for API calls
```

Route param must be named `:slug`, not `:id`:
```typescript
{ path: 'regions/:slug', element: <RegionViewPage /> }
```

## Forms
- React Hook Form + Zod for validation
- Use `<Form>` component from quantum-ui (auto error mapping, auto loading states)
- Use `showRootError` for forms that receive general API errors
- Use `transformSubmit` when form shape differs from API DTO
- Use `rootErrorAction` for contextual actions inside the error Alert (e.g. "Login" button on 409)

## API Calls — Service → Hook → Page
- Services: pure functions wrapping axios (see `frontend-service.md`)
- Hooks: TanStack Query wrappers (see `frontend-hook.md`)
- Pages call hooks, never services directly

## Styling
- NEVER hardcode colors — use design tokens: `text-primary`, `bg-destructive/15`
- NEVER use pixels — use Tailwind classes: `p-4`, `gap-8`, `pt-16`
- Available tokens: primary, secondary, muted, accent, destructive, warning, success, foreground, background, card, border

## State Management
- AuthProvider in web-nexus for authentication state
- React Context for shared state within microfrontends
- No Redux

## Module Federation
- web-nexus is the host, loads remotes dynamically
- Microfrontends export route arrays (`authRoutes`, `accountRoutes`, `cloudRoutes`)
- Protocol auto-detected from `window.location.protocol`
- Environment variables use `PUBLIC_` prefix via `import.meta.env`

## DataTable — query, filters, context and defaults

`useDataTable` takes the table's query (a TanStack `useQuery` result — anything with `data`, `isLoading`, `isFetching`)
and returns one instance — the TanStack table, the query's loading flags, `contextValue` and `isLoaded` — which
`<DataTable table={…}>` renders whole. Never destructure the loading flags to pass them on, and never spread the instance.

```tsx
import { filter } from '@vritti/quantum-ui/filter';

const pricesTableQuery = prices.usePricesTable(supplierId, itemId);
const pricesTable = useDataTable({
  columns,
  query: pricesTableQuery,
  slug: `commerce-le-supplier-item-${itemId}-prices`,
  label: 'price record',
  defaultContext: [filter('asOf').equals(isoTodayDate(timeZone))], // fills the field whenever it is missing
  resetOnOpen: ['asOf'],
});
const siteId = pricesTable.contextValue('site'); // the picked value, read by field

<DataTable
  table={pricesTable}
  contextBar={<EnrolledSiteFilter name="site" label="Site" mode="context" supplierId={supplierId} clearable={false} selectFirst />}
  filters={[<SelectFilter key="status" name="status" options={STATUS_OPTIONS} multiple />]}
/>
```

- Name the pair after the hook: `usePricesTable` → `pricesTableQuery` / `pricesTable`. Destructure `const { table } =
  pricesTable` only where the TanStack table itself is read (`table.options.meta`, selection).
- Rows built on the page (a list query, a record's children) still go through `query`:
  `query: { data: { result: rows, count: rows.length }, isLoading }`. A table fed by props takes a `query:
  DataTableQuery<Row>` prop, and its parent passes the query — never `response` + `isLoading` props.
- Waiting on something else too? Fold it into the query passed in (`query: { ...q, isLoading: q.isLoading || other }`)
  — `<DataTable>` has no `isLoading` / `isFetching` props.
- Build conditions with `filter('field').<operator>(value)` — never hand-write `{ field, operator, value }`.
- Only the context bar has defaults. The filter panel starts empty and Reset empties it (or returns to the active view's
  filters). A context with a default can't be cleared — no prop needed.
- A context whose default is "the first option" (first site, first warehouse) uses the filter's `selectFirst` with
  `clearable={false}` — never a page-side list of ids fed into `defaultContext`. `selectFirst` waits while the filter is
  `loading`, so it never replaces a saved value still on its way.
- Never hold a context value in `useState` and pass it to the hook. A context control with a `value` prop stays the
  page's (controlled) — only for scratch inputs that must not be saved.
- An "as of" day is a saved context like any other, defaulting to today, and listed in `resetOnOpen` so the table opens
  on today instead of the day picked last (a view switch keeps the view's day). The backend reads it from
  `filters.context` — never an `asOf` query param.
- Context-mode filters show their own loading state (a pulsing bar in place of the value): `<DataTable>` marks its
  context bar loading until the stored state is shown, and a select marks itself while it resolves its label or picks
  its first option. Outside a DataTable, pass `loading` while the value is still being fetched. Never swap a context
  filter for a skeleton component or hide it behind `Suspense`.
- To open a table at a context from elsewhere (a row linking to another page's table), write the context into that
  table's saved state, drop its cached query, then navigate — never a URL param:
  ```ts
  await setTableContext(tableSlug, [filter('site').equals(siteId)]); // from '@vritti/quantum-ui/DataTable'
  queryClient.removeQueries({ queryKey: tableKey });                  // else the page shows the cached old state first
  navigate(path);
  ```
  `setTableContext` merges into the saved state server-side (`PATCH /table-states`), keeping the user's filters,
  sort, columns and view.
- A field lives in the filter panel or the context bar, never both.

## Context bars outside tables — `useContextState` + `<ContextBar>`

A view that is not a table (a graph, a summary) but has a context bar keeps it in **context state**: the user's saved
`FilterCondition[]` for the view's slug, read back by its API — the same idea as a table's `filters.context`, without
the table. Never hold such controls in `useState` with `value` / `onChange`, and never save them as a table state.

```tsx
import { ContextBar, useContextState } from '@vritti/quantum-ui/ContextBar';

const priceHistoryQuery = useInventoryItemPriceHistory(inventoryItemId);          // returns only what the chart draws
const priceHistoryContext = useContextState({
  slug: `commerce-le-inventory-item-${inventoryItemId}-price-history`,       // loads GET /context-states?slug=
  defaultContext: [
    filter('period').between(range.from, range.to),
    filter('uom').equals(item.uomId),
    filter('currency').equals(useWorkspaceCurrency()),                     // an entity / workspace default
  ],
  resets: { site: ['supplierIds', 'mrpIds'] },                               // a new site clears its dependents
  onStatePush: () => queryClient.invalidateQueries({ queryKey: PRICE_HISTORY_KEY(inventoryItemId) }),
});
const [from, to] = priceHistoryContext.contextValues('period');

<ContextBar state={priceHistoryContext}>
  <EnrolledSiteFilter name="site" label="Site" mode="context" inventoryItemId={inventoryItemId} clearable={false} selectFirst />
  <CurrencyFilter name="currency" mode="context" clearable={false} selectFirst />
  <SupplierFilter name="supplierIds" label="Suppliers" mode="context" multiple />
  <DateRangeFilter name="period" label="Period" mode="context" />
</ContextBar>
```

- The view's endpoint returns **only the data it renders** (the chart's lines, a table's rows) — never `context`,
  picker options, defaults or counts. Those come from their own sources: the saved context from `useContextState`, a
  picker's options from its `select-api` endpoint, a "first option" default from `selectFirst`, and an entity default
  from the entity's own query.
- A picker lists what **can** be chosen, never only what has data in the view. Don't narrow its options to the rows
  the view would draw ("suppliers priced in this window", "currencies quoted here") — a choice with no data renders the
  view's empty state. Narrow only by real relationships (an item's MRPs, the sites a supplier is enrolled at).

- Everything a DataTable context bar does works the same: defaults (`defaultContext`, `resetOnOpen`), a default makes
  the control non-clearable, `selectFirst`, and the loading bar until the saved context loads.
- `contextValue(field)` reads a single value, `contextValues(field)` a list or a `between` pair.
- A saved value that no longer exists (a deleted unit, site or supplier) needs no handling in the page: the filter drops
  it once its `values=` lookup comes back without it, and the default or `selectFirst` fills the gap. The endpoint just
  ignores a value it can't apply.
- Show the view's loading state while `isSettling` (the context is loading, a change is saving and refetching, or a
  `selectFirst` control is still picking) — not just `query.isLoading`. A response for a half-set context renders empty.
- The hook saves with `PUT /context-states` (debounced) and calls `onStatePush`; the backend reads it with
  `ContextStateService.getContextState` and narrows rows with `FilterProcessor.buildWhere(context, FIELD_MAP)`.

## Charts — `useChart` + `<XChart chart={…}>`

Every quantum-ui chart (`LineChart`, `AreaChart`, `BarChart`, `PieChart`, `RadarChart`, `RadialChart`) draws a
`useChart` instance, the way `DataTable` draws a `useDataTable` one. Never pass rows, a config or loading flags to a chart.

```tsx
import { ChartKey, useChart } from '@vritti/quantum-ui/Chart';

const select = useCallback((data: PriceHistory, context: ContextStateInstance) => selectPriceHistory(data, context, today), [today]);
const chart = useChart({
  query: historyQueryOptions,      // query options (`queryOptions({...})`) — useChart runs them; or `data` the page holds
  select,                          // data (+ context) → { rows, series: [{ id, label, color? }], …extras }
  slug: `commerce-le-inventory-item-${id}-price-history`, // optional: owns the context bar's saved state
  defaultContext, resets, onStatePush,
});

<LineChart
  chart={chart}
  contextBar={<ContextBar state={chart.context}>…</ContextBar>}  // set above the chart, like DataTable's
  xAxisKey="at" xAxisType="time" curve="stepAfter"               // mode="tab" by default
/>
<ChartKey chart={chart} title="Prices in Force" value={(line) => …} detail={(line) => …} />
```

- `useChart` holds the first request until the context bar has settled (loaded, any change saved, every control done
  checking or picking its value), so the endpoint only ever sees a confirmed context — endpoints stay strict, no
  fallbacks for stale saved values. Price-history hooks therefore return query options (`use…Query`), not a query.
- The chart owns its states inside its bordered frame: skeleton while `chart.isLoading` (first load, the context loading,
  a change saving, a `selectFirst` still picking), a failed load with Retry, the `emptyState`, then the chart.
- `useChart` colours the series: each keeps one palette slot while drawn, so filtering never repaints a survivor. A
  series with a meaning (a status) passes its own `color`; series past the eight-colour palette are not drawn.
- Series `id`s key the rows' values — letters, digits, `-` and `_` (UUIDs are fine).
- `mode` sets the height: `tab` (default) sizes the context bar and the frame together to the screen below a tab's
  header, so the chart takes whatever the bar's rows leave; `compact` is a fixed `h-96` frame. Pass the context bar
  through `contextBar`, never above the chart yourself. Inside a titled `Card`, use `compact` and drop the frame with `className="border-0 p-0"`.
- A key for the lines is a `ChartKey`, never a hand-built list.

## Site pickers — one endpoint, `select-api/sites`

Every site picker reads core-api's `select-api/sites`: the session legal entity's active sites. commerce-service only
narrows them, by returning site ids.

| Param | Lists |
|---|---|
| `ids` | only these sites |
| `supplierId` / `inventoryItemId` (one of them) | the sites the supplier — or any supplier of the item — is enrolled at |
| `isEnrolled=false` | with an owner: the sites with no enrollment yet (any enrollment, paused too, counts as one) |
| `isActive=true` | with enrolled sites: only active enrollments of active suppliers |

- `SiteSelector` / `SiteFilter` — every site of the legal entity.
- `EnrolledSiteSelector` (form fields — the record is written there) sends `isEnrolled` + `isActive`: active
  enrollments only. `isEnrolled={false}` offers the sites a supplier can still be enrolled at.
- `EnrolledSiteFilter` (filters and contexts — data is viewed there) sends only `isEnrolled`, so a paused enrollment's
  history stays reachable.
- Never add a per-feature "sites with data" endpoint or a `siteIds` prop to feed a picker.
