# Cloud Kitchen — Complete Database Schema

45 tables across 9 modules to fully operate a cloud kitchen.

## Table of Contents

- [Settings Module (6 tables)](#settings-module)
- [Catalog Module (11 tables)](#catalog-module)
- [Inventory Module (10 tables)](#inventory-module)
- [Orders Module (3 tables)](#orders-module)
- [KOT Module (2 tables)](#kot-module)
- [POS Module (5 tables)](#pos-module)
- [Delivery Module (3 tables)](#delivery-module)
- [Online Ordering Module (2 tables)](#online-ordering-module)
- [Finance Module (3 tables)](#finance-module)

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
| user_id | uuid | FK → users.id, CASCADE | |
| role_id | uuid | FK → roles.id, CASCADE | |
| bu_id | uuid | FK → business_units.id, CASCADE | Which BU this role applies to |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (user_id, role_id, bu_id) | |

### tax_groups

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| name | varchar(100) | NOT NULL | "Food GST" |
| rate | decimal(5,2) | NOT NULL | 5.00 |
| is_default | boolean | NOT NULL, default false | |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (org_id, name) | |

---

## Catalog Module

### categories

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id, CASCADE | |
| parent_id | uuid | FK → categories.id, SET NULL | null = root |
| name | varchar(255) | NOT NULL | "Biryani" |
| description | text | | |
| image_url | varchar | | |
| sort_order | int | NOT NULL, default 0 | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, parent_id, name) | No duplicate names under same parent |

### catalog_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id, CASCADE | |
| category_id | uuid | FK → categories.id, SET NULL | |
| type | enum | NOT NULL | PRODUCT, SERVICE |
| code | varchar(100) | NOT NULL | "chicken-biryani" |
| name | varchar(255) | NOT NULL | "Chicken Biryani" |
| description | text | | |
| base_price | decimal(12,2) | NOT NULL | 320.00 |
| cost_price | decimal(12,2) | | 120.00 (for margin reports) |
| tax_group_id | uuid | FK → tax_groups.id | |
| hsn_sac_code | varchar(8) | | HSN for products, SAC for services. e.g. "21069099", "99971" |
| is_available | boolean | NOT NULL, default true | |
| is_visible | boolean | NOT NULL, default true | false = internal/raw material |
| track_inventory | boolean | NOT NULL, default false | |
| sort_order | int | NOT NULL, default 0 | |
| attributes | jsonb | NOT NULL, default '{}' | Type-specific fields |
| metadata | jsonb | NOT NULL, default '{}' | Custom key-value |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, code) | |

**attributes JSONB by type:**

```json
// PRODUCT
{ "weight": 0.5, "unit": "kg", "shelf_life_days": 3 }

// SERVICE
{ "duration_minutes": 30, "buffer_minutes": 10, "capacity": 1, "required_skill": "Senior Stylist" }
```

### item_images

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| item_id | uuid | FK → catalog_items.id, CASCADE | |
| url | varchar | NOT NULL | |
| alt_text | varchar | | |
| sort_order | int | NOT NULL, default 0 | First = thumbnail |
| created_at | timestamptz | NOT NULL, default now() | |

### item_options

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| item_id | uuid | FK → catalog_items.id, CASCADE | |
| name | varchar(100) | NOT NULL | "Size" |
| sort_order | int | NOT NULL, default 0 | |
| **UNIQUE** | | (item_id, name) | |

### item_option_values

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| option_id | uuid | FK → item_options.id, CASCADE | |
| value | varchar(100) | NOT NULL | "Half", "Full" |
| sort_order | int | NOT NULL, default 0 | |
| **UNIQUE** | | (option_id, value) | |

### item_variants

Every sellable combination gets its own row. Items without options get a single default variant.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| item_id | uuid | FK → catalog_items.id, CASCADE | |
| sku | varchar(100) | NOT NULL | "BIR-CHK-F" |
| name | varchar(255) | NOT NULL | "Chicken Biryani - Full" |
| price | decimal(12,2) | | null = use item base_price |
| cost_price | decimal(12,2) | | |
| is_available | boolean | NOT NULL, default true | |
| manage_inventory | boolean | NOT NULL, default false | |
| sort_order | int | NOT NULL, default 0 | |
| attributes | jsonb | NOT NULL, default '{}' | Variant-specific overrides |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (item_id, sku) | |

### item_variant_option_values

Links a variant to the specific option values it represents.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| variant_id | uuid | FK → item_variants.id, CASCADE | |
| option_value_id | uuid | FK → item_option_values.id, CASCADE | |
| **PK** | | (variant_id, option_value_id) | |

### modifier_groups

Reusable across items. Order-time customizations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id, CASCADE | |
| name | varchar(255) | NOT NULL | "Spice Level" |
| selection_type | enum | NOT NULL | SINGLE, MULTI |
| min_selections | int | NOT NULL, default 0 | 0 = optional |
| max_selections | int | | null = unlimited |
| sort_order | int | NOT NULL, default 0 | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (bu_id, name) | |

### modifier_options

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
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
| item_id | uuid | FK → catalog_items.id, CASCADE | |
| group_id | uuid | FK → modifier_groups.id, CASCADE | |
| **PK** | | (item_id, group_id) | |

### price_overrides

Context-based pricing. Overrides base_price or variant price.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| item_id | uuid | FK → catalog_items.id, CASCADE | null if variant-level |
| variant_id | uuid | FK → item_variants.id, CASCADE | null if item-level |
| context_type | enum | NOT NULL | CHANNEL, PLATFORM, TIME, MEMBERSHIP, LOCATION |
| context_value | varchar(100) | NOT NULL | "swiggy", "happy_hour", "gold" |
| price | decimal(12,2) | NOT NULL | |
| valid_from | timestamptz | | null = always |
| valid_to | timestamptz | | null = forever |
| created_at | timestamptz | NOT NULL, default now() | |
| **CHECK** | | item_id IS NOT NULL OR variant_id IS NOT NULL | Must reference something |

---

## Inventory Module

### inventory_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id, CASCADE | |
| name | varchar(255) | NOT NULL | "Basmati Rice" |
| sku | varchar(100) | NOT NULL | "RAW-RICE-BAS" |
| description | text | | |
| unit | varchar(20) | NOT NULL | "g", "ml", "pcs", "kg", "L" |
| requires_shipping | boolean | NOT NULL, default false | |
| metadata | jsonb | NOT NULL, default '{}' | `{"storage": "refrigerated"}` |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, sku) | |

### inventory_levels

Stock quantity per location/BU.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| inventory_item_id | uuid | FK → inventory_items.id, CASCADE | |
| bu_id | uuid | FK → business_units.id | Which location |
| stocked_quantity | decimal(12,3) | NOT NULL, default 0 | Current stock |
| reserved_quantity | decimal(12,3) | NOT NULL, default 0 | Held for pending orders |
| reorder_level | decimal(12,3) | NOT NULL, default 0 | Alert threshold |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (inventory_item_id, bu_id) | One level per item per location |

### variant_inventory_items

The link between catalog and inventory. Replaces traditional recipe tables.

Selling 1 of a variant consumes `required_quantity` of each linked inventory item.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| variant_id | uuid | FK → item_variants.id, CASCADE | |
| inventory_item_id | uuid | FK → inventory_items.id, CASCADE | |
| required_quantity | decimal(12,3) | NOT NULL | How much consumed per sale |
| **UNIQUE** | | (variant_id, inventory_item_id) | |

**Examples:**

- Biryani Full → Rice 300g + Chicken 200g + Masala 15g (recipe-based, consumable)
- iPhone 16 Pro → iPhone 16 Pro, qty 1 (direct, resellable)
- Haircut → no rows (service, no inventory)

### suppliers

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id, CASCADE | |
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

### purchase_orders

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id, CASCADE | |
| supplier_id | uuid | FK → suppliers.id | |
| po_number | varchar(50) | NOT NULL | "PO-2026-0001" |
| status | enum | NOT NULL, default 'DRAFT' | DRAFT, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| order_date | date | NOT NULL | |
| expected_date | date | | |
| notes | text | | |
| total_amount | decimal(12,2) | NOT NULL, default 0 | |
| created_by | uuid | FK → users.id | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| **UNIQUE** | | (bu_id, po_number) | |

**Lifecycle:** `DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED` or `→ CANCELLED`

### purchase_order_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| purchase_order_id | uuid | FK → purchase_orders.id, CASCADE | |
| inventory_item_id | uuid | FK → inventory_items.id | |
| ordered_quantity | decimal(12,3) | NOT NULL | |
| received_quantity | decimal(12,3) | NOT NULL, default 0 | Updated on goods receipt |
| unit_price | decimal(12,2) | NOT NULL | Per unit from supplier |
| total_price | decimal(12,2) | NOT NULL | ordered_quantity x unit_price |
| **UNIQUE** | | (purchase_order_id, inventory_item_id) | |

### goods_receipts

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| purchase_order_id | uuid | FK → purchase_orders.id | |
| received_by | uuid | FK → users.id | |
| received_date | date | NOT NULL | |
| notes | text | | "Chicken: 0.5kg rejected" |
| created_at | timestamptz | NOT NULL, default now() | |

### goods_receipt_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| goods_receipt_id | uuid | FK → goods_receipts.id, CASCADE | |
| purchase_order_item_id | uuid | FK → purchase_order_items.id | |
| accepted_quantity | decimal(12,3) | NOT NULL | |
| rejected_quantity | decimal(12,3) | NOT NULL, default 0 | |
| rejection_reason | text | | |

On save: updates `purchase_order_items.received_quantity` and `inventory_levels.stocked_quantity`.

### stock_adjustments

Manual corrections — wastage, damage, theft, expiry, physical count.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| inventory_item_id | uuid | FK → inventory_items.id | |
| type | enum | NOT NULL | WASTE, DAMAGE, THEFT, EXPIRED, CORRECTION, PRODUCTION |
| quantity | decimal(12,3) | NOT NULL | Negative = removed, positive = added |
| reason | text | | |
| adjusted_by | uuid | FK → users.id | |
| created_at | timestamptz | NOT NULL, default now() | |

### stock_transfers

Move stock between BUs/locations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
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

---

## Orders Module

### orders

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
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
| delivery_charge | decimal(12,2) | NOT NULL, default 0 | |
| discount_amount | decimal(12,2) | NOT NULL, default 0 | |
| total_amount | decimal(12,2) | NOT NULL, default 0 | |
| payment_status | enum | NOT NULL, default 'UNPAID' | UNPAID, PAID, PARTIALLY_PAID, REFUNDED |
| payment_method | enum | | CASH, CARD, UPI, WALLET, ONLINE, COD |
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

**Lifecycle:** `PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED` or `→ CANCELLED`

### order_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
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

### kot_ticket_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| kot_ticket_id | uuid | FK → kot_tickets.id, CASCADE | |
| order_item_id | uuid | FK → order_items.id | |
| item_name | varchar(255) | NOT NULL | "Chicken Biryani - Full" |
| quantity | int | NOT NULL | |
| modifiers | text | | "HOT, +Raita" (display string) |
| status | enum | NOT NULL, default 'PENDING' | PENDING, PREPARING, READY |
| notes | text | | |

---

## POS Module

### registers

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| name | varchar(100) | NOT NULL | "Counter 1" |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |

### register_sessions

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| register_id | uuid | FK → registers.id | |
| opened_by | uuid | FK → users.id | |
| closed_by | uuid | FK → users.id | |
| opening_balance | decimal(12,2) | NOT NULL | Cash in drawer at start |
| closing_balance | decimal(12,2) | | Cash at end (entered by user) |
| expected_balance | decimal(12,2) | | opening + cash_in - cash_out |
| cash_in | decimal(12,2) | NOT NULL, default 0 | Total cash received |
| cash_out | decimal(12,2) | NOT NULL, default 0 | Total cash paid out |
| difference | decimal(12,2) | | closing - expected (over/short) |
| status | enum | NOT NULL, default 'OPEN' | OPEN, CLOSED |
| opened_at | timestamptz | NOT NULL, default now() | |
| closed_at | timestamptz | | |

### bills

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| order_id | uuid | FK → orders.id | |
| register_session_id | uuid | FK → register_sessions.id | |
| bill_number | varchar(50) | NOT NULL | "BILL-2026-0001" |
| subtotal | decimal(12,2) | NOT NULL | |
| tax_amount | decimal(12,2) | NOT NULL | |
| discount_amount | decimal(12,2) | NOT NULL, default 0 | |
| total_amount | decimal(12,2) | NOT NULL | |
| status | enum | NOT NULL, default 'OPEN' | OPEN, PAID, VOID, REFUNDED |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (bu_id, bill_number) | |

### payments

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bill_id | uuid | FK → bills.id, CASCADE | |
| method | enum | NOT NULL | CASH, CARD, UPI, WALLET, ONLINE |
| amount | decimal(12,2) | NOT NULL | |
| reference | varchar(255) | | Transaction ID, UPI ref |
| status | enum | NOT NULL, default 'COMPLETED' | COMPLETED, FAILED, REFUNDED |
| created_at | timestamptz | NOT NULL, default now() | |

### refunds

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bill_id | uuid | FK → bills.id | |
| payment_id | uuid | FK → payments.id | Original payment |
| amount | decimal(12,2) | NOT NULL | Full or partial |
| reason | text | NOT NULL | |
| refunded_by | uuid | FK → users.id | |
| created_at | timestamptz | NOT NULL, default now() | |

---

## Delivery Module

### delivery_zones

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| name | varchar(255) | NOT NULL | "Koramangala" |
| delivery_charge | decimal(12,2) | NOT NULL, default 0 | |
| min_order_amount | decimal(12,2) | NOT NULL, default 0 | |
| estimated_time_minutes | int | | 30, 45 |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |

### delivery_partners

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| name | varchar(255) | NOT NULL | "Rajesh" or "Dunzo" |
| type | enum | NOT NULL | OWN, THIRD_PARTY |
| phone | varchar(20) | | |
| vehicle_number | varchar(20) | | |
| is_available | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |

### deliveries

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
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
| bu_id | uuid | FK → business_units.id | |
| type | enum | NOT NULL | WEB, SWIGGY, ZOMATO, QR |
| name | varchar(255) | NOT NULL | "Smoky Bites Web", "Swiggy" |
| config | jsonb | NOT NULL, default '{}' | API keys, restaurant IDs, webhook URLs |
| is_active | boolean | NOT NULL, default true | |
| commission_rate | decimal(5,2) | | 25.00 (Swiggy takes 25%) |
| created_at | timestamptz | NOT NULL, default now() | |

### online_menu_overrides

Per-channel availability and pricing overrides.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| channel_id | uuid | FK → online_channels.id, CASCADE | |
| item_id | uuid | FK → catalog_items.id | |
| variant_id | uuid | FK → item_variants.id | null = item level |
| is_available | boolean | NOT NULL, default true | Hide item on specific channel |
| override_price | decimal(12,2) | | null = use catalog price |
| created_at | timestamptz | NOT NULL, default now() | |
| **UNIQUE** | | (channel_id, item_id, variant_id) | |

---

## Finance Module

### accounts

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations.id | |
| name | varchar(255) | NOT NULL | "Cash", "HDFC Current", "Swiggy Receivable" |
| type | enum | NOT NULL | CASH, BANK, RECEIVABLE, PAYABLE |
| balance | decimal(12,2) | NOT NULL, default 0 | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |

### transactions

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| account_id | uuid | FK → accounts.id | |
| type | enum | NOT NULL | INCOME, EXPENSE, TRANSFER |
| category | varchar(100) | NOT NULL | "Sales", "Raw Materials", "Rent", "Salary", "Commission" |
| amount | decimal(12,2) | NOT NULL | Positive = in, negative = out |
| reference_type | varchar(50) | | "bill", "purchase_order", "refund" |
| reference_id | uuid | | FK to bills.id or purchase_orders.id etc |
| description | text | | |
| transaction_date | date | NOT NULL | |
| created_at | timestamptz | NOT NULL, default now() | |

### reconciliation_entries

Track aggregator payouts against expected amounts.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| bu_id | uuid | FK → business_units.id | |
| channel_id | uuid | FK → online_channels.id | |
| period_start | date | NOT NULL | |
| period_end | date | NOT NULL | |
| expected_amount | decimal(12,2) | NOT NULL | Sum of orders - commission |
| received_amount | decimal(12,2) | | What actually came in |
| difference | decimal(12,2) | | received - expected |
| status | enum | NOT NULL, default 'PENDING' | PENDING, MATCHED, DISPUTED |
| notes | text | | |
| created_at | timestamptz | NOT NULL, default now() | |

---

## Data Flow Summary

```
PROCUREMENT FLOW
Supplier ← Purchase Order ← PO Items
    → Goods Receipt → inventory_levels.stocked_quantity += accepted

SALES FLOW
Customer Order → POS Bill → variant_inventory_items
    → inventory_levels.stocked_quantity -= required_quantity per item

ADJUSTMENT FLOW
Waste / Damage / Expiry / Correction → stock_adjustments
    → inventory_levels.stocked_quantity += adjustment quantity

TRANSFER FLOW
BU A → stock_transfer → BU B
    → from BU: stocked_quantity -= qty
    → to BU: stocked_quantity += qty (on RECEIVED)

FINANCE FLOW
Bills (income) + Purchase Orders (expense) + Adjustments
    → transactions ledger → accounts.balance
    → reconciliation_entries (match aggregator payouts)
```

## Table Count

| Module | Tables |
|--------|--------|
| Settings | 6 |
| Catalog | 11 |
| Inventory | 10 |
| Orders | 3 |
| KOT | 2 |
| POS | 5 |
| Delivery | 3 |
| Online Ordering | 2 |
| Finance | 3 |
| **Total** | **45** |

---

# UI Flow — Operating "Smoky Bites" Cloud Kitchen

Step-by-step walkthrough showing every screen, user action, and the exact database records created or modified.

---

## Step 1: Sign Up

**Screen:** `/signup`

User fills:
- Business Name: Smoky Bites
- Owner Name: Shashank
- Email: shashank@smokybites.com
- Phone: 9876543210
- Password: ********
- Industry: Cloud Kitchen
- Plan: Starter

**→ Clicks "Create Account"**

### Tables affected:

**INSERT → organizations**

| id | name | slug | industry_id | plan_id | subscription_status |
|----|------|------|------------|---------|-------------------|
| `org_001` | Smoky Bites | smoky-bites | `ind_cloud_kitchen` | `plan_starter` | TRIAL |

**INSERT → business_units**

| id | org_id | name | code | type | parent_id |
|----|--------|------|------|------|-----------|
| `bu_001` | `org_001` | Smoky Bites - Main Kitchen | main-kitchen | KITCHEN | null |

**INSERT → users**

| id | org_id | name | email | phone | is_active |
|----|--------|------|-------|-------|-----------|
| `usr_001` | `org_001` | Shashank | shashank@smokybites.com | 9876543210 | true |

**INSERT → roles** (seeded from role templates for Cloud Kitchen industry)

| id | org_id | name | scope | permissions |
|----|--------|------|-------|------------|
| `role_001` | `org_001` | Owner | GLOBAL | `{"*": ["*"]}` |
| `role_002` | `org_001` | Kitchen Manager | SINGLE_BU | `{"orders": ["VIEW","CREATE","EDIT"], "kot": ["VIEW","CREATE","EDIT"], "inventory": ["VIEW","CREATE","EDIT"], "catalog": ["VIEW"]}` |
| `role_003` | `org_001` | Kitchen Staff | SINGLE_BU | `{"kot": ["VIEW","EDIT"]}` |

**INSERT → user_role_assignments**

| id | user_id | role_id | bu_id |
|----|---------|---------|-------|
| `ura_001` | `usr_001` | `role_001` | `bu_001` |

**→ Redirects to Dashboard**

---

## Step 2: Configure Settings

### Step 2a: Business Profile

**Screen:** `/settings/business-profile`

User fills GSTIN, FSSAI, address, operating hours.

**→ Clicks "Save"**

### Tables affected:

**UPDATE → business_units** WHERE id = `bu_001`

| column | before | after |
|--------|--------|-------|
| address | null | 123, 12th Main, Indiranagar, Bangalore 560038 |
| phone | null | 9876543210 |
| gstin | null | 29ABCDE1234F1Z5 |
| fssai | null | 12345678901234 |
| operating_hours | null | `{"mon": {"open": "11:00", "close": "23:00"}, "tue": {"open": "11:00", "close": "23:00"}, ...}` |

---

### Step 2b: Add Team Members

**Screen:** `/settings/users` → Click "Add User"

**Dialog:** Add User form — Name: Raju, Email: raju@smokybites.com, Role: Kitchen Manager

**→ Clicks "Add"**

### Tables affected:

**INSERT → users**

| id | org_id | name | email | phone |
|----|--------|------|-------|-------|
| `usr_002` | `org_001` | Raju | raju@smokybites.com | 9876543211 |

**INSERT → user_role_assignments**

| id | user_id | role_id | bu_id |
|----|---------|---------|-------|
| `ura_002` | `usr_002` | `role_002` (Kitchen Manager) | `bu_001` |

Repeat for Dinesh (Kitchen Staff):

**INSERT → users**

| id | org_id | name | email |
|----|--------|------|-------|
| `usr_003` | `org_001` | Dinesh | dinesh@smokybites.com |

**INSERT → user_role_assignments**

| id | user_id | role_id | bu_id |
|----|---------|---------|-------|
| `ura_003` | `usr_003` | `role_003` (Kitchen Staff) | `bu_001` |

---

### Step 2c: Configure Tax

**Screen:** `/settings/tax` → Click "Add Tax Group"

### Tables affected:

**INSERT → tax_groups** (3 rows)

| id | org_id | name | rate | is_default |
|----|--------|------|------|-----------|
| `tax_001` | `org_001` | Food | 5.00 | true |
| `tax_002` | `org_001` | Beverages | 12.00 | false |
| `tax_003` | `org_001` | Packaging | 18.00 | false |

---

## Step 3: Build the Menu (Catalog)

### Step 3a: Create Categories

**Screen:** `/catalog/categories` → Click "Add Category" (5 times)

### Tables affected:

**INSERT → categories** (5 rows)

| id | bu_id | parent_id | name | sort_order | is_active |
|----|-------|-----------|------|------------|-----------|
| `cat_001` | `bu_001` | null | Biryani | 1 | true |
| `cat_002` | `bu_001` | null | Starters | 2 | true |
| `cat_003` | `bu_001` | null | Chinese | 3 | true |
| `cat_004` | `bu_001` | null | Beverages | 4 | true |
| `cat_005` | `bu_001` | null | Desserts | 5 | true |

---

### Step 3b: Add Products

**Screen:** `/catalog/products` → Click "Add Product"

**Form:** Name: Chicken Biryani, Code: chicken-biryani, Category: Biryani, Base Price: 320, Cost: 120, Tax Group: Food (5%), HSN Code: 21069099

**→ Clicks "Save"**

### Tables affected:

**INSERT → catalog_items**

| id | bu_id | category_id | type | code | name | base_price | cost_price | tax_group_id | hsn_sac_code | is_available | is_visible | track_inventory | attributes |
|----|-------|------------|------|------|------|-----------|-----------|-------------|-------------|-------------|-----------|----------------|------------|
| `item_001` | `bu_001` | `cat_001` | PRODUCT | chicken-biryani | Chicken Biryani | 320.00 | 120.00 | `tax_001` | 21069099 | true | true | true | `{}` |

Repeat for all menu items:

| id | code | name | base_price | category_id | hsn_sac_code |
|----|------|------|-----------|------------|-------------|
| `item_002` | mutton-biryani | Mutton Biryani | 450.00 | `cat_001` | 21069099 |
| `item_003` | paneer-tikka | Paneer Tikka | 220.00 | `cat_002` | 21069099 |
| `item_004` | chicken-65 | Chicken 65 | 240.00 | `cat_002` | 21069099 |
| `item_005` | veg-fried-rice | Veg Fried Rice | 240.00 | `cat_003` | 21069099 |
| `item_006` | mango-lassi | Mango Lassi | 80.00 | `cat_004` | 22029090 |
| `item_007` | gulab-jamun | Gulab Jamun (2pc) | 60.00 | `cat_005` | 21069099 |

---

### Step 3c: Add Variants

**Screen:** `/catalog/products/chicken-biryani` → Tab: Variants → Click "Add Option"

**Form:** Option Name: Size → Values: Half, Full

**→ Clicks "Generate Variants"**

System auto-creates option, values, and variant combinations.

### Tables affected:

**INSERT → item_options**

| id | item_id | name | sort_order |
|----|---------|------|------------|
| `opt_001` | `item_001` | Size | 1 |

**INSERT → item_option_values**

| id | option_id | value | sort_order |
|----|-----------|-------|------------|
| `ov_001` | `opt_001` | Half | 1 |
| `ov_002` | `opt_001` | Full | 2 |

**INSERT → item_variants**

| id | item_id | sku | name | price | cost_price | is_available | manage_inventory |
|----|---------|-----|------|-------|-----------|-------------|-----------------|
| `var_001` | `item_001` | BIR-CHK-H | Chicken Biryani - Half | 180.00 | 72.00 | true | true |
| `var_002` | `item_001` | BIR-CHK-F | Chicken Biryani - Full | 320.00 | 120.00 | true | true |

**INSERT → item_variant_option_values**

| variant_id | option_value_id |
|-----------|----------------|
| `var_001` | `ov_001` (Half) |
| `var_002` | `ov_002` (Full) |

Repeat for Mutton Biryani and Veg Fried Rice (same Size option):

**item_variants created:**

| id | item_id | sku | name | price |
|----|---------|-----|------|-------|
| `var_003` | `item_002` | BIR-MUT-H | Mutton Biryani - Half | 250.00 |
| `var_004` | `item_002` | BIR-MUT-F | Mutton Biryani - Full | 450.00 |
| `var_005` | `item_005` | FR-VEG-H | Veg Fried Rice - Half | 140.00 |
| `var_006` | `item_005` | FR-VEG-F | Veg Fried Rice - Full | 240.00 |

Items without variants get a **default variant** (system auto-creates):

| id | item_id | sku | name | price | manage_inventory |
|----|---------|-----|------|-------|-----------------|
| `var_007` | `item_003` | PNR-TKA | Paneer Tikka | 220.00 | true |
| `var_008` | `item_004` | CHK-65 | Chicken 65 | 240.00 | true |
| `var_009` | `item_006` | MNG-LSI | Mango Lassi | 80.00 | true |
| `var_010` | `item_007` | GLB-JMN | Gulab Jamun (2pc) | 60.00 | true |

---

### Step 3d: Add Modifiers

**Screen:** `/catalog/modifiers` → Click "Add Modifier Group"

**Form:** Name: Spice Level, Type: Single Select, Min: 1, Max: 1

### Tables affected:

**INSERT → modifier_groups**

| id | bu_id | name | selection_type | min_selections | max_selections |
|----|-------|------|---------------|---------------|---------------|
| `mg_001` | `bu_001` | Spice Level | SINGLE | 1 | 1 |
| `mg_002` | `bu_001` | Extras | MULTI | 0 | 3 |

**INSERT → modifier_options**

| id | group_id | name | additional_price | is_default |
|----|----------|------|-----------------|-----------|
| `mo_001` | `mg_001` | Mild | 0.00 | false |
| `mo_002` | `mg_001` | Medium | 0.00 | true |
| `mo_003` | `mg_001` | Hot | 0.00 | false |
| `mo_004` | `mg_002` | Extra Raita | 30.00 | false |
| `mo_005` | `mg_002` | Extra Salan | 40.00 | false |
| `mo_006` | `mg_002` | Boiled Egg | 25.00 | false |
| `mo_007` | `mg_002` | Extra Crispy | 20.00 | false |

### Step 3e: Assign Modifiers to Products

**Screen:** `/catalog/products/chicken-biryani` → Tab: Modifiers → Select "Spice Level" and "Extras"

### Tables affected:

**INSERT → item_modifier_groups**

| item_id | group_id |
|---------|----------|
| `item_001` (Chicken Biryani) | `mg_001` (Spice Level) |
| `item_001` (Chicken Biryani) | `mg_002` (Extras) |
| `item_002` (Mutton Biryani) | `mg_001` (Spice Level) |
| `item_002` (Mutton Biryani) | `mg_002` (Extras) |
| `item_004` (Chicken 65) | `mg_002` (Extras) |
| `item_005` (Veg Fried Rice) | `mg_001` (Spice Level) |

---

### Step 3f: Set Platform Pricing

**Screen:** `/catalog/products/chicken-biryani` → Tab: Pricing → Click "Add Override"

**Form:** Platform: Swiggy, Variant: Full, Price: 380

### Tables affected:

**INSERT → price_overrides**

| id | variant_id | context_type | context_value | price | valid_from | valid_to |
|----|-----------|-------------|---------------|-------|-----------|---------|
| `po_001` | `var_002` (Biryani Full) | PLATFORM | swiggy | 380.00 | null | null |
| `po_002` | `var_002` (Biryani Full) | PLATFORM | zomato | 380.00 | null | null |
| `po_003` | `var_004` (Mutton Full) | PLATFORM | swiggy | 530.00 | null | null |
| `po_004` | `var_004` (Mutton Full) | PLATFORM | zomato | 530.00 | null | null |
| `po_005` | `var_007` (Paneer Tikka) | PLATFORM | swiggy | 260.00 | null | null |
| `po_006` | `var_008` (Chicken 65) | PLATFORM | swiggy | 280.00 | null | null |

---

## Step 4: Stock Up (Inventory)

### Step 4a: Add Suppliers

**Screen:** `/inventory/suppliers` → Click "Add Supplier"

### Tables affected:

**INSERT → suppliers**

| id | bu_id | name | code | contact_name | phone | payment_terms | lead_time_days |
|----|-------|------|------|-------------|-------|--------------|---------------|
| `sup_001` | `bu_001` | Metro Cash & Carry | METRO | Suresh | 9800000001 | COD | 1 |
| `sup_002` | `bu_001` | Local Chicken Shop | LCS | Imran | 9800000002 | WEEKLY | 0 |
| `sup_003` | `bu_001` | Fresho Vegetables | FRESHO | Ramesh | 9800000003 | COD | 0 |

---

### Step 4b: Add Inventory Items (Raw Materials)

**Screen:** `/inventory/items` → Click "Add Item"

### Tables affected:

**INSERT → inventory_items**

| id | bu_id | name | sku | unit | metadata |
|----|-------|------|-----|------|----------|
| `inv_001` | `bu_001` | Basmati Rice | RAW-RICE | kg | `{}` |
| `inv_002` | `bu_001` | Chicken | RAW-CHKN | kg | `{"storage": "refrigerated"}` |
| `inv_003` | `bu_001` | Mutton | RAW-MUTN | kg | `{"storage": "refrigerated"}` |
| `inv_004` | `bu_001` | Cooking Oil | RAW-OIL | L | `{}` |
| `inv_005` | `bu_001` | Onions | RAW-ONION | kg | `{}` |
| `inv_006` | `bu_001` | Biryani Masala | RAW-BMAS | kg | `{}` |
| `inv_007` | `bu_001` | Packaging Box (Large) | PKG-LG | pcs | `{}` |
| `inv_008` | `bu_001` | Packaging Box (Small) | PKG-SM | pcs | `{}` |
| `inv_009` | `bu_001` | Paneer | RAW-PNR | kg | `{"storage": "refrigerated"}` |
| `inv_010` | `bu_001` | Mixed Vegetables | RAW-VEG | kg | `{}` |
| `inv_011` | `bu_001` | Mango Pulp | RAW-MANGO | L | `{"storage": "refrigerated"}` |
| `inv_012` | `bu_001` | Curd | RAW-CURD | kg | `{"storage": "refrigerated"}` |

**INSERT → inventory_levels** (one per item, all starting at zero)

| id | inventory_item_id | bu_id | stocked_quantity | reserved_quantity | reorder_level |
|----|------------------|-------|-----------------|------------------|--------------|
| `il_001` | `inv_001` (Rice) | `bu_001` | 0.000 | 0.000 | 5.000 |
| `il_002` | `inv_002` (Chicken) | `bu_001` | 0.000 | 0.000 | 3.000 |
| `il_003` | `inv_003` (Mutton) | `bu_001` | 0.000 | 0.000 | 2.000 |
| `il_004` | `inv_004` (Oil) | `bu_001` | 0.000 | 0.000 | 2.000 |
| `il_005` | `inv_005` (Onions) | `bu_001` | 0.000 | 0.000 | 3.000 |
| `il_006` | `inv_006` (Masala) | `bu_001` | 0.000 | 0.000 | 0.500 |
| `il_007` | `inv_007` (Box-L) | `bu_001` | 0.000 | 0.000 | 50.000 |
| `il_008` | `inv_008` (Box-S) | `bu_001` | 0.000 | 0.000 | 50.000 |
| `il_009` | `inv_009` (Paneer) | `bu_001` | 0.000 | 0.000 | 1.000 |
| `il_010` | `inv_010` (Veg) | `bu_001` | 0.000 | 0.000 | 2.000 |
| `il_011` | `inv_011` (Mango) | `bu_001` | 0.000 | 0.000 | 1.000 |
| `il_012` | `inv_012` (Curd) | `bu_001` | 0.000 | 0.000 | 1.000 |

---

### Step 4c: Link Recipes (Variant → Inventory Items)

**Screen:** `/catalog/products/chicken-biryani` → Tab: Inventory → Variant: "Full" → Click "Link Ingredient"

User adds: Rice 0.300 kg, Chicken 0.200 kg, Onions 0.100 kg, Oil 0.030 L, Masala 0.015 kg, Box (L) 1 pc

### Tables affected:

**INSERT → variant_inventory_items**

Chicken Biryani - Half:

| id | variant_id | inventory_item_id | required_quantity |
|----|-----------|------------------|-------------------|
| `vii_001` | `var_001` (Half) | `inv_001` (Rice) | 0.180 |
| `vii_002` | `var_001` (Half) | `inv_002` (Chicken) | 0.120 |
| `vii_003` | `var_001` (Half) | `inv_005` (Onions) | 0.060 |
| `vii_004` | `var_001` (Half) | `inv_004` (Oil) | 0.018 |
| `vii_005` | `var_001` (Half) | `inv_006` (Masala) | 0.009 |
| `vii_006` | `var_001` (Half) | `inv_008` (Box-S) | 1.000 |

Chicken Biryani - Full:

| id | variant_id | inventory_item_id | required_quantity |
|----|-----------|------------------|-------------------|
| `vii_007` | `var_002` (Full) | `inv_001` (Rice) | 0.300 |
| `vii_008` | `var_002` (Full) | `inv_002` (Chicken) | 0.200 |
| `vii_009` | `var_002` (Full) | `inv_005` (Onions) | 0.100 |
| `vii_010` | `var_002` (Full) | `inv_004` (Oil) | 0.030 |
| `vii_011` | `var_002` (Full) | `inv_006` (Masala) | 0.015 |
| `vii_012` | `var_002` (Full) | `inv_007` (Box-L) | 1.000 |

Paneer Tikka:

| id | variant_id | inventory_item_id | required_quantity |
|----|-----------|------------------|-------------------|
| `vii_013` | `var_007` (Paneer Tikka) | `inv_009` (Paneer) | 0.200 |
| `vii_014` | `var_007` (Paneer Tikka) | `inv_005` (Onions) | 0.050 |
| `vii_015` | `var_007` (Paneer Tikka) | `inv_004` (Oil) | 0.020 |
| `vii_016` | `var_007` (Paneer Tikka) | `inv_008` (Box-S) | 1.000 |

Mango Lassi:

| id | variant_id | inventory_item_id | required_quantity |
|----|-----------|------------------|-------------------|
| `vii_017` | `var_009` (Mango Lassi) | `inv_011` (Mango Pulp) | 0.100 |
| `vii_018` | `var_009` (Mango Lassi) | `inv_012` (Curd) | 0.100 |

---

### Step 4d: Create First Purchase Order

**Screen:** `/inventory/purchase-orders` → Click "New Purchase Order"

**Form:** Supplier: Metro Cash & Carry, Expected: Tomorrow

User adds line items:
- Basmati Rice: 25 kg @ 80/kg
- Cooking Oil: 10 L @ 150/L
- Biryani Masala: 2 kg @ 400/kg
- Onions: 10 kg @ 30/kg
- Packaging Box (L): 200 pcs @ 8/pc
- Packaging Box (S): 200 pcs @ 6/pc

**→ Clicks "Save as Draft"**

### Tables affected:

**INSERT → purchase_orders**

| id | bu_id | supplier_id | po_number | status | order_date | expected_date | total_amount | created_by |
|----|-------|-----------|-----------|--------|-----------|--------------|-------------|-----------|
| `po_001` | `bu_001` | `sup_001` | PO-2026-0001 | DRAFT | 2026-04-04 | 2026-04-05 | 7400.00 | `usr_001` |

**INSERT → purchase_order_items**

| id | purchase_order_id | inventory_item_id | ordered_quantity | received_quantity | unit_price | total_price |
|----|------------------|------------------|-----------------|------------------|-----------|------------|
| `poi_001` | `po_001` | `inv_001` (Rice) | 25.000 | 0.000 | 80.00 | 2000.00 |
| `poi_002` | `po_001` | `inv_004` (Oil) | 10.000 | 0.000 | 150.00 | 1500.00 |
| `poi_003` | `po_001` | `inv_006` (Masala) | 2.000 | 0.000 | 400.00 | 800.00 |
| `poi_004` | `po_001` | `inv_005` (Onions) | 10.000 | 0.000 | 30.00 | 300.00 |
| `poi_005` | `po_001` | `inv_007` (Box-L) | 200.000 | 0.000 | 8.00 | 1600.00 |
| `poi_006` | `po_001` | `inv_008` (Box-S) | 200.000 | 0.000 | 6.00 | 1200.00 |

---

### Step 4e: Send PO to Supplier

**Screen:** `/inventory/purchase-orders/PO-2026-0001` → Click "Send to Supplier"

### Tables affected:

**UPDATE → purchase_orders** WHERE id = `po_001`

| column | before | after |
|--------|--------|-------|
| status | DRAFT | SENT |

---

### Step 4f: Receive Goods

Next morning. Delivery arrives.

**Screen:** `/inventory/purchase-orders/PO-2026-0001` → Click "Receive Goods"

**Form:** User checks each item and enters received quantities. All match except — no exceptions this time.

**→ Clicks "Confirm Receipt"**

### Tables affected:

**INSERT → goods_receipts**

| id | bu_id | purchase_order_id | received_by | received_date | notes |
|----|-------|------------------|------------|--------------|-------|
| `gr_001` | `bu_001` | `po_001` | `usr_001` | 2026-04-05 | All items received in good condition |

**INSERT → goods_receipt_items**

| id | goods_receipt_id | purchase_order_item_id | accepted_quantity | rejected_quantity |
|----|-----------------|----------------------|-------------------|-------------------|
| `gri_001` | `gr_001` | `poi_001` (Rice) | 25.000 | 0.000 |
| `gri_002` | `gr_001` | `poi_002` (Oil) | 10.000 | 0.000 |
| `gri_003` | `gr_001` | `poi_003` (Masala) | 2.000 | 0.000 |
| `gri_004` | `gr_001` | `poi_004` (Onions) | 10.000 | 0.000 |
| `gri_005` | `gr_001` | `poi_005` (Box-L) | 200.000 | 0.000 |
| `gri_006` | `gr_001` | `poi_006` (Box-S) | 200.000 | 0.000 |

**UPDATE → purchase_order_items** (received_quantity updated for each row)

| id | received_quantity (before) | received_quantity (after) |
|----|--------------------------|-------------------------|
| `poi_001` | 0.000 | 25.000 |
| `poi_002` | 0.000 | 10.000 |
| `poi_003` | 0.000 | 2.000 |
| `poi_004` | 0.000 | 10.000 |
| `poi_005` | 0.000 | 200.000 |
| `poi_006` | 0.000 | 200.000 |

**UPDATE → purchase_orders** WHERE id = `po_001`

| column | before | after |
|--------|--------|-------|
| status | SENT | RECEIVED |

**UPDATE → inventory_levels** (stock increased)

| inventory_item_id | stocked_quantity (before) | stocked_quantity (after) |
|------------------|-------------------------|------------------------|
| `inv_001` (Rice) | 0.000 | **25.000** |
| `inv_004` (Oil) | 0.000 | **10.000** |
| `inv_006` (Masala) | 0.000 | **2.000** |
| `inv_005` (Onions) | 0.000 | **10.000** |
| `inv_007` (Box-L) | 0.000 | **200.000** |
| `inv_008` (Box-S) | 0.000 | **200.000** |

**INSERT → transactions** (finance: expense recorded)

| id | bu_id | account_id | type | category | amount | reference_type | reference_id | description | transaction_date |
|----|-------|-----------|------|----------|--------|---------------|-------------|-------------|-----------------|
| `txn_001` | `bu_001` | `acc_payable` | EXPENSE | Raw Materials | -7400.00 | purchase_order | `po_001` | PO-2026-0001 Metro Cash & Carry | 2026-04-05 |

---

## Step 5: Open for Business (POS + Orders)

### Step 5a: Open Cash Register

**Screen:** `/pos` → Click "Open Register"

**Form:** Opening Balance: 2000.00

### Tables affected:

**INSERT → registers** (first time only)

| id | bu_id | name | is_active |
|----|-------|------|-----------|
| `reg_001` | `bu_001` | Counter 1 | true |

**INSERT → register_sessions**

| id | register_id | opened_by | opening_balance | cash_in | cash_out | status | opened_at |
|----|------------|----------|----------------|---------|---------|--------|----------|
| `rs_001` | `reg_001` | `usr_001` | 2000.00 | 0.00 | 0.00 | OPEN | 2026-04-05 11:00:00 |

---

### Step 5b: First Order (Phone Call)

Customer calls: "1 Chicken Biryani Full, Hot, Extra Raita. Deliver to Koramangala."

**Screen:** `/orders` → Click "New Order"

1. User selects channel: Phone
2. Type: Delivery
3. Customer name: Arjun, Phone: 9999000001
4. Adds item: Chicken Biryani → Full → 320.00
5. Selects modifiers: Spice Level → Hot, Extras → Extra Raita (+30)
6. Delivery address: 45, 4th Block, Koramangala
7. Payment: COD

**→ Clicks "Place Order"**

### Tables affected — CASCADE of 7 inserts + 6 updates:

**INSERT → orders**

| id | bu_id | order_number | type | channel | status | customer_name | customer_phone | delivery_address | subtotal | tax_amount | delivery_charge | total_amount | payment_status | payment_method | placed_at |
|----|-------|-------------|------|---------|--------|--------------|---------------|-----------------|----------|-----------|----------------|-------------|---------------|---------------|----------|
| `ord_001` | `bu_001` | ORD-2026-0001 | DELIVERY | PHONE | CONFIRMED | Arjun | 9999000001 | 45, 4th Block, Koramangala | 350.00 | 17.50 | 40.00 | 407.50 | UNPAID | COD | 2026-04-05 17:32:00 |

**INSERT → order_items**

| id | order_id | item_id | variant_id | item_name | variant_name | quantity | unit_price | tax_rate | tax_amount | subtotal | total |
|----|----------|---------|-----------|-----------|-------------|----------|-----------|---------|-----------|----------|-------|
| `oi_001` | `ord_001` | `item_001` | `var_002` | Chicken Biryani | Full | 1 | 320.00 | 5.00 | 17.50 | 350.00 | 367.50 |

Price breakdown: 320 (variant) + 30 (modifier) = 350 subtotal, 350 × 5% = 17.50 tax, line total = 367.50

**INSERT → order_item_modifiers**

| id | order_item_id | modifier_group_id | modifier_option_id | name | additional_price |
|----|--------------|-------------------|-------------------|------|-----------------|
| `oim_001` | `oi_001` | `mg_001` | `mo_003` | Hot | 0.00 |
| `oim_002` | `oi_001` | `mg_002` | `mo_004` | Extra Raita | 30.00 |

**INSERT → kot_tickets** (auto-created from order)

| id | bu_id | order_id | ticket_number | station | status | priority | created_at |
|----|-------|---------|--------------|---------|--------|----------|-----------|
| `kot_001` | `bu_001` | `ord_001` | KOT-0001 | MAIN | PENDING | NORMAL | 2026-04-05 17:32:00 |

**INSERT → kot_ticket_items**

| id | kot_ticket_id | order_item_id | item_name | quantity | modifiers | status |
|----|--------------|--------------|-----------|----------|-----------|--------|
| `kti_001` | `kot_001` | `oi_001` | Chicken Biryani - Full | 1 | HOT, +Extra Raita | PENDING |

**INSERT → bills** (auto-created from order)

| id | bu_id | order_id | register_session_id | bill_number | subtotal | tax_amount | discount_amount | total_amount | status |
|----|-------|---------|-------------------|------------|----------|-----------|----------------|-------------|--------|
| `bill_001` | `bu_001` | `ord_001` | `rs_001` | BILL-2026-0001 | 350.00 | 17.50 | 0.00 | 407.50 | OPEN |

(407.50 = 350 subtotal + 17.50 tax + 40 delivery charge)

**UPDATE → inventory_levels** (auto-deducted based on variant_inventory_items for var_002)

| inventory_item_id | stocked_quantity (before) | deducted | stocked_quantity (after) |
|------------------|-------------------------|----------|------------------------|
| `inv_001` (Rice) | 25.000 | 0.300 | **24.700** |
| `inv_002` (Chicken) | 20.000 | 0.200 | **19.800** |
| `inv_005` (Onions) | 10.000 | 0.100 | **9.900** |
| `inv_004` (Oil) | 10.000 | 0.030 | **9.970** |
| `inv_006` (Masala) | 2.000 | 0.015 | **1.985** |
| `inv_007` (Box-L) | 200.000 | 1.000 | **199.000** |

---

### Step 5c: Chef Prepares Order

**Screen (Kitchen Display):** `/kot`

Chef sees KOT-0001 on screen. Taps **"Start Preparing"**.

### Tables affected:

**UPDATE → kot_tickets** WHERE id = `kot_001`

| column | before | after |
|--------|--------|-------|
| status | PENDING | PREPARING |
| started_at | null | 2026-04-05 17:35:00 |

**UPDATE → kot_ticket_items** WHERE id = `kti_001`

| column | before | after |
|--------|--------|-------|
| status | PENDING | PREPARING |

**UPDATE → orders** WHERE id = `ord_001`

| column | before | after |
|--------|--------|-------|
| status | CONFIRMED | PREPARING |

---

### Step 5d: Order Ready

Chef finishes. Taps **"Ready"**.

### Tables affected:

**UPDATE → kot_tickets** WHERE id = `kot_001`

| column | before | after |
|--------|--------|-------|
| status | PREPARING | READY |
| completed_at | null | 2026-04-05 17:52:00 |

**UPDATE → kot_ticket_items** WHERE id = `kti_001`

| column | before | after |
|--------|--------|-------|
| status | PREPARING | READY |

**UPDATE → orders** WHERE id = `ord_001`

| column | before | after |
|--------|--------|-------|
| status | PREPARING | READY |
| ready_at | null | 2026-04-05 17:52:00 |

---

### Step 5e: Dispatch Delivery

**Screen:** `/delivery` → Order ORD-2026-0001 shows as READY → Click "Assign Rider"

**Form:** Select rider: Rajesh

### Tables affected:

**INSERT → deliveries**

| id | order_id | partner_id | zone_id | status | delivery_charge | estimated_time_minutes | assigned_at |
|----|---------|-----------|---------|--------|----------------|----------------------|------------|
| `del_001` | `ord_001` | `rider_001` | `zone_koramangala` | ASSIGNED | 40.00 | 30 | 2026-04-05 17:55:00 |

Rider picks up food:

**UPDATE → deliveries** WHERE id = `del_001`

| column | before | after |
|--------|--------|-------|
| status | ASSIGNED | PICKED_UP |
| picked_up_at | null | 2026-04-05 17:58:00 |

**UPDATE → orders** WHERE id = `ord_001`

| column | before | after |
|--------|--------|-------|
| status | READY | OUT_FOR_DELIVERY |

---

### Step 5f: Order Delivered + Payment Collected

Rider delivers. Customer pays 407.50 cash. Rider marks **"Delivered"** in the app.

### Tables affected:

**UPDATE → deliveries** WHERE id = `del_001`

| column | before | after |
|--------|--------|-------|
| status | PICKED_UP | DELIVERED |
| delivered_at | null | 2026-04-05 18:12:00 |

**INSERT → payments**

| id | bill_id | method | amount | status | reference | created_at |
|----|---------|--------|--------|--------|-----------|------------|
| `pay_001` | `bill_001` | CASH | 407.50 | COLLECTED | COD-ORD-0001 | 2026-04-05 18:12:00 |

**UPDATE → bills** WHERE id = `bill_001`

| column | before | after |
|--------|--------|-------|
| status | OPEN | PAID |

**UPDATE → orders** WHERE id = `ord_001`

| column | before | after |
|--------|--------|-------|
| status | OUT_FOR_DELIVERY | DELIVERED |
| payment_status | UNPAID | PAID |
| completed_at | null | 2026-04-05 18:12:00 |

**UPDATE → register_sessions** WHERE id = `rs_001`

| column | before | after |
|--------|--------|-------|
| cash_in | 0.00 | 407.50 |

**INSERT → transactions** (finance: income recorded)

| id | bu_id | account_id | type | category | amount | reference_type | reference_id | description | transaction_date |
|----|-------|-----------|------|----------|--------|---------------|-------------|-------------|-----------------|
| `txn_002` | `bu_001` | `acc_cash` | INCOME | Sales | 407.50 | bill | `bill_001` | BILL-2026-0001 Cash | 2026-04-05 |

---

## Step 6: Swiggy Order Comes In

**Screen:** `/orders` — New order auto-appears (via webhook from Swiggy)

Swiggy order: 2x Mutton Biryani Full, 1x Chicken 65, 1x Mango Lassi

### Tables affected:

**INSERT → orders**

| id | bu_id | order_number | type | channel | status | customer_name | delivery_address | subtotal | tax_amount | total_amount | payment_status | external_order_id | placed_at |
|----|-------|-------------|------|---------|--------|--------------|-----------------|----------|-----------|-------------|---------------|------------------|----------|
| `ord_002` | `bu_001` | ORD-2026-0002 | DELIVERY | SWIGGY | CONFIRMED | Swiggy Customer | Via Swiggy | 1220.00 | 62.00 | 1282.00 | PAID | SWG-98765 | 2026-04-05 19:15:00 |

Note: Swiggy price used — Mutton Full = 530 (not 450), Chicken 65 = 280 (not 240). Payment already collected by Swiggy.

**INSERT → order_items**

| id | order_id | item_id | variant_id | item_name | variant_name | quantity | unit_price | tax_rate | tax_amount | subtotal | total |
|----|----------|---------|-----------|-----------|-------------|----------|-----------|---------|-----------|----------|-------|
| `oi_002` | `ord_002` | `item_002` | `var_004` | Mutton Biryani | Full | 2 | 530.00 | 5.00 | 53.00 | 1060.00 | 1113.00 |
| `oi_003` | `ord_002` | `item_004` | `var_008` | Chicken 65 | — | 1 | 280.00 | 5.00 | 14.00 | 280.00 | 294.00 |
| `oi_004` | `ord_002` | `item_006` | `var_009` | Mango Lassi | — | 1 | 95.00 | 12.00 | 11.40 | 95.00 | 106.40 |

**INSERT → kot_tickets**

| id | order_id | ticket_number | status |
|----|---------|--------------|--------|
| `kot_002` | `ord_002` | KOT-0002 | PENDING |

**INSERT → kot_ticket_items**

| id | kot_ticket_id | item_name | quantity | modifiers | status |
|----|--------------|-----------|----------|-----------|--------|
| `kti_002` | `kot_002` | Mutton Biryani - Full | 2 | | PENDING |
| `kti_003` | `kot_002` | Chicken 65 | 1 | | PENDING |
| `kti_004` | `kot_002` | Mango Lassi | 1 | | PENDING |

**UPDATE → inventory_levels** (auto-deduct for 2x Mutton Full + 1x Chicken 65 + 1x Mango Lassi)

| inventory_item_id | deducted | reason |
|------------------|----------|--------|
| `inv_001` (Rice) | 0.600 | 2x Mutton Full (0.300 each) |
| `inv_003` (Mutton) | 0.400 | 2x Mutton Full (0.200 each) |
| `inv_005` (Onions) | 0.200 | 2x Mutton Full (0.100 each) |
| `inv_004` (Oil) | 0.060 | 2x Mutton Full (0.030 each) |
| `inv_006` (Masala) | 0.030 | 2x Mutton Full (0.015 each) |
| `inv_007` (Box-L) | 2.000 | 2x Large boxes |
| `inv_011` (Mango Pulp) | 0.100 | 1x Mango Lassi |
| `inv_012` (Curd) | 0.100 | 1x Mango Lassi |

No delivery row needed — Swiggy handles delivery. Chef prepares, marks ready, Swiggy rider picks up.

**INSERT → bills** (auto-created, already PAID since Swiggy collects)

| id | order_id | bill_number | total_amount | status |
|----|---------|------------|-------------|--------|
| `bill_002` | `ord_002` | BILL-2026-0002 | 1282.00 | PAID |

**INSERT → payments**

| id | bill_id | method | amount | status | reference |
|----|---------|--------|--------|--------|-----------|
| `pay_002` | `bill_002` | ONLINE | 1282.00 | COMPLETED | SWG-98765 |

---

## Step 7: End of Day

### Step 7a: Log Wastage

**Screen:** `/inventory/adjustments` → Click "New Adjustment"

**Form:** Item: Chicken, Type: EXPIRED, Quantity: -0.500, Reason: Left out, went bad

### Tables affected:

**INSERT → stock_adjustments**

| id | bu_id | inventory_item_id | type | quantity | reason | adjusted_by | created_at |
|----|-------|------------------|------|----------|--------|------------|------------|
| `sa_001` | `bu_001` | `inv_002` (Chicken) | EXPIRED | -0.500 | Left out too long, went bad | `usr_002` | 2026-04-05 23:00:00 |

**UPDATE → inventory_levels** WHERE inventory_item_id = `inv_002`

| column | before | after |
|--------|--------|-------|
| stocked_quantity | 17.080 | **16.580** |

---

### Step 7b: Close Cash Register

**Screen:** `/pos` → Click "Close Register"

**Form:** Actual closing balance: 2407.50

System calculates: opening (2000) + cash_in (407.50) - cash_out (0) = expected 2407.50

### Tables affected:

**UPDATE → register_sessions** WHERE id = `rs_001`

| column | before | after |
|--------|--------|-------|
| closing_balance | null | 2407.50 |
| expected_balance | null | 2407.50 |
| difference | null | 0.00 |
| status | OPEN | CLOSED |
| closed_by | null | `usr_001` |
| closed_at | null | 2026-04-05 23:15:00 |

---

## Step 8: End of Week — Aggregator Reconciliation

Swiggy payout arrives for the week. You had 68 Swiggy orders totalling 22,100 in revenue. Swiggy takes 25% = 5,525 commission. Expected payout: 16,575.

**Screen:** `/finance/reconciliation` → Click "New Entry"

### Tables affected:

**INSERT → reconciliation_entries**

| id | bu_id | channel_id | period_start | period_end | expected_amount | received_amount | difference | status | notes |
|----|-------|-----------|-------------|-----------|----------------|----------------|-----------|--------|-------|
| `rec_001` | `bu_001` | `ch_swiggy` | 2026-04-05 | 2026-04-11 | 16575.00 | 16575.00 | 0.00 | MATCHED | Payout matches |

If there's a mismatch:

| expected_amount | received_amount | difference | status | notes |
|----------------|----------------|-----------|--------|-------|
| 16575.00 | 16200.00 | -375.00 | DISPUTED | Missing 375, raised ticket with Swiggy |

---

## Database State After Day 1 (15 orders)

### Row counts:

| Table | Rows |
|-------|------|
| organizations | 1 |
| business_units | 1 |
| users | 3 |
| roles | 3 |
| user_role_assignments | 3 |
| tax_groups | 3 |
| categories | 5 |
| catalog_items | 7 |
| item_images | 0 (added later) |
| item_options | 3 |
| item_option_values | 6 |
| item_variants | 10 |
| item_variant_option_values | 6 |
| modifier_groups | 2 |
| modifier_options | 7 |
| item_modifier_groups | 6 |
| price_overrides | 6 |
| inventory_items | 12 |
| inventory_levels | 12 |
| variant_inventory_items | 18 |
| suppliers | 3 |
| purchase_orders | 1 |
| purchase_order_items | 6 |
| goods_receipts | 1 |
| goods_receipt_items | 6 |
| stock_adjustments | 1 |
| stock_transfers | 0 |
| **orders** | **15** |
| **order_items** | **22** |
| **order_item_modifiers** | **28** |
| **kot_tickets** | **15** |
| **kot_ticket_items** | **22** |
| registers | 1 |
| register_sessions | 1 |
| **bills** | **15** |
| **payments** | **15** |
| refunds | 0 |
| delivery_zones | 3 |
| delivery_partners | 2 |
| **deliveries** | **12** (3 were takeaway, no delivery) |
| online_channels | 3 (Web, Swiggy, Zomato) |
| online_menu_overrides | 0 |
| accounts | 3 (Cash, Bank, Swiggy Receivable) |
| **transactions** | **16** (15 sales + 1 PO expense) |
| reconciliation_entries | 0 (end of week) |

### Inventory levels at end of day 1:

| Item | Morning Stock | Consumed (15 orders) | Wasted | End of Day |
|------|-------------|---------------------|--------|-----------|
| Rice | 25.000 kg | 4.200 | 0.000 | **20.800** |
| Chicken | 20.000 kg | 2.800 | 0.500 | **16.700** |
| Mutton | 10.000 kg | 2.400 | 0.000 | **7.600** |
| Oil | 10.000 L | 0.420 | 0.000 | **9.580** |
| Onions | 10.000 kg | 1.400 | 0.000 | **8.600** |
| Masala | 2.000 kg | 0.210 | 0.000 | **1.790** |
| Box (L) | 200 pcs | 10 | 0 | **190** |
| Box (S) | 200 pcs | 5 | 0 | **195** |
| Paneer | 5.000 kg | 0.600 | 0.000 | **4.400** |
| Mango Pulp | 3.000 L | 0.300 | 0.000 | **2.700** |
| Curd | 3.000 kg | 0.300 | 0.000 | **2.700** |

### Revenue breakdown:

| Channel | Orders | Revenue | Commission | Net |
|---------|--------|---------|-----------|-----|
| Phone/Direct | 4 | 1,630 | 0 | 1,630 |
| Swiggy | 7 | 22,100 | 5,525 (25%) | 16,575 |
| Zomato | 3 | 10,200 | 2,550 (25%) | 7,650 |
| Web (direct) | 1 | 520 | 0 | 520 |
| **Total** | **15** | **34,450** | **8,075** | **26,375** |

### Cash register:

| | Amount |
|---|--------|
| Opening balance | 2,000.00 |
| Cash collected (4 COD orders) | 1,630.00 |
| Cash paid out | 0.00 |
| **Closing balance** | **3,630.00** |
| KOT | 2 |
| POS | 5 |
| Delivery | 3 |
| Online Ordering | 2 |
| Finance | 3 |
| **Total** | **45** |
