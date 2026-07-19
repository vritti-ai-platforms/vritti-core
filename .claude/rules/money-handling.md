---
description: Money/currency storage and conversion — bigint end-to-end, never Number()
paths:
  - "src/db/schema/**/*.ts"
  - "src/**/*.service.ts"
  - "src/**/*.repository.ts"
  - "src/**/*.dto.ts"
---

# Money & Currency Handling

Money is stored as **minor units in a `bigint` column** and travels the wire as the composite
`{ currency, value }` (major-unit string). Conversion is done **only** by the `@vritti/api-sdk/money`
helpers — **never** by `Number()`. `Number(majorToMinor(...))` / `Number(minorToMajor(...))` is a
banned antipattern: it round-trips a `bigint` through a float64 and loses precision past 2^53,
which defeats the entire point of the `bigint` column.

## Column: `bigint` mode, never `number`

```typescript
// CORRECT — bigint marshaling, precise; defaults are bigint literals (0n)
amount: bigint('amount', { mode: 'bigint' }).notNull(),
taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull().default(0n),

// WRONG — mode: 'number' forces every read/write through a JS float
amount: bigint('amount', { mode: 'number' }).notNull(),
```

`mode` is JS-marshaling only — switching `'number'` → `'bigint'` is **code-only, no DB migration**
(the column is already `bigint` in Postgres; `db:generate` produces no diff).

## Write path: store the `bigint` directly

```typescript
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';

// CORRECT — majorToMinor returns bigint; store it as-is. 3rd arg binds validation errors to the field.
const amount = majorToMinor(dto.amount.value, dto.amount.currency as CurrencyCode, 'amount');
await this.repo.create({ ...rest, amount }); // amount: bigint

// WRONG — Number() flattens the bigint and reintroduces precision loss
const amount = Number(majorToMinor(dto.amount.value, dto.amount.currency as CurrencyCode));
```

Repository setters/args are typed `bigint`, not `number`:
```typescript
async updateAmount(id: string, amount: bigint): Promise<Entity> { ... }
```

### Convert inside the (domain) service, never in the controller

`majorToMinor` is business logic — it belongs in the **domain service**, not the controller,
message-pattern handler, or app-layer service. The controller stays a thin passthrough: it hands
the wire DTO (with `CurrencyAmountDto`) straight to the domain service, which converts internally.
Because the money request DTO is thus the domain's real input, it lives in the **domain**
(`@domain/<x>/dto/request/`) and the controller imports it downward — same as any other domain DTO.

```typescript
// WRONG — controller/message-pattern handler converts before calling the service
@MessagePattern({ cmd: 'le.suppliers.addItemPrice' })
addItemPrice(@Payload() dto: AddSupplierItemPriceDto) {
  return this.service.addPrice(dto.supplierItemId, {
    unitPrice: majorToMinor(dto.unitPrice.value, dto.unitPrice.currency as CurrencyCode, 'unitPrice'),
  });
}

// CORRECT — controller is a passthrough; the domain service converts
@MessagePattern({ cmd: 'le.suppliers.addItemPrice' })
addItemPrice(@Payload() dto: AddSupplierItemPriceDto) {
  return this.service.addPrice(dto); // dto imported from @domain/supplier-items/dto/request
}

// domain service — the conversion lives here
async addPrice(dto: AddSupplierItemPriceDto): Promise<CreateResponseDto<...>> {
  const unitPrice = majorToMinor(dto.unitPrice.value, dto.unitPrice.currency as CurrencyCode, 'unitPrice');
  ...
}
```

Scope context (`siteId`) still flows from the controller as a separate arg — that is context
injection, not money conversion. Commerce does NOT capture created-by/`userId` on records.

## Read path: `CurrencyAmountDto.from(bigint, currencyCode)`

```typescript
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

// CORRECT — column is mode:'bigint', so entity.amount is already a bigint; no BigInt() wrap
dto.price = CurrencyAmountDto.from(entity.amount, currencyCode); // → { currency, value }

// WRONG — BigInt(number) only appears because the column was mistakenly mode:'number'
dto.price = CurrencyAmountDto.from(BigInt(entity.amount), currencyCode);
```

## Request DTOs: composite, validated with `@IsCurrency()`

Never accept a raw minor-unit int. Accept `{ currency, value }` and convert on the server.

```typescript
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';

export class UpsertPriceDto {
  @ApiProperty({ example: { currency: 'INR', value: '999.00' }, description: 'Amount in major units' })
  @IsCurrency() // self-contained — do NOT add @ValidateNested/@Type on the amount field
  amount: CurrencyAmountDto;
}
```

## Money is never `null` — use an explicit zero

A money response field should not be `T | null`. When there is no value, emit an explicit zero in
the relevant currency:

```typescript
// CORRECT
price: CurrencyAmountDto.from(row.amount ?? 0n, currencyCode); // CurrencyAmountDto, value '0' when unpriced

// WRONG
price: row.amount != null ? CurrencyAmountDto.from(row.amount, currencyCode) : null;
```

## Rules

- **Columns**: money → `bigint('col', { mode: 'bigint' })`; defaults are bigint literals (`0n`).
- **Never `Number(...)`** around `majorToMinor`/`minorToMajor` — carry the `bigint`.
- **Write**: `majorToMinor(value, currency, 'field')` → store the returned `bigint` directly.
- **Convert in the domain service, never the controller**: controllers pass the `CurrencyAmountDto` DTO through; the domain service calls `majorToMinor`. The money request DTO therefore lives in `@domain/<x>/dto/request/`.
- **Read**: `CurrencyAmountDto.from(entity.amount, currencyCode)` — no `BigInt()` wrap for `mode:'bigint'` columns.
- **Request DTOs**: `@IsCurrency() amount: CurrencyAmountDto`, never a minor-unit `number`.
- **Response DTOs**: money fields are `CurrencyAmountDto`, never nullable — use `?? 0n`.
- **Imports**: `@vritti/api-sdk/money` (`majorToMinor`, `minorToMajor`, `CurrencyAmountDto`, `IsCurrency`, `CurrencyCode`).
- **Frontend** (see `value-formatting.md`): `CurrencyField` emits `{ currency, value }` — send it as-is (server converts); render via `useFormatters`/`CurrencyCell`; never `.toFixed()` or `Number(minorToMajor(...))`.
