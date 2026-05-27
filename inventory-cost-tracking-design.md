# Inventory Cost Tracking — Design Document

This document captures the full design discussion for adding exact, batch-traced cost tracking to Vritti's inventory system. The system is intended to be built gradually in small, independent tasks.

## 1. Goals

Track the **exact cost per inventory batch** so that:

- Each unit of stock knows what it actually cost — including freight, duties, and other landed costs.
- Selling a unit produces an accurate cost-of-goods-sold (COGS) number, so per-product, per-PO, per-supplier, and per-period profitability are correct.
- Costs that arrive late (freight bills, duties invoices) can be captured after the goods receipt without restructuring stock.
- Stock transferred between business units carries its cost basis with it, optionally plus any inter-BU logistics costs.

Explicitly not goals (deferred for later):

- Average-cost or standard-cost valuation methods.
- Retroactive COGS adjustment on already-sold units (variance is tracked but not posted as accounting entries).
- Consolidated freight bills covering multiple shipments.
- Multi-currency cost storage on a single quant.

## 2. Core Concepts

### 2.1. Exact cost per quant — no averaging

Every quant is **one batch's worth of stock at one location**. If a second receipt brings in more stock of the same item to the same location at a different cost, it creates **a new quant** — do not merge with the existing one. Cost basis stays separate per batch.

### 2.2. Cost breakdown — many-to-many model

A quant's total cost is the sum of multiple cost contributions. Each contribution is a first-class entity:

- **Item cost** — the supplier invoice price, established at goods receipt publish.
- **Freight cost** — carrier bill, captured separately (often arrives later).
- **Duties cost** — customs/import duties.
- **Handling cost** — packaging, labor, in-house movement charges.
- **Other** — catch-all.

Each contribution is a row in `inventory_item_costs`. It links to one or more quants via a junction table that stores the allocated amount per quant.

### 2.3. Pick strategy — batch order only

When stock is consumed (POS sale, transfer out), the system picks which quants to consume in an order determined by the BU's pick strategy:

- **FEFO** — first-expiring first-out (default, suits regulated and perishable goods).
- **FIFO** — first-in first-out (oldest receipt first).
- **LIFO** — last-in first-out.

Because cost is already on the quant, there is **no separate cost-based pick strategy**. Once a quant is picked, its cost is known.

Ties on the chosen field (e.g., two quants with the same expiry) are broken deterministically by quant `id`.

### 2.4. Freight cost lives on the source document

A freight bill is captured **on the goods receipt or stock transfer that brought the stock in**, not in a separate "landed cost adjustment" document. The lifecycle of each source document includes a `freight_linked` stage:

```
Goods Receipt:   draft → published → freight_linked
Stock Transfer:  draft → requested → approved → delivered → freight_linked
```

Stock becomes available immediately upon publish/delivery. Freight can be linked later (when the carrier bill arrives), at which point the cost is folded into the quants the document created. Once `freight_linked` is set, the freight portion of the document is frozen for audit.

### 2.5. Stock transfers inherit cost from source

When stock moves between BUs, destination quants receive the **same cost record links** as their source quants. Additional inter-BU costs (logistics, packaging) are captured on the transfer's own `freight_linked` step and apply only to destination quants.

### 2.6. Denormalized total on the quant

For performance, each quant carries a `totalUnitCost` column — the sum of all its allocated cost contributions divided by quantity. This makes the COGS read at sale time a single column lookup (no joins). The service maintains this denormalization whenever cost junction rows are created.

## 3. Final Schemas

All currency amounts are in **minor units of the BU's home currency**, stored as `bigint`. Per-unit costs are also in minor units (per single unit).

### 3.1. `inventory_item_quants` — additions

```ts
inventory_item_quants:
  ...existing columns...

  totalUnitCost:   bigint('total_unit_cost', { mode: 'bigint' }).notNull().default(0n)
  costCurrency:    varchar('cost_currency', { length: 3 }).notNull()

  sourceType:      enum('source_type', ['goods_receipt', 'stock_transfer']).notNull()
  sourceId:        uuid('source_id').notNull()
```

- `totalUnitCost` — denormalized sum of `allocatedAmount` from all junction rows, divided by `quantity`. Updated by the cost service.
- `costCurrency` — BU home currency at quant creation. Should match BU currency 99% of the time; included as a column for future multi-currency support.
- `sourceType` / `sourceId` — which document created this quant. Enables "what cost contributions apply to this quant".

### 3.2. `inventory_item_costs` — new

```ts
inventory_item_costs:
  id:                  uuid PK
  organizationId:      uuid
  businessUnitId:      uuid

  category:            enum('cost_category', ['item', 'freight', 'duties', 'handling', 'other'])
  totalAmount:         bigint('total_amount', { mode: 'bigint' }).notNull()
  currencyCode:        varchar(3).notNull()

  sourceType:          enum('cost_source_type', ['goods_receipt', 'stock_transfer', 'manual_adjustment'])
  sourceId:            uuid.notNull()

  distributionMethod:  enum('distribution_method', ['by_value', 'by_quantity', 'equal']).notNull().default('by_value')

  vendorRef:           varchar(100).nullable
  notes:               text.nullable

  createdAt, updatedAt
```

One row per cost contribution. Example rows produced by various flows:

- GR publishes a line item → one `item` cost row for that line.
- Freight linked on a GR → one `freight` cost row (and possibly `duties`, `handling`, `other` rows).
- Freight linked on a transfer → same — one cost row per non-zero category.

### 3.3. `inventory_item_quant_costs` — new junction

```ts
inventory_item_quant_costs:
  quantId:          uuid → inventory_item_quants.id (cascade delete)
  costId:           uuid → inventory_item_costs.id  (restrict delete)
  allocatedAmount:  bigint('allocated_amount', { mode: 'bigint' }).notNull()

  PRIMARY KEY (quantId, costId)

  index on quantId
  index on costId
```

The allocated amount sits on the relationship edge. A single cost record can be split across many quants; a single quant can carry contributions from many cost records.

### 3.4. `goods_receipts` — additions

```ts
goods_receipts:
  ...existing columns...

  freightLinkedAt:  timestamp.nullable
  freightLinkedBy:  uuid.nullable
```

The actual freight numbers are not columns on this table — they're stored as `inventory_item_costs` rows with `sourceType='goods_receipt'` and `sourceId=<gr.id>`. The timestamps mark when the cost was captured and lock the freight portion of the document.

### 3.5. `stock_transfers` — additions

```ts
stock_transfers:
  ...existing columns...

  freightLinkedAt:  timestamp.nullable
  freightLinkedBy:  uuid.nullable
```

Same shape as the GR additions. Cost numbers live in `inventory_item_costs` rows with `sourceType='stock_transfer'`.

### 3.6. `business_units` — pick strategy

```ts
business_units:
  ...existing columns...

  pickStrategy:  enum('pick_strategy', ['FEFO', 'FIFO', 'LIFO']).notNull().default('FEFO')
```

### 3.7. Order line — COGS snapshot

When an order consumes stock, snapshot the cost so historical reports stay accurate even if quants are later deleted or adjusted.

```ts
order_items:
  ...existing columns...

  cogsAmount:    bigint('cogs_amount', { mode: 'bigint' }).notNull().default(0n)  // total cost for this line at sale time
  cogsCurrency:  varchar(3).notNull()
```

For lots/serials, multi-pick per line (where one line consumes from multiple quants), add:

```ts
order_item_picks:                          // optional child table for multi-quant lines
  id, orderItemId
  quantId
  qty:           decimal(12, 3, mode: 'number')
  unitCost:      bigint('unit_cost', { mode: 'bigint' })   // snapshot of quant.totalUnitCost at sale time
```

Single-pick lines can skip this child table and store cost directly on `order_items`. Decide once based on whether multi-pick is the norm or the exception.

## 4. Lifecycles

### Goods Receipt

```
draft  ────────────►  published  ────────────►  freight_linked
       (publish)       (creates quants          (creates freight/duties/handling
        creates         + item-cost rows)        cost rows + junction; sets
        quants                                   freightLinkedAt)
```

`freight_linked` is optional — a GR can stay in `published` indefinitely if no separate freight applies (e.g., supplier-included freight).

### Stock Transfer

```
draft  ──►  requested  ──►  approved  ──►  delivered  ──►  freight_linked
                                            (creates           (creates freight
                                             destination        cost rows for
                                             quants +           destination quants)
                                             inherits cost
                                             from source)
```

### Cost record states

`inventory_item_costs` rows are **immutable once created** — they don't have a status. They represent an event ("₹500 freight was applied"). To correct a cost, create a new record with category preserved and `sourceType='manual_adjustment'`. Allocated amounts can be positive or negative, allowing reversals.

## 5. Publish & Distribution Flows

### 5.1. Goods Receipt publish

```
For each line item L in GR:
  1. Compute primaryUomQty and other line snapshots (already implemented).
  2. Create the quant(s) for L at the receiving location, with totalUnitCost=0.
  3. Create one cost row:
       inventory_item_costs:
         category='item'
         totalAmount = invoicePrice × qty(L)
         sourceType='goods_receipt'
         sourceId=GR.id
  4. Create junction row:
       quantId=newQuant.id
       costId=newCost.id
       allocatedAmount = invoicePrice × qty(L)
  5. Update quant.totalUnitCost = allocatedAmount / quantity
```

### 5.2. Freight cost linking (GR or stock transfer — same logic)

```
Input:
  sourceType ∈ {'goods_receipt', 'stock_transfer'}
  sourceId
  freightAmount, dutiesAmount, handlingAmount, otherAmount
  distributionMethod
  vendorRef, notes

Steps:
  1. Find affected quants:
       For GR:       WHERE sourceType='goods_receipt' AND sourceId=GR.id
       For transfer: destination quants of the transfer (BU=receiving BU)

  2. Compute base for distribution:
       'by_value':    sum of (quant.totalUnitCost × quantity) across affected quants
       'by_quantity': sum of quantity across affected quants
       'equal':       count of affected quants

  3. For each non-zero category (freight/duties/handling/other):
       a. Create one inventory_item_costs row with the category and totalAmount.
       b. For each affected quant, compute its share:
            'by_value':    share = (quant.totalUnitCost × quantity) / base
            'by_quantity': share = quantity / base
            'equal':       share = 1 / count
          allocatedAmount = totalAmount × share   (Decimal math, .toFixed(0) → BigInt)
       c. Create junction row (quantId, costId, allocatedAmount).
       d. quant.totalUnitCost += allocatedAmount / quantity   (Decimal math)

  4. Set sourceDocument.freightLinkedAt = now(), freightLinkedBy = currentUser.
```

### 5.3. Stock transfer publish (cost inheritance)

```
For each unit transferred (i.e., each destination quant being created):
  1. Find source quants being consumed (already implemented).
  2. For each cost record linked to the source quant via junction:
       Create a new junction row:
         quantId = destinationQuant.id
         costId  = sameCostId   (cost record is shared between source and destination)
         allocatedAmount = source.allocatedAmount × (transferred_qty / source.quantity)
  3. destinationQuant.totalUnitCost = source.totalUnitCost
```

Note: source and destination share cost record IDs. This means a future cost adjustment on the source quant's cost record is automatically reflected in the destination quant. Usually desirable; if not, the manual adjustment cost type can be used to scope the change.

### 5.4. Distribution rounding

All distribution math goes through `Decimal` per the codebase rule:

```ts
allocatedAmount = BigInt(
  new Decimal(totalAmount.toString())
    .times(share)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toFixed(0)
);
```

The last quant in the distribution loop **absorbs the rounding remainder**: `lastAllocated = totalAmount - sum(otherAllocations)`. This guarantees `sum(allocations) === totalAmount` exactly.

## 6. Picking Logic at Sale Time

```ts
async pickQuants(
  inventoryItemId: string,
  locationId: string,
  qtyNeeded: number,
  strategy: 'FEFO' | 'FIFO' | 'LIFO',
): Promise<Pick[]> {
  const candidates = await fetchQuantsAtLocationWithLot(inventoryItemId, locationId);
  // candidates: quants with quantity > 0, including their lot if any

  candidates.sort((a, b) => {
    const primary = compareByStrategy(a, b, strategy);
    if (primary !== 0) return primary;
    return a.id.localeCompare(b.id);   // deterministic tiebreak
  });

  const picks: Pick[] = [];
  let remaining = qtyNeeded;
  for (const q of candidates) {
    if (remaining === 0) break;
    const take = Math.min(q.quantity, remaining);
    picks.push({ quantId: q.id, qty: take, unitCost: q.totalUnitCost });
    remaining -= take;
  }
  if (remaining > 0) {
    throw new BadRequestException('Insufficient stock at this location.');
  }
  return picks;
}

function compareByStrategy(a, b, strategy) {
  switch (strategy) {
    case 'FEFO':
      return (a.lot?.expiryDate ?? '9999-12-31').localeCompare(b.lot?.expiryDate ?? '9999-12-31');
    case 'FIFO':
      return a.createdAt.getTime() - b.createdAt.getTime();
    case 'LIFO':
      return b.createdAt.getTime() - a.createdAt.getTime();
  }
}
```

For non-lot-tracked items, FEFO falls back to FIFO behavior (all quants have a default `'9999-12-31'` for sort purposes).

## 7. COGS Snapshot at Sale

When an order item is created:

```ts
const picks = await pickService.pickQuants(itemId, locationId, qty, bu.pickStrategy);

let totalCogs = 0n;
for (const p of picks) {
  totalCogs += BigInt(
    new Decimal(p.unitCost.toString())
      .times(p.qty)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toFixed(0)
  );
}

// store on order_items
orderItem.cogsAmount = totalCogs;
orderItem.cogsCurrency = bu.currencyCode;

// optionally write order_item_picks rows for full audit
for (const p of picks) {
  await orderItemPicksRepo.create({ orderItemId, quantId: p.quantId, qty: p.qty, unitCost: p.unitCost });
}

// debit the quants
for (const p of picks) {
  await quantsRepo.decrementQuantity(p.quantId, p.qty);
}
```

## 8. Reports

### Total cost on a quant

```sql
SELECT total_unit_cost FROM inventory_item_quants WHERE id = $1;
```

### Cost breakdown for a quant

```sql
SELECT c.category, SUM(qc.allocated_amount) AS amount
FROM inventory_item_quant_costs qc
JOIN inventory_item_costs c ON c.id = qc.cost_id
WHERE qc.quant_id = $1
GROUP BY c.category;
```

### Total freight on a GR

```sql
SELECT SUM(total_amount) FROM inventory_item_costs
WHERE source_type = 'goods_receipt'
  AND source_id = $1
  AND category = 'freight';
```

### Gross profit for an order

```sql
SELECT
  SUM(line_total) AS revenue,
  SUM(cogs_amount) AS cogs,
  SUM(line_total) - SUM(cogs_amount) AS gross_profit
FROM order_items
WHERE order_id = $1;
```

### Gross profit attributable to a PO

```sql
-- Sales of stock that came from GRs linked to PO X
SELECT
  SUM(oip.qty * (oi.unit_price)) AS revenue,
  SUM(oip.qty * oip.unit_cost) AS cogs
FROM order_item_picks oip
JOIN inventory_item_quants q ON q.id = oip.quant_id
JOIN order_items oi ON oi.id = oip.order_item_id
WHERE q.source_type = 'goods_receipt'
  AND q.source_id IN (SELECT id FROM goods_receipts WHERE purchase_order_id = $1);
```

### Cost composition across inventory (e.g., "what % of my stock value is freight?")

```sql
SELECT
  c.category,
  SUM(qc.allocated_amount * (q.quantity / NULLIF(orig_q.quantity, 0))) AS value_remaining
FROM inventory_item_quant_costs qc
JOIN inventory_item_costs c ON c.id = qc.cost_id
JOIN inventory_item_quants q ON q.id = qc.quant_id
WHERE q.quantity > 0
GROUP BY c.category;
```

## 9. Edge Cases

### 9.1. Some stock already sold before freight is linked

A GR creates 100 units; 30 are sold; the freight bill then arrives.

**Strict (v1):** Distribute freight only across the **remaining 70 units**. The 30 sold units keep their original COGS — they're slightly under-costed. Track the unallocated portion on the cost record itself:

```ts
inventory_item_costs:
  ...
  unallocatedAmount:  bigint default 0n     // for cost contributions that couldn't be fully allocated
```

For now, when computing distribution: if some quantity has been sold, compute the unallocated portion as `totalAmount × (sold_qty / received_qty)` and store it on the cost record. It's informational — a known small inaccuracy.

**Sophisticated (later):** Create cost-adjustment journal entries that retroactively increase COGS on the 30 sold units. Not built in v1.

### 9.2. Multi-currency

Costs are stored in BU home currency. If the supplier invoice is in a different currency, the PO's `exchangeRate` is used at GR publish time to convert into BU currency. Subsequent FX moves don't re-value inventory (parking lot for now — adding currency revaluation requires accounting entries we haven't designed yet).

### 9.3. Cost adjustments after freight linking

If freight needs to be corrected after `freight_linked`:

1. Create a new `inventory_item_costs` row with `sourceType='manual_adjustment'`, `sourceId=<originalCostId>`, the **delta** as `totalAmount` (positive or negative), and the same `category`.
2. Distribute across the same quants the original cost touched.
3. Update `totalUnitCost` on each quant.

This avoids ever mutating the original cost record — full audit trail.

### 9.4. Items received at different costs into the same location

Two GRs bring shampoo into Main shelf at different prices.

- Each GR creates a **separate quant** at Main shelf for shampoo.
- They are not merged because their cost basis differs.
- The pick strategy decides which one is consumed first.

If a strict "one quant per (item, location, lot)" invariant exists in the current schema, it must be relaxed — multiple quants per the same triple are valid when their cost basis differs.

### 9.5. Returns from customer

Returning stock to inventory creates a new quant (or refills an existing one), but at what cost? Two options:

- **Original cost from the order line's `cogsAmount`** — restock at the original cost it left at.
- **Current cost** — restock at the current weighted-average for that item.

V1: use original cost (preserves the perfect trace).

### 9.6. Returns to supplier (RMA against a GR)

Reverse the original cost contribution. Create a `manual_adjustment` cost row with negative amount, scoped to the affected quants. Reduce `totalUnitCost` accordingly. Reduce the quant quantity (or delete if zero).

### 9.7. Stock transfer of partially-consumed batches

If transferring 10 units from a 50-unit quant, the cost inheritance allocates proportional shares: `destination.allocatedAmount = source.allocatedAmount × (10 / 50)`. Source quant is reduced to 40; its allocated amounts also reduce proportionally.

## 10. Implementation Plan (Suggested Task Breakdown)

These tasks are designed to be independent enough to ship one at a time without breaking existing functionality. Order matters: earlier tasks lay the foundation later ones need.

### Phase A — Foundation schema (DB only)

1. **A1.** Add `totalUnitCost`, `costCurrency`, `sourceType`, `sourceId` columns to `inventory_item_quants`. Migration. All existing quants get a backfilled `totalUnitCost = 0n` and `sourceType = 'goods_receipt'`, `sourceId = ?` (or relax NOT NULL until migration is complete).
2. **A2.** Create `inventory_item_costs` table (+ enums + RLS policies).
3. **A3.** Create `inventory_item_quant_costs` junction table (+ RLS policies).
4. **A4.** Add `freightLinkedAt`, `freightLinkedBy` columns to `goods_receipts` and `stock_transfers`.
5. **A5.** Add `pickStrategy` enum + column to `business_units`.

### Phase B — Cost service & GR publish wiring

6. **B1.** Create `InventoryItemCostsDomainModule` with a service and repository for managing cost records + junction rows. Service exposes `recordCost(...)`, `distributeAcross(...)`, `recomputeQuantTotal(...)`.
7. **B2.** Update Goods Receipt publish to create one `inventory_item_costs` row per line item (`category='item'`) and corresponding junction row(s); set quant `totalUnitCost`.
8. **B3.** Migration backfill (one-time): for existing quants, create a synthetic `item` cost record from each GR's recorded prices so historical quants have a baseline `totalUnitCost`.

### Phase C — Freight cost linking on GR

9. **C1.** Build the freight-link endpoint and service for GRs. Form input: freight, duties, handling, other amounts + distribution method + vendor ref + notes.
10. **C2.** UI: "Link Freight Cost" action button on a published GR. Form. Validation. Distribution preview before publish.
11. **C3.** Lock the GR's freight portion after linking (immutable cost records).

### Phase D — Stock transfer cost inheritance + freight linking

12. **D1.** Update Stock Transfer publish (the step that creates destination quants) to copy junction rows from source quants and recompute destination `totalUnitCost`.
13. **D2.** Build the freight-link endpoint for transfers (reuses the same service from C1 with `sourceType='stock_transfer'`).
14. **D3.** UI: "Link Freight Cost" on a delivered transfer.

### Phase E — Picking & COGS at sale

15. **E1.** Create `InventoryPickService.pickQuants(itemId, locationId, qty)` that returns the ordered list of picks per the BU's strategy.
16. **E2.** Add `cogsAmount`, `cogsCurrency` columns to `order_items` (and optionally `order_item_picks` for multi-pick).
17. **E3.** Wire the pick service into POS order creation: pick → snapshot COGS → debit quants.

### Phase F — Reports

18. **F1.** Quant detail panel: show cost breakdown by category (one read from the junction).
19. **F2.** GR detail panel: show total freight/duties/handling and the cost composition of its quants.
20. **F3.** Order detail panel: show revenue, COGS, gross profit per line.
21. **F4.** PO detail panel: roll up gross profit for all sales of stock that originated from this PO.

### Phase G — Edge cases (deferred, build only when needed)

22. **G1.** Manual cost adjustments (`sourceType='manual_adjustment'`).
23. **G2.** Customer returns — restock with original cost from order line.
24. **G3.** Supplier returns — negative cost adjustment.
25. **G4.** Variance tracking: `unallocatedAmount` on cost records (for the "freight arrived after stock sold" case).

## 11. Conventions and Reused Patterns

- All money math uses `@vritti/api-sdk/decimal` per the codebase rule. Conversion to bigint always via `.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0)`, never `Math.round(Number(...))`.
- Decimal quantity columns use `mode: 'number'` per the recent schema refactor.
- All money amounts are bigint minor units. Currency is ISO 4217 in a 3-char varchar.
- RLS policies on new tables mirror the existing `org_isolation` / `bu_ancestor_read` / `bu_write|update|delete` pattern.
- Repositories extend `PrimaryBaseRepository`; services live in domain modules with no cross-domain imports.
- Service-level math; never SQL aggregations for cost arithmetic.

## 12. Open Questions / Future Considerations

- **Multi-currency revaluation.** When FX rates move between receipt and sale, do we revalue inventory? Not in v1.
- **Negative inventory.** What if a sale is allowed to drive a quant below zero (e.g., POS with deferred receipt)? Cost basis for the negative portion is undefined; design later.
- **Cost rollup for manufactured items.** If Vritti grows into BOM/manufacturing, output items need cost rolled up from inputs. Not in v1.
- **Period-end inventory valuation snapshots.** For tax/audit, capture `SUM(totalUnitCost × quantity)` per period and freeze. Build when first audit/tax need arises.
- **Per-item override of pick strategy.** Currently BU-level. Add `pickStrategy` override on `inventory_items` if a use case appears.
