---
description: Frontend value formatting — dates, currency, numbers, identifier strings
paths:
  - "apps/**/*.{ts,tsx}"
---

# Value Formatting

Never hand-roll value rendering. Use the quantum-ui formatter surfaces — they share a single
source of truth (`@vritti/quantum-ui/lib/utils/format.ts`) so locale, currency decimals (via
dinero / `money.ts`), BU timezone, and Intl options are applied consistently across detail
panels and tables.

## Forbidden patterns

```tsx
// WRONG — bypasses locale + BU timezone
new Date(x).toLocaleDateString()
new Date(x).toLocaleString()

// WRONG — bypasses Intl + currency decimals; OMR/JPY/KWD break
`${money.currency} ${money.value}`
value.toFixed(2)

// WRONG — inline mono styling for identifier strings
<span className="font-mono">{po.poNumber}</span>
```

## Surfaces

### 1. DetailField — for label + value pairs (detail panels)

```tsx
import { DetailField } from '@vritti/quantum-ui/DetailField';

<DetailField label="PO Number" type="string" value={po.poNumber} mono />
<DetailField label="Quantity" type="number" value={item.qty} />
<DetailField label="Total" type="currency" value={po.totalAmount} exchangeRate={po.exchangeRate} />
<DetailField label="Order Date" type="date" value={po.orderDate} />
<DetailField label="Created" type="dateTime" value={po.createdAt} timeZone={po.timezone} />
```

`type` is a discriminated union — each type only accepts its relevant extras:

| `type` | `value` shape | Extras |
|---|---|---|
| `"string"` | `ReactNode` (text, JSX, badges) | `mono?: boolean` for identifier-style values (codes, PO numbers, SKUs) |
| `"number"` | `number \| string \| null` | `fractionDigits?: number` (rare — usually let locale drive) |
| `"currency"` | `{ currency, value }` major-units pair | `exchangeRate?: number \| null` → renders BU-currency secondary inline when rate is set and BU currency differs |
| `"date"` | ISO date string (`"YYYY-MM-DD"` or full ISO) | — |
| `"dateTime"` | full ISO string | `timeZone?: string` (falls back to BU timezone from context) |

`null`/`undefined` renders as `—` automatically. Don't wrap with `value={x ?? '—'}`.

### 2. DataTable cell components — for simple table cells

```tsx
import { CurrencyCell, DateCell, DateTimeCell, NumberCell, StringCell } from '@vritti/quantum-ui/DataTable';

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'totalAmount', cell: ({ row }) => <CurrencyCell value={row.original.totalAmount} exchangeRate={row.original.exchangeRate} /> },
  { accessorKey: 'orderDate',   cell: ({ row }) => <DateCell value={row.original.orderDate} /> },
  { accessorKey: 'createdAt',   cell: ({ row }) => <DateTimeCell value={row.original.createdAt} timeZone={row.original.timezone} /> },
  { accessorKey: 'qty',         cell: ({ row }) => <NumberCell value={row.original.qty} /> },
  { accessorKey: 'code',        cell: ({ row }) => <StringCell value={row.original.code} mono /> },
];
```

`NumberCell` and `CurrencyCell` auto-render in monospace. `StringCell` opt-in via `mono` prop.

Don't migrate plain text passthrough — `cell: ({ row }) => row.original.name` is fine. Only
reach for `<StringCell>` when you need `mono` styling.

### 3. useFormatters hook — for composed cells / mixed JSX

When a cell wraps multiple formatted values, badges, or has conditional rendering that the
simple cell components can't express, call the hook once at the top of your component:

```tsx
import { useFormatters } from '@vritti/quantum-ui/hooks';

const fmt = useFormatters();
const columns = useMemo<ColumnDef<Row>[]>(() => [
  {
    accessorKey: 'unitPrice',
    cell: ({ row }) => (
      <span className="font-mono">
        {fmt.currency(row.original.unitPrice).primary}
        {row.original.isCrossUom && (
          <span className="text-xs text-muted-foreground">
            {' '}({fmt.currency(row.original.altPrice).primary})
          </span>
        )}
      </span>
    ),
  },
], [fmt]); // always include fmt in the deps
```

Hook API (each returns `{ primary, secondary? }`):

- `fmt.string(value)`
- `fmt.number(value, { fractionDigits? })`
- `fmt.currency(value, { exchangeRate? })`
- `fmt.date(value)`
- `fmt.dateTime(value, { timeZone? })`

`fmt` is memoized — stable across renders unless locale / BU currency / BU timezone change.
Safe to use as a `useMemo` dependency.

## Rules

- **Don't hardcode `fractionDigits`** — let the locale or currency drive precision. If you
  feel the need to write `fractionDigits={2}`, the underlying value is probably a money
  amount whose schema should carry `{ currency, value }` instead.
- **Don't fabricate `{ currency, value }` objects** from preformatted strings or plain numbers.
  If a money field is stored as `number` in the schema, render with `<NumberCell>` and flag
  the backend schema for migration to `{ currency, value }`.
- **Don't introduce custom date-fns format strings** — the locale `P`/`Pp` presets cover
  effectively all real cases.
- **Don't wrap plain text passthrough in `<StringCell>`** — that's churn.
- **Status badges, RowActions, computed JSX trees** — leave them alone. Formatters are for
  primitive value rendering.

## Single source of truth

`quantum-ui/lib/utils/format.ts` exposes pure functions (no hooks) — `formatString`,
`formatNumber`, `formatCurrency`, `formatDate`, `formatDateTime`. All three surfaces above
(DetailField, cell components, useFormatters) consume these. Any locale, currency-decimal,
or timezone bug should be fixed in this one file and will propagate to detail panels and
data tables alike. Importable outside React via `@vritti/quantum-ui/format` if needed.
