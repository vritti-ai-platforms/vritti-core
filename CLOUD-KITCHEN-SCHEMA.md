# Cloud Kitchen — Complete Database Schema

52 tables across 10 modules to fully operate a cloud kitchen.

## Multi-tenancy & RLS Convention

Every table has `org_id` for multi-tenancy isolation. Root/aggregate tables (those with `bu_id`) also have RLS policies:
- `org_isolation` — restricts all operations to the current org
- `bu_ancestor_read` — SELECT sees own BU + ancestor BUs
- `bu_write/update/delete` — mutations scoped to current BU only

Child/junction tables inherit isolation via parent FK cascades.

Item images are handled via the `media` table (entityType + entityId pattern), not a dedicated table.

## Table of Contents

- [Settings Module (8 tables)](#settings-module)
- [Purchase Orders Module (6 tables)](#purchase-orders-module)
- [Invoice Management Module (5 tables)](#invoice-management-module)
- [Operations Module (3 tables)](#operations-module)
- [Inventory Module (6 tables)](#inventory-module)
- [Catalog Module (10 tables)](#catalog-module)
- [Order Management Module (3 tables)](#order-management-module)
- [KOT Module (2 tables)](#kot-module)
- [Delivery Module (3 tables)](#delivery-module)
- [Online Ordering Module (2 tables)](#online-ordering-module)

> POS (registers, register_sessions) and Reconciliation are future additions, not included in v1.

---

## Settings Module

### organizations

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| name | varchar(255) | NOT NULL | "Smoky Bites" |
| slug | varchar(255) | NOT NULL, UNIQUE | "smoky-bites" |
| logo_url | varchar | | |
| industry_id | uuid | FK → industries.id | Cloud Kitchen |
| plan_id | uuid | FK → plans.id | Starter |
| subscription_status | enum | NOT NULL, default 'TRIAL' | TRIAL, ACTIVE, PAST_DUE, CANCELLED |
| settings | jsonb | NOT NULL, default '{}' | Org-level config (currency, timezone, locale) |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |

### business_units

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id, CASCADE | |
| parent_id | uuid | FK → business_units.id | null = root BU |
| name | varchar(255) | NOT NULL | "Indiranagar Kitchen" |
| code | varchar(100) | NOT NULL | "indiranagar-01" |
| type | enum | NOT NULL | KITCHEN, OUTLET, WAREHOUSE, HQ |
| address | text | | |
| phone | varchar(20) | | |
| email | varchar(255) | | |
| gstin | varchar(15) | | |
| fssai | varchar(14) | | |
| operating_hours | jsonb | | `{"mon": {"open": "11:00", "close": "23:00"}, ...}` |
| settings | jsonb | NOT NULL, default '{}' | `{"service_charge_rate": 10, "service_charge_applicable": ["DINE_IN"]}` |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (org_id, code) | |

### users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| name | varchar(255) | NOT NULL | |
| email | varchar(255) | NOT NULL | |
| phone | varchar(20) | | |
| password_hash | varchar | NOT NULL | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (org_id, email) | |

### roles

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| name | varchar(255) | NOT NULL | "Kitchen Manager" |
| scope | enum | NOT NULL | GLOBAL, SUBTREE, SINGLE_BU |
| permissions | jsonb | NOT NULL, default '{}' | `{"orders": ["VIEW","CREATE"], "kot": ["VIEW","CREATE","EDIT"]}` |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (org_id, name) | |

### user_role_assignments

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| user_id | uuid | FK → users.id, CASCADE | |
| role_id | uuid | FK → roles.id, CASCADE | |
| bu_id | uuid | FK → business_units.id, CASCADE | Which BU this role applies to |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (user_id, role_id, bu_id) | |

### uom

Unit of Measure. Defined at org level with base unit conversion for auto-converting between units (e.g. PO in kg, stock in g).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | Ancestor-read RLS |
| name | varchar(50) | NOT NULL | "Gram", "Kilogram", "Millilitre" |
| symbol | varchar(10) | NOT NULL | "g", "kg", "ml", "L", "pcs" |
| base_unit_id | uuid | FK → uom.id | null = this IS the base unit |
| conversion_factor | decimal(15,6) | NOT NULL, default 1 | Multiply by this to get base unit |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (bu_id, symbol) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

**Sample data:**

| id | symbol | base_unit_id | conversion_factor | Notes |
|----|--------|-------------|-------------------|-------|
| uom-01 | g | null | 1 | Base unit for weight |
| uom-02 | kg | uom-01 | 1000 | 1 kg = 1000 g |
| uom-03 | ml | null | 1 | Base unit for volume |
| uom-04 | L | uom-03 | 1000 | 1 L = 1000 ml |
| uom-05 | pcs | null | 1 | Base unit for countable |

To convert: `value_in_base = value × conversion_factor`
- PO says 5 kg → `5 × 1000 = 5000 g` → store in inventory as 5000 g
- BOM says 300 g → already base unit → deduct 300 g

### tax_groups

Defined at a BU level. Branches see ancestor BU tax groups via `bu_ancestor_read` RLS.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | Ancestor-read RLS |
| name | varchar(100) | NOT NULL | "Food GST" |
| is_default | boolean | NOT NULL, default false | |
| is_active | boolean | NOT NULL, default true | |
| sort_order | int | NOT NULL, default 0 | |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (bu_id, name) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### tax_rates

Component rates within a tax group (e.g. CGST 2.5% + SGST 2.5% = Food GST 5%).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| tax_group_id | uuid | FK → tax_groups.id, CASCADE | |
| name | varchar(100) | NOT NULL | "CGST", "SGST" |
| rate | decimal(5,2) | NOT NULL | 2.50 |
| type | enum | NOT NULL | INCLUSIVE, EXCLUSIVE |
| sort_order | int | NOT NULL, default 0 | |

---

## Purchase Orders Module

### suppliers

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id, CASCADE | Ancestor-read RLS |
| name | varchar(255) | NOT NULL | "Metro Cash & Carry" |
| code | varchar(100) | NOT NULL | "MCC-001" |
| contact_name | varchar(255) | | |
| phone | varchar(20) | | |
| email | varchar(255) | | |
| address | text | | |
| gstin | varchar(15) | | |
| payment_terms | varchar(50) | | "COD", "Net 30", "Net 15" |
| lead_time_days | int | | |
| notes | text | | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, code) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### supplier_items

Which inventory items a supplier can provide, at what price and lead time. Used to auto-populate PO line items and compare supplier pricing.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| supplier_id | uuid | FK → suppliers.id, CASCADE | |
| inventory_item_id | uuid | FK → inventory_items.id, CASCADE | |
| supplier_code | varchar(100) | | Supplier's own SKU/code for this item |
| unit_price | decimal(12,2) | | Last known / negotiated price. Actual price on invoice |
| uom_id | uuid | FK → uom.id | Unit the supplier sells in (may differ from inventory unit) |
| min_order_quantity | decimal(12,3) | | Minimum order from this supplier |
| lead_time_days | int | | Override supplier default for this item |
| is_preferred | boolean | NOT NULL, default false | Preferred supplier for this item |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (supplier_id, inventory_item_id) | One link per supplier per item |

### purchase_orders

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id, CASCADE | |
| supplier_id | uuid | FK → suppliers.id | |
| po_number | varchar(50) | NOT NULL | "PO-2026-0001" |
| status | enum | NOT NULL, default 'DRAFT' | DRAFT, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| order_date | date | NOT NULL | |
| expected_date | date | | |
| notes | text | | |
| total_amount | decimal(12,2) | | Optional — estimated total. Actual total on invoice |
| created_by | uuid | FK → users.id | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, po_number) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

**Lifecycle:** `DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED` or `→ CANCELLED`

### purchase_order_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| purchase_order_id | uuid | FK → purchase_orders.id, CASCADE | |
| inventory_item_id | uuid | FK → inventory_items.id | |
| ordered_quantity | decimal(12,3) | NOT NULL | |
| received_quantity | decimal(12,3) | NOT NULL, default 0 | Updated on goods receipt |
| unit_price | decimal(12,2) | | Optional — expected/quoted price. Actual price on invoice |
| total_price | decimal(12,2) | | unit_price × ordered_quantity (null if no price) |
| **UNIQUE** | | (purchase_order_id, inventory_item_id) | |

### goods_receipts

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| purchase_order_id | uuid | FK → purchase_orders.id | |
| received_by | uuid | FK → users.id | |
| received_date | date | NOT NULL | |
| notes | text | | "Chicken: 0.5kg rejected" |
| created_at | timestamptz | NOT NULL, default now() | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### goods_receipt_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| goods_receipt_id | uuid | FK → goods_receipts.id, CASCADE | |
| purchase_order_item_id | uuid | FK → purchase_order_items.id | |
| accepted_quantity | decimal(12,3) | NOT NULL | |
| rejected_quantity | decimal(12,3) | NOT NULL, default 0 | |
| rejection_reason | text | | |

On save: updates `purchase_order_items.received_quantity` and `inventory_levels.stocked_quantity`.

---

## Invoice Management Module

Unified accounts payable (supplier invoices) and accounts receivable (customer invoices).

### invoices

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| type | enum | NOT NULL | PAYABLE, RECEIVABLE |
| invoice_number | varchar(50) | NOT NULL | "INV-2026-0001" |
| party_type | enum | NOT NULL | SUPPLIER, CUSTOMER, AGGREGATOR |
| party_id | uuid | | FK to suppliers.id / customers.id (polymorphic) |
| party_name | varchar(255) | NOT NULL | Denormalized for display |
| reference_type | varchar(50) | | "purchase_order", "order" |
| reference_id | uuid | | Links to PO or order |
| subtotal | decimal(12,2) | NOT NULL | |
| tax_amount | decimal(12,2) | NOT NULL, default 0 | |
| discount_amount | decimal(12,2) | NOT NULL, default 0 | |
| total_amount | decimal(12,2) | NOT NULL | |
| paid_amount | decimal(12,2) | NOT NULL, default 0 | Running total of payments |
| balance | decimal(12,2) | NOT NULL | total - paid (what's still owed) |
| status | enum | NOT NULL, default 'DRAFT' | DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, VOID |
| payment_terms | varchar(50) | | "COD", "Net 7", "Net 30" |
| issued_date | date | NOT NULL | |
| due_date | date | | |
| notes | text | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, invoice_number) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

**Lifecycle:** `DRAFT → ISSUED → PARTIALLY_PAID → PAID` or `→ OVERDUE` or `→ VOID`

### invoice_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| invoice_id | uuid | FK → invoices.id, CASCADE | |
| description | varchar(255) | NOT NULL | "Basmati Rice 5kg" or "Chicken Biryani Full x2" |
| quantity | decimal(12,3) | NOT NULL | |
| unit_price | decimal(12,2) | NOT NULL | |
| tax_amount | decimal(12,2) | NOT NULL, default 0 | |
| total | decimal(12,2) | NOT NULL | (quantity × unit_price) + tax |
| reference_item_id | uuid | | FK to inventory_items.id or catalog_items.id |

### payments

Payments against invoices — supports partial payments.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| invoice_id | uuid | FK → invoices.id, CASCADE | |
| amount | decimal(12,2) | NOT NULL | |
| method | enum | NOT NULL | CASH, CARD, UPI, BANK_TRANSFER, WALLET, ONLINE |
| reference | varchar(255) | | Transaction ID, UPI ref, cheque number |
| status | enum | NOT NULL, default 'COMPLETED' | COMPLETED, FAILED, REFUNDED |
| paid_at | timestamptz | NOT NULL, default now() | |
| notes | text | | |
| created_at | timestamptz | NOT NULL, default now() | |

On payment: `invoices.paid_amount += amount`, `invoices.balance -= amount`, update status.

### credit_notes

Adjustments — rejected goods, returns, or write-offs. Not locked to a single invoice — applied across invoices via `credit_note_applications`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| bu_id | uuid | FK → business_units.id | |
| type | enum | NOT NULL | PAYABLE, RECEIVABLE |
| party_type | enum | NOT NULL | SUPPLIER, CUSTOMER, AGGREGATOR |
| party_id | uuid | | FK to supplier/customer (polymorphic) |
| party_name | varchar(255) | NOT NULL | Denormalized |
| credit_note_number | varchar(50) | NOT NULL | "CN-2026-0001" |
| amount | decimal(12,2) | NOT NULL | Total credit amount |
| applied_amount | decimal(12,2) | NOT NULL, default 0 | How much used so far |
| remaining | decimal(12,2) | NOT NULL | amount - applied_amount |
| reason | text | NOT NULL | "Rejected 200g chicken — spoiled" |
| status | enum | NOT NULL, default 'DRAFT' | DRAFT, ISSUED, PARTIALLY_APPLIED, FULLY_APPLIED |
| issued_by | uuid | FK → users.id | |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (bu_id, credit_note_number) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### credit_note_applications

Tracks how a credit note is distributed across invoices.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| credit_note_id | uuid | FK → credit_notes.id, CASCADE | |
| invoice_id | uuid | FK → invoices.id | Which invoice this credit is applied to |
| amount | decimal(12,2) | NOT NULL | Amount applied to this invoice |
| applied_at | timestamptz | NOT NULL, default now() | |

On application:
- `credit_notes.applied_amount += amount`, `credit_notes.remaining -= amount`
- `invoices.balance -= amount`, update invoice status if fully settled
- One credit note can be split across multiple invoices until `remaining = 0`

---

## Operations Module

### conversions

Flexible production/conversion log. Operator records what went in, what came out, and what was wasted. BOM is an optional reference — not enforced.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | Where conversion happened |
| bom_id | uuid | FK → bom.id | Optional reference (null = ad-hoc) |
| status | enum | NOT NULL, default 'DRAFT' | DRAFT, IN_PROGRESS, COMPLETED, CANCELLED |
| produced_by | uuid | FK → users.id | |
| started_at | timestamptz | | |
| completed_at | timestamptz | | |
| notes | text | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

**Lifecycle:** `DRAFT → IN_PROGRESS → COMPLETED` or `→ CANCELLED`

### conversion_inputs

Materials consumed during a conversion, with explicit wastage tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| conversion_id | uuid | FK → conversions.id, CASCADE | |
| inventory_item_id | uuid | FK → inventory_items.id | Material consumed |
| quantity | decimal(12,3) | NOT NULL | Used productively |
| wastage_quantity | decimal(12,3) | NOT NULL, default 0 | Lost / spoiled / spilled |

Total deducted from stock = `quantity + wastage_quantity`

### conversion_outputs

What was produced. Supports multiple outputs (e.g. butchering: whole chicken → breast + legs + wings).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| conversion_id | uuid | FK → conversions.id, CASCADE | |
| inventory_item_id | uuid | FK → inventory_items.id | What was produced |
| quantity | decimal(12,3) | NOT NULL | Added to stock |
| wastage_quantity | decimal(12,3) | NOT NULL, default 0 | Defective / discarded (not stocked) |

Total added to stock = `quantity` (wastage is not added)

**On COMPLETED:**
1. Deduct `quantity + wastage_quantity` of each input from `inventory_levels.stocked_quantity`
2. Add `quantity` of each output to `inventory_levels.stocked_quantity`

**Wastage reporting:**
- Material waste = `sum(inputs.wastage_quantity)`
- Production waste = `sum(outputs.wastage_quantity)`
- Yield % = `sum(outputs.quantity) / sum(inputs.quantity + inputs.wastage_quantity)`

---

## Inventory Module

### inventory_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id, CASCADE | Ancestor-read RLS |
| name | varchar(255) | NOT NULL | "Basmati Rice" |
| code | varchar(100) | NOT NULL | "RAW-RICE-BAS" |
| type | enum | NOT NULL | MATERIAL, PRODUCT |
| description | text | | |
| uom_id | uuid | FK → uom.id, NOT NULL | Unit of measure (g, kg, ml, pcs) |
| requires_shipping | boolean | NOT NULL, default false | |
| metadata | jsonb | NOT NULL, default '{}' | `{"storage": "refrigerated"}` |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, code) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

`MATERIAL` = raw ingredient consumed in production (Rice, Chicken).
`PRODUCT` = finished/packaged good sold as-is (Packaged Biryani Kit).

### inventory_levels

Stock quantity per location/BU.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| inventory_item_id | uuid | FK → inventory_items.id, CASCADE | |
| bu_id | uuid | FK → business_units.id | Which location |
| stocked_quantity | decimal(12,3) | NOT NULL, default 0 | Current stock |
| reserved_quantity | decimal(12,3) | NOT NULL, default 0 | Held for pending orders |
| reorder_level | decimal(12,3) | NOT NULL, default 0 | Alert threshold |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (inventory_item_id, bu_id) | One level per item per location |

### bom

Bill of Materials — a standalone, reusable production recipe. Independent of catalog variants.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | Ancestor-read RLS |
| name | varchar(255) | NOT NULL | "Chicken Biryani Full" |
| code | varchar(100) | NOT NULL | "BOM-BIR-CHK-F" |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, code) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### bom_lines

Components of a BOM — which inventory items are consumed and in what quantity.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| bom_id | uuid | FK → bom.id, CASCADE | |
| inventory_item_id | uuid | FK → inventory_items.id | |
| required_quantity | decimal(12,3) | NOT NULL | How much consumed per unit |
| **UNIQUE** | | (bom_id, inventory_item_id) | |

**How variants link to inventory:**

| Variant type | bom_id | BOM contains | On order |
|-------------|--------|-------------|----------|
| Made-to-order (Biryani) | bom-02 | Rice 300g + Chicken 200g + Masala 15g | Deduct bom_lines |
| Stocked product (Kit) | bom-10 | 1x Packaged Kit (inv-09) | Deduct bom_lines (single item) |
| Service (Haircut) | null | — | No impact |

All deductions go through the same path: `variant.bom_id → bom_lines → inventory_levels`. No special cases.

### stock_adjustments

Manual corrections — wastage, damage, theft, expiry, physical count.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| inventory_item_id | uuid | FK → inventory_items.id | |
| type | enum | NOT NULL | WASTE, DAMAGE, THEFT, EXPIRED, CORRECTION, PRODUCTION |
| quantity | decimal(12,3) | NOT NULL | Negative = removed, positive = added |
| reason | text | | |
| adjusted_by | uuid | FK → users.id | |
| created_at | timestamptz | NOT NULL, default now() | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### stock_transfers

Move stock between BUs/locations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| inventory_item_id | uuid | FK → inventory_items.id | |
| from_bu_id | uuid | FK → business_units.id | |
| to_bu_id | uuid | FK → business_units.id | |
| quantity | decimal(12,3) | NOT NULL | |
| status | enum | NOT NULL, default 'REQUESTED' | REQUESTED, IN_TRANSIT, RECEIVED, CANCELLED |
| requested_by | uuid | FK → users.id | |
| received_by | uuid | FK → users.id | |
| notes | text | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **RLS** | | org_isolation | |

---

## Catalog Module

### categories

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id, CASCADE | Ancestor-read RLS |
| parent_id | uuid | FK → categories.id, SET NULL | null = root |
| name | varchar(255) | NOT NULL | "Biryani" |
| image | varchar(255) | | |
| sort_order | int | NOT NULL, default 0 | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, parent_id, name) | No duplicate names under same parent |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### catalog_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id, CASCADE | Ancestor-read RLS |
| category_id | uuid | FK → categories.id, SET NULL | |
| type | enum | NOT NULL | PRODUCT, SERVICE |
| code | varchar(100) | NOT NULL | "chicken-biryani" |
| name | varchar(255) | NOT NULL | "Chicken Biryani" |
| description | text | | |
| tax_group_id | uuid | FK → tax_groups.id | |
| is_available | boolean | NOT NULL, default true | |
| track_inventory | boolean | NOT NULL, default false | |
| sort_order | int | NOT NULL, default 0 | |
| attributes | jsonb | NOT NULL, default '{}' | Type-specific fields |
| metadata | jsonb | NOT NULL, default '{}' | Custom key-value |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, code) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

Images for catalog items are stored in the `media` table with `entity_type = 'catalog_item'` and `entity_id = <item_id>`.

### item_options

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| item_id | uuid | FK → catalog_items.id, CASCADE | |
| name | varchar(100) | NOT NULL | "Size" |
| sort_order | int | NOT NULL, default 0 | |
| **UNIQUE** | | (item_id, name) | |

### item_option_values

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| option_id | uuid | FK → item_options.id, CASCADE | |
| value | varchar(100) | NOT NULL | "Half", "Full" |
| sort_order | int | NOT NULL, default 0 | |
| **UNIQUE** | | (option_id, value) | |

### item_variants

Every sellable combination gets its own row. Items without options get a single default variant.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| item_id | uuid | FK → catalog_items.id, CASCADE | |
| bom_id | uuid | FK → bom.id, SET NULL | Links to BOM for inventory deduction |
| sku | varchar(100) | NOT NULL | "BIR-CHK-F" |
| name | varchar(255) | NOT NULL | "Chicken Biryani - Full" |
| price | decimal(12,2) | NOT NULL | Selling price |
| is_available | boolean | NOT NULL, default true | |
| manage_inventory | boolean | NOT NULL, default false | |
| sort_order | int | NOT NULL, default 0 | |
| attributes | jsonb | NOT NULL, default '{}' | Variant-specific overrides |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (item_id, sku) | |

**Inventory deduction logic on order:**
- `bom_id` set → deduct bom_lines from inventory
- `bom_id` null → no inventory impact (service, or track_inventory=false)

For stocked products, the BOM contains a single line referencing the finished product inventory item (e.g. 1x Packaged Kit).

### item_variant_option_values

Links a variant to the specific option values it represents.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| org_id | uuid | FK → organizations.id | |
| variant_id | uuid | FK → item_variants.id, CASCADE | |
| option_value_id | uuid | FK → item_option_values.id, CASCADE | |
| **PK** | | (variant_id, option_value_id) | |

### modifier_groups

Reusable across items. Order-time customizations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id, CASCADE | Ancestor-read RLS |
| name | varchar(255) | NOT NULL | "Spice Level" |
| selection_type | enum | NOT NULL | SINGLE, MULTI |
| min_selections | int | NOT NULL, default 0 | 0 = optional |
| max_selections | int | | null = unlimited |
| sort_order | int | NOT NULL, default 0 | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (bu_id, name) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### modifier_options

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| group_id | uuid | FK → modifier_groups.id, CASCADE | |
| name | varchar(255) | NOT NULL | "Hot", "Extra Cheese" |
| additional_price | decimal(12,2) | NOT NULL, default 0 | |
| is_default | boolean | NOT NULL, default false | Pre-selected |
| is_available | boolean | NOT NULL, default true | |
| sort_order | int | NOT NULL, default 0 | |
| attributes | jsonb | NOT NULL, default '{}' | Service add-ons: `{"duration_minutes": 15}` |
| **UNIQUE** | | (group_id, name) | |

### item_modifier_groups

Junction: which modifier groups apply to which items.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| org_id | uuid | FK → organizations.id | |
| item_id | uuid | FK → catalog_items.id, CASCADE | |
| group_id | uuid | FK → modifier_groups.id, CASCADE | |
| **PK** | | (item_id, group_id) | |

### price_overrides

Context-based pricing. Overrides variant price.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | Ancestor-read RLS |
| item_id | uuid | FK → catalog_items.id, CASCADE | null if variant-level |
| variant_id | uuid | FK → item_variants.id, CASCADE | null if item-level |
| context_type | enum | NOT NULL | CHANNEL, PLATFORM, TIME, MEMBERSHIP, LOCATION |
| context_value | varchar(100) | NOT NULL | "swiggy", "happy_hour", "gold" |
| price | decimal(12,2) | NOT NULL | |
| valid_from | timestamptz | | null = always |
| valid_to | timestamptz | | null = forever |
| created_at | timestamptz | NOT NULL, default now() | |
| **CHECK** | | item_id IS NOT NULL OR variant_id IS NOT NULL | Must reference something |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

---

## Order Management Module

### orders

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| order_number | varchar(50) | NOT NULL | "ORD-2026-0001" |
| type | enum | NOT NULL | DINE_IN, TAKEAWAY, DELIVERY |
| channel | enum | NOT NULL | PHONE, WALK_IN, WEB, SWIGGY, ZOMATO, QR |
| status | enum | NOT NULL, default 'PENDING' | PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, COMPLETED, CANCELLED |
| customer_id | uuid | FK → customers.id | null for anonymous |
| customer_name | varchar(255) | | Denormalized for quick display |
| customer_phone | varchar(20) | | |
| delivery_address | text | | |
| delivery_zone_id | uuid | FK → delivery_zones.id | |
| subtotal | decimal(12,2) | NOT NULL, default 0 | Before tax |
| tax_amount | decimal(12,2) | NOT NULL, default 0 | |
| service_charge | decimal(12,2) | NOT NULL, default 0 | From BU settings |
| delivery_charge | decimal(12,2) | NOT NULL, default 0 | |
| discount_amount | decimal(12,2) | NOT NULL, default 0 | |
| total_amount | decimal(12,2) | NOT NULL, default 0 | |
| notes | text | | |
| external_order_id | varchar(100) | | Swiggy/Zomato order ID |
| placed_at | timestamptz | NOT NULL, default now() | |
| confirmed_at | timestamptz | | |
| ready_at | timestamptz | | |
| completed_at | timestamptz | | |
| cancelled_at | timestamptz | | |
| cancellation_reason | text | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, order_number) | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

**Lifecycle:** `PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED` or `→ CANCELLED`

On order confirmed: creates a RECEIVABLE invoice in Invoice Management.

### order_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| order_id | uuid | FK → orders.id, CASCADE | |
| item_id | uuid | FK → catalog_items.id | |
| variant_id | uuid | FK → item_variants.id | |
| item_name | varchar(255) | NOT NULL | Denormalized |
| variant_name | varchar(255) | | |
| quantity | int | NOT NULL, default 1 | |
| unit_price | decimal(12,2) | NOT NULL | Price at time of order |
| tax_rate | decimal(5,2) | NOT NULL | |
| tax_amount | decimal(12,2) | NOT NULL | |
| subtotal | decimal(12,2) | NOT NULL | unit_price x quantity |
| total | decimal(12,2) | NOT NULL | subtotal + modifiers + tax |
| notes | text | | |
| kot_status | enum | NOT NULL, default 'PENDING' | PENDING, PREPARING, READY |
| kot_station | varchar(100) | | "Grill", "Fryer" |
| created_at | timestamptz | NOT NULL, default now() | |

### order_item_modifiers

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| order_item_id | uuid | FK → order_items.id, CASCADE | |
| modifier_group_id | uuid | FK → modifier_groups.id | |
| modifier_option_id | uuid | FK → modifier_options.id | |
| name | varchar(255) | NOT NULL | Denormalized — "Hot" |
| additional_price | decimal(12,2) | NOT NULL | |

---

## KOT Module

### kot_tickets

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| order_id | uuid | FK → orders.id | |
| ticket_number | varchar(50) | NOT NULL | "KOT-001" |
| station | varchar(100) | | "Biryani Station" |
| status | enum | NOT NULL, default 'PENDING' | PENDING, PREPARING, READY |
| priority | enum | NOT NULL, default 'NORMAL' | LOW, NORMAL, HIGH, RUSH |
| printed_at | timestamptz | | |
| started_at | timestamptz | | When chef taps "Preparing" |
| completed_at | timestamptz | | When chef taps "Ready" |
| created_at | timestamptz | NOT NULL, default now() | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### kot_ticket_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| kot_ticket_id | uuid | FK → kot_tickets.id, CASCADE | |
| order_item_id | uuid | FK → order_items.id | |
| item_name | varchar(255) | NOT NULL | "Chicken Biryani - Full" |
| quantity | int | NOT NULL | |
| modifiers | text | | "HOT, +Raita" (display string) |
| status | enum | NOT NULL, default 'PENDING' | PENDING, PREPARING, READY |
| notes | text | | |

---

## Delivery Module

### delivery_zones

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| name | varchar(255) | NOT NULL | "Koramangala" |
| delivery_charge | decimal(12,2) | NOT NULL, default 0 | |
| min_order_amount | decimal(12,2) | NOT NULL, default 0 | |
| estimated_time_minutes | int | | 30, 45 |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### delivery_partners

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| name | varchar(255) | NOT NULL | "Rajesh" or "Dunzo" |
| type | enum | NOT NULL | OWN, THIRD_PARTY |
| phone | varchar(20) | | |
| vehicle_number | varchar(20) | | |
| is_available | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### deliveries

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| order_id | uuid | FK → orders.id | |
| partner_id | uuid | FK → delivery_partners.id | |
| zone_id | uuid | FK → delivery_zones.id | |
| status | enum | NOT NULL, default 'ASSIGNED' | ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED |
| delivery_charge | decimal(12,2) | NOT NULL | |
| estimated_time_minutes | int | | |
| assigned_at | timestamptz | NOT NULL, default now() | |
| picked_up_at | timestamptz | | |
| delivered_at | timestamptz | | |
| notes | text | | |

---

## Online Ordering Module

### online_channels

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | Multi-tenancy |
| bu_id | uuid | FK → business_units.id | |
| type | enum | NOT NULL | WEB, SWIGGY, ZOMATO, QR |
| name | varchar(255) | NOT NULL | "Smoky Bites Web", "Swiggy" |
| config | jsonb | NOT NULL, default '{}' | API keys, restaurant IDs, webhook URLs |
| is_active | boolean | NOT NULL, default true | |
| commission_rate | decimal(5,2) | | 25.00 (Swiggy takes 25%) |
| created_at | timestamptz | NOT NULL, default now() | |
| **RLS** | | org_isolation, bu_ancestor_read, bu_write, bu_update, bu_delete | |

### online_menu_overrides

Per-channel availability and pricing overrides.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| channel_id | uuid | FK → online_channels.id, CASCADE | |
| item_id | uuid | FK → catalog_items.id | |
| variant_id | uuid | FK → item_variants.id | null = item level |
| is_available | boolean | NOT NULL, default true | Hide item on specific channel |
| override_price | decimal(12,2) | | null = use catalog price |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (channel_id, item_id, variant_id) | |

---

## Data Flow Summary

```
PROCUREMENT FLOW
Supplier ← Purchase Order ← PO Items
    → Goods Receipt → inventory_levels.stocked_quantity += accepted
    → Invoice (PAYABLE) → Payment → settled

SALES FLOW
Customer Order → variant.bom_id → bom_lines lookup
    → inventory_levels.reserved_quantity += (required_quantity × order qty)
    → on completion: stocked_quantity -= amount, reserved_quantity -= amount
    → Invoice (RECEIVABLE) → Payment → settled

OPERATIONS FLOW
Conversion → inputs (quantity + wastage) deducted from inventory_levels
           → outputs (quantity) added to inventory_levels
           → wastage tracked separately on both inputs and outputs
           → BOM is optional reference, not enforced

ADJUSTMENT FLOW
Waste / Damage / Expiry / Correction → stock_adjustments
    → inventory_levels.stocked_quantity += adjustment quantity

TRANSFER FLOW
BU A → stock_transfer → BU B
    → from BU: stocked_quantity -= qty
    → to BU: stocked_quantity += qty (on RECEIVED)

INVOICE FLOW
Payable: PO → Goods Receipt → Invoice → Payment / Credit Note
Receivable: Order → Invoice → Payment / Credit Note
```

## Table Count

| Module | Tables |
|--------|--------|
| Settings | 8 |
| Purchase Orders | 6 |
| Invoice Management | 5 |
| Operations | 3 |
| Inventory | 6 |
| Catalog | 10 |
| Order Management | 3 |
| KOT | 2 |
| Delivery | 3 |
| Online Ordering | 2 |
| **Total** | **48** |
