# Cloud Kitchen Setup Guide
## "Smoky Bites" — Step-by-step setup with exact table data

Every table has `org_id` for multi-tenancy. Root/aggregate tables also have `bu_id` with ancestor_read RLS.

All quantities in this guide are raw numbers. The unit is always derived from `inventory_items.uom_id` — e.g. `required_quantity: 300` for inv-01 (Rice, uom=g) means 300g.

Flow: **Purchase Orders → Invoice Management → Operations → Inventory → Catalog → Order Management**

---

## Part 1: Settings (Prerequisites)

---

### Step 1 — Create Tax Groups + Tax Rates

Tax groups define GST rate structures. Defined at a BU level — branches inherit from ancestor BUs via `bu_ancestor_read` RLS.

**Table: `tax_groups`**

| id | org_id | bu_id | name | is_default | is_active | sort_order |
|----|--------|-------|------|------------|-----------|------------|
| tg-01 | org-01 | bu-01 | Food GST | true | true | 0 |
| tg-02 | org-01 | bu-01 | Beverage GST | false | true | 1 |
| tg-03 | org-01 | bu-01 | Packaged GST | false | true | 2 |

**Table: `tax_rates`**

| id | org_id | tax_group_id | name | rate | type | sort_order |
|----|--------|--------------|------|------|------|------------|
| tr-01 | org-01 | tg-01 | CGST | 2.50 | EXCLUSIVE | 0 |
| tr-02 | org-01 | tg-01 | SGST | 2.50 | EXCLUSIVE | 1 |
| tr-03 | org-01 | tg-02 | CGST | 6.00 | EXCLUSIVE | 0 |
| tr-04 | org-01 | tg-02 | SGST | 6.00 | EXCLUSIVE | 1 |
| tr-05 | org-01 | tg-03 | CGST | 9.00 | EXCLUSIVE | 0 |
| tr-06 | org-01 | tg-03 | SGST | 9.00 | EXCLUSIVE | 1 |

Tax group "Food GST" = CGST 2.5% + SGST 2.5% = **5% total**.

---

### Step 2 — Create Units of Measure

**Table: `uom`**

| id | org_id | name | symbol | base_unit_id | conversion_factor |
|----|--------|------|--------|-------------|-------------------|
| uom-01 | org-01 | Gram | g | null | 1 |
| uom-02 | org-01 | Kilogram | kg | uom-01 | 1000 |
| uom-03 | org-01 | Millilitre | ml | null | 1 |
| uom-04 | org-01 | Litre | L | uom-03 | 1000 |
| uom-05 | org-01 | Piece | pcs | null | 1 |

`base_unit_id = null` means this IS the base unit. To convert: `value × conversion_factor = base value`.
PO in 5 kg → `5 × 1000 = 5000 g` → stored in inventory as 5000 g.

---

### Step 3 — Create Inventory Items

The **master list** of everything you physically stock — both raw materials and finished products. This must exist before you can create POs or BOMs.

**Table: `inventory_items`**

| id | org_id | bu_id | name | code | type | uom_id | requires_shipping |
|----|--------|-------|------|------|------|--------|-------------------|
| inv-01 | org-01 | bu-01 | Basmati Rice | RAW-RICE-BAS | MATERIAL | uom-01 (g) | false |
| inv-02 | org-01 | bu-01 | Chicken Breast | RAW-CHK-BRS | MATERIAL | uom-01 (g) | false |
| inv-03 | org-01 | bu-01 | Prawns | RAW-PRW | MATERIAL | uom-01 (g) | false |
| inv-04 | org-01 | bu-01 | Biryani Masala | RAW-MSL-BIR | MATERIAL | uom-01 (g) | false |
| inv-05 | org-01 | bu-01 | Cooking Oil | RAW-OIL-CKG | MATERIAL | uom-03 (ml) | false |
| inv-06 | org-01 | bu-01 | Paneer | RAW-PNR | MATERIAL | uom-01 (g) | false |
| inv-07 | org-01 | bu-01 | Mixed Vegetables | RAW-VEG-MIX | MATERIAL | uom-01 (g) | false |
| inv-08 | org-01 | bu-01 | Chicken Tikka Marinade | RAW-MAR-TKK | MATERIAL | uom-01 (g) | false |
| inv-09 | org-01 | bu-01 | Packaged Biryani Kit | PKG-BIR-KIT | PRODUCT | uom-05 (pcs) | true |

`MATERIAL` = consumed in production (ingredients).
`PRODUCT` = finished/packaged good, sold as-is (1:1 with variant).

---

### Step 4 — Create Suppliers

**Table: `suppliers`**

| id | org_id | bu_id | name | code | contact_name | phone | payment_terms | lead_time_days |
|----|--------|-------|------|------|--------------|-------|---------------|----------------|
| sup-01 | org-01 | bu-01 | Metro Cash & Carry | MCC-001 | Suresh | 9876543210 | Net 7 | 1 |
| sup-02 | org-01 | bu-01 | Local Chicken Farm | LCF-001 | Ramesh | 9123456780 | COD | 0 |
| sup-03 | org-01 | bu-01 | Spice Wholesaler | SPW-001 | Ajay | 9988776655 | Net 15 | 2 |
| sup-04 | org-01 | bu-01 | FreshKart | FKT-001 | Priya | 9000011111 | COD | 1 |

---

## Part 2: Purchase Orders — Buy Raw Materials

---

### Step 5 — Link Suppliers to Inventory Items

Define which suppliers provide which items, at what price and in what unit.

**Table: `supplier_items`**

| id | org_id | supplier_id | inventory_item_id | supplier_code | unit_price | uom_id | min_order_quantity | is_preferred |
|----|--------|-------------|-------------------|---------------|------------|--------|-------------------|--------------|
| si-01 | org-01 | sup-01 (Metro) | inv-01 (Rice) | MCC-RICE-BAS | 80.00 | uom-02 (kg) | 5 | true |
| si-02 | org-01 | sup-01 (Metro) | inv-04 (Masala) | MCC-MSL-BIR | null | uom-02 (kg) | 1 | true |
| si-03 | org-01 | sup-02 (Chicken Farm) | inv-02 (Chicken) | LCF-CHK-BRS | 350.00 | uom-02 (kg) | 2 | true |
| si-04 | org-01 | sup-02 (Chicken Farm) | inv-03 (Prawns) | LCF-PRW | null | uom-02 (kg) | 1 | true |
| si-05 | org-01 | sup-04 (FreshKart) | inv-06 (Paneer) | FKT-PNR | null | uom-02 (kg) | 1 | true |
| si-06 | org-01 | sup-04 (FreshKart) | inv-07 (Vegetables) | FKT-VEG-MIX | 60.00 | uom-02 (kg) | 2 | true |
| si-07 | org-01 | sup-01 (Metro) | inv-05 (Oil) | MCC-OIL-CKG | null | uom-04 (L) | 5 | true |

Notes:
- `unit_price` is optional — last known / negotiated price. Actual price comes on the supplier invoice
- Supplier sells in kg, inventory stores in g — UOM conversion handles it
- `is_preferred = true` → default supplier when raising POs for this item
- When creating a PO, line items auto-populate from this table

---

### Step 6 — Raise a Purchase Order

**Table: `purchase_orders`**

| id | org_id | bu_id | supplier_id | po_number | status | order_date | total_amount |
|----|--------|-------|-------------|-----------|--------|------------|--------------|
| po-01 | org-01 | bu-01 | sup-01 | PO-2026-0001 | DRAFT | 2026-04-10 | 5600.00 |

**Table: `purchase_order_items`**

| id | org_id | purchase_order_id | inventory_item_id | ordered_qty | received_qty | unit_price | total_price |
|----|--------|-------------------|-------------------|-------------|--------------|------------|-------------|
| poi-01 | org-01 | po-01 | inv-01 (Rice) | 5000 | 0 | null | null |
| poi-02 | org-01 | po-01 | inv-02 (Chicken) | 3000 | 0 | null | null |

`unit_price` and `total_price` are optional on the PO — just quantities. Actual price comes on the supplier invoice.

PO status transitions: `DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED`

---

### Step 7 — Receive Goods

**Table: `goods_receipts`**

| id | org_id | bu_id | purchase_order_id | received_by | received_date |
|----|--------|-------|-------------------|-------------|---------------|
| gr-01 | org-01 | bu-01 | po-01 | user-rajesh | 2026-04-11 |

**Table: `goods_receipt_items`**

| id | org_id | goods_receipt_id | purchase_order_item_id | accepted_qty | rejected_qty | rejection_reason |
|----|--------|------------------|------------------------|--------------|--------------|------------------|
| gri-01 | org-01 | gr-01 | poi-01 | 5000 | 0 | null |
| gri-02 | org-01 | gr-01 | poi-02 | 2800 | 200 | Chicken smelled off |

**On save, two things happen:**
1. `purchase_order_items.received_qty += accepted_qty`
2. `inventory_levels.stocked_qty += accepted_qty`

**`inventory_levels` after goods receipt:**

| inventory_item_id | stocked_qty |
|-------------------|-------------|
| inv-01 (Rice) | 5000 |
| inv-02 (Chicken) | 2800 |

---

### Step 8 — Upload Supplier Invoice into PO View

Operator uploads the supplier's invoice (PDF/image) from the PO view. This single action does three things:

**1. Updates PO items with prices from the invoice:**

| id | inventory_item_id | ordered_qty | received_qty | unit_price | total_price |
|----|-------------------|-------------|--------------|------------|-------------|
| poi-01 | inv-01 (Rice) | 5000 | 5000 | 0.08 | 400.00 |
| poi-02 | inv-02 (Chicken) | 3000 | 2800 | 1.73 | 4844.00 |

`purchase_orders.total_amount = 5244.00`

**2. Auto-creates a PAYABLE invoice:**

**Table: `invoices`**

| id | org_id | bu_id | type | invoice_number | party_type | party_id | party_name | reference_type | reference_id | subtotal | tax_amount | total_amount | paid_amount | balance | status | payment_terms | issued_date | due_date |
|----|--------|-------|------|----------------|------------|----------|------------|----------------|--------------|----------|------------|--------------|-------------|---------|--------|---------------|-------------|----------|
| inv-p01 | org-01 | bu-01 | PAYABLE | INV-P-2026-0001 | SUPPLIER | sup-01 | Metro Cash & Carry | purchase_order | po-01 | 5244.00 | 0.00 | 5244.00 | 0.00 | 5244.00 | ISSUED | Net 7 | 2026-04-11 | 2026-04-18 |

**Table: `invoice_items`** (auto-populated from PO items with prices)

| id | org_id | invoice_id | description | quantity | unit_price | tax_amount | total |
|----|--------|------------|-------------|----------|------------|------------|-------|
| ii-01 | org-01 | inv-p01 | Basmati Rice 5000g | 5000 | 0.08 | 0 | 400.00 |
| ii-02 | org-01 | inv-p01 | Chicken Breast 2800g (accepted) | 2800 | 1.73 | 0 | 4844.00 |

**3. Stores the uploaded file in `media`:**

`entity_type = 'invoice'`, `entity_id = inv-p01`

---

## Part 3: Invoice Management — Track Payables & Receivables

The supplier invoice was already created in Step 8 (auto-created from PO view). Now manage payments and credit notes.

---

### Step 9 — Pay the Invoice

**Table: `payments`**

| id | org_id | invoice_id | amount | method | reference | status | paid_at |
|----|--------|------------|--------|--------|-----------|--------|---------|
| pay-01 | org-01 | inv-p01 | 5244.00 | BANK_TRANSFER | NEFT-REF-001 | COMPLETED | 2026-04-18 |

After payment: `invoices.paid_amount = 5244.00`, `invoices.balance = 0`, `invoices.status = PAID`

---

### Step 10 — Credit Note for Rejected Goods

The 200g rejected chicken (₹346) needs a credit note against the supplier.

**Table: `credit_notes`**

| id | org_id | bu_id | type | party_type | party_id | party_name | credit_note_number | amount | applied_amount | remaining | reason | status |
|----|--------|-------|------|------------|----------|------------|--------------------|--------|----------------|-----------|--------|--------|
| cn-01 | org-01 | bu-01 | PAYABLE | SUPPLIER | sup-01 | Metro Cash & Carry | CN-2026-0001 | 346.00 | 0.00 | 346.00 | Rejected 200g chicken — spoiled | ISSUED |

The credit is not locked to one invoice — apply it to any invoice from this supplier:

**Table: `credit_note_applications`**

| id | org_id | credit_note_id | invoice_id | amount | applied_at |
|----|--------|----------------|------------|--------|------------|
| cna-01 | org-01 | cn-01 | inv-p01 | 346.00 | 2026-04-12 |

After application:
- `credit_notes`: `applied_amount = 346`, `remaining = 0`, `status = FULLY_APPLIED`
- `invoices (inv-p01)`: `balance -= 346` → `5244 - 346 = 4898`

If the credit was ₹500 but the invoice only had ₹300 balance, you'd apply ₹300 here and the remaining ₹200 carries forward to the next invoice.

---

## Part 4: Operations — Convert Raw Materials

---

### Step 11 — Produce Packaged Biryani Kits

First, create the BOM that defines the conversion template (optional — conversions can also be ad-hoc).

**Table: `bom`**

| id | org_id | bu_id | name | code | is_active |
|----|--------|-------|------|------|-----------|
| bom-10 | org-01 | bu-01 | Packaged Kit Assembly | BOM-PKG-KIT | true |

**Table: `bom_lines`**

| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-10 | inv-01 (Rice) | 300 |
| org-01 | bom-10 | inv-02 (Chicken) | 200 |
| org-01 | bom-10 | inv-04 (Masala) | 15 |

Units are derived from `inventory_items.uom_id` — inv-01 is in g, so `required_quantity: 300` means 300g.

Operator produces 10 kits. They log what was actually used and what came out:

**Table: `conversions`**

| id | org_id | bu_id | bom_id | status | produced_by |
|----|--------|-------|--------|--------|-------------|
| conv-01 | org-01 | bu-01 | bom-10 | COMPLETED | user-chef |

**Table: `conversion_inputs`** (what was consumed)

| id | org_id | conversion_id | inventory_item_id | quantity | wastage_quantity |
|----|--------|---------------|-------------------|----------|------------------|
| ci-01 | org-01 | conv-01 | inv-01 (Rice) | 3000 | 100 |
| ci-02 | org-01 | conv-01 | inv-02 (Chicken) | 1950 | 50 |
| ci-03 | org-01 | conv-01 | inv-04 (Masala) | 150 | 0 |

- Rice: 3000 used productively + 100 spilled = 3100 deducted from stock
- Chicken: 1950 used + 50 trimmings wasted = 2000 deducted
- Masala: 150 used, no waste

**Table: `conversion_outputs`** (what was produced)

| id | org_id | conversion_id | inventory_item_id | quantity | wastage_quantity |
|----|--------|---------------|-------------------|----------|------------------|
| co-01 | org-01 | conv-01 | inv-09 (Kit) | 10 | 1 |

10 good kits added to stock. 1 defective kit discarded (not stocked).

**Inventory updates on COMPLETED:**

| inventory_item_id | stocked_qty (before) | change | stocked_qty (after) |
|-------------------|---------------------|--------|---------------------|
| inv-01 (Rice) | 5000 | -(3000+100) = -3100 | 1900 |
| inv-02 (Chicken) | 2800 | -(1950+50) = -2000 | 800 |
| inv-04 (Masala) | 1000 | -(150+0) = -150 | 850 |
| inv-09 (Kit) | 0 | +10 | 10 |

**Wastage summary:**
- Material waste: 100 (rice) + 50 (chicken) = 150 total
- Production waste: 1 defective kit
- Yield: 10 / (10+1) = 91%

---

## Part 5: Inventory — Set Remaining Opening Stock

---

### Step 12 — Set Opening Stock Levels

For items that weren't stocked via PO or conversion, set opening balances directly.

**Table: `inventory_levels`**

| id | org_id | inventory_item_id | bu_id | stocked_qty | reserved_qty | reorder_level |
|----|--------|-------------------|-------|-------------|--------------|---------------|
| lvl-01 | org-01 | inv-01 | bu-01 | 1900 | 0 | 2000 |
| lvl-02 | org-01 | inv-02 | bu-01 | 850 | 0 | 1000 |
| lvl-03 | org-01 | inv-03 | bu-01 | 2000 | 0 | 500 |
| lvl-04 | org-01 | inv-04 | bu-01 | 850 | 0 | 200 |
| lvl-05 | org-01 | inv-05 | bu-01 | 5000 | 0 | 500 |
| lvl-06 | org-01 | inv-06 | bu-01 | 3000 | 0 | 500 |
| lvl-07 | org-01 | inv-07 | bu-01 | 4000 | 0 | 500 |
| lvl-08 | org-01 | inv-08 | bu-01 | 800 | 0 | 200 |
| lvl-09 | org-01 | inv-09 | bu-01 | 10 | 0 | 5 |

Note: inv-01, inv-02, inv-04, inv-09 were already set by PO receipt and conversion. Others set manually as opening stock.

---

## Part 6: Catalog — Build Your Menu

---

### Step 13 — Create Categories

**Table: `categories`**

| id | org_id | bu_id | parent_id | name | sort_order | is_active |
|----|--------|-------|-----------|------|------------|-----------|
| cat-01 | org-01 | bu-01 | null | Food | 0 | true |
| cat-02 | org-01 | bu-01 | null | Beverages | 1 | true |
| cat-03 | org-01 | bu-01 | cat-01 | Biryani | 0 | true |
| cat-04 | org-01 | bu-01 | cat-01 | Starters | 1 | true |
| cat-05 | org-01 | bu-01 | cat-02 | Cold Drinks | 0 | true |
| cat-06 | org-01 | bu-01 | cat-02 | Hot Drinks | 1 | true |

```
Food
├── Biryani
└── Starters
Beverages
├── Cold Drinks
└── Hot Drinks
```

---

### Step 14 — Create Catalog Items

**Table: `catalog_items`**

| id | org_id | bu_id | category_id | type | code | name | tax_group_id | is_available | track_inventory | sort_order |
|----|--------|-------|-------------|------|------|------|--------------|--------------|-----------------|------------|
| itm-01 | org-01 | bu-01 | cat-03 | PRODUCT | chicken-biryani | Chicken Biryani | tg-01 | true | true | 0 |
| itm-02 | org-01 | bu-01 | cat-03 | PRODUCT | veg-biryani | Veg Biryani | tg-01 | true | true | 1 |
| itm-03 | org-01 | bu-01 | cat-04 | PRODUCT | chicken-tikka | Chicken Tikka | tg-01 | true | true | 0 |
| itm-04 | org-01 | bu-01 | cat-05 | PRODUCT | cold-coffee | Cold Coffee | tg-02 | true | false | 0 |
| itm-05 | org-01 | bu-01 | cat-03 | PRODUCT | biryani-kit | Packaged Biryani Kit | tg-03 | true | true | 2 |

- Price is always on the variant, not the item
- Images stored in `media` table with `entity_type = 'catalog_item'`

---

### Step 15 — Create Item Options + Option Values

**Table: `item_options`**

| id | org_id | item_id | name | sort_order |
|----|--------|---------|------|------------|
| opt-01 | org-01 | itm-01 | Size | 0 |
| opt-02 | org-01 | itm-01 | Protein | 1 |
| opt-03 | org-01 | itm-02 | Size | 0 |
| opt-04 | org-01 | itm-03 | Pieces | 0 |

**Table: `item_option_values`**

| id | org_id | option_id | value | sort_order |
|----|--------|-----------|-------|------------|
| ov-01 | org-01 | opt-01 | Half | 0 |
| ov-02 | org-01 | opt-01 | Full | 1 |
| ov-03 | org-01 | opt-02 | Chicken | 0 |
| ov-04 | org-01 | opt-02 | Egg | 1 |
| ov-05 | org-01 | opt-02 | Prawns | 2 |
| ov-06 | org-01 | opt-03 | Half | 0 |
| ov-07 | org-01 | opt-03 | Full | 1 |
| ov-08 | org-01 | opt-04 | 4 Pieces | 0 |
| ov-09 | org-01 | opt-04 | 8 Pieces | 1 |

---

### Step 16 — Create BOMs for Made-to-Order Items

These BOMs are for order-time deduction — not for production (that was Step 9).

**Table: `bom`**

| id | org_id | bu_id | name | code | is_active |
|----|--------|-------|------|------|-----------|
| bom-01 | org-01 | bu-01 | Chicken Biryani Half | BOM-BIR-CHK-H | true |
| bom-02 | org-01 | bu-01 | Chicken Biryani Full | BOM-BIR-CHK-F | true |
| bom-03 | org-01 | bu-01 | Egg Biryani Half | BOM-BIR-EGG-H | true |
| bom-04 | org-01 | bu-01 | Egg Biryani Full | BOM-BIR-EGG-F | true |
| bom-05 | org-01 | bu-01 | Prawn Biryani Full | BOM-BIR-PRW-F | true |
| bom-06 | org-01 | bu-01 | Veg Biryani Half | BOM-VEG-BIR-H | true |
| bom-07 | org-01 | bu-01 | Veg Biryani Full | BOM-VEG-BIR-F | true |
| bom-08 | org-01 | bu-01 | Chicken Tikka 4pc | BOM-TKK-4PC | true |
| bom-09 | org-01 | bu-01 | Chicken Tikka 8pc | BOM-TKK-8PC | true |
| bom-11 | org-01 | bu-01 | Packaged Kit (sell) | BOM-PKG-KIT-SELL | true |

**Table: `bom_lines`**

#### bom-02: Chicken Biryani Full
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-02 | inv-01 (Rice) | 300 |
| org-01 | bom-02 | inv-02 (Chicken) | 200 |
| org-01 | bom-02 | inv-04 (Masala) | 15 |
| org-01 | bom-02 | inv-05 (Oil) | 40 |

#### bom-01: Chicken Biryani Half
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-01 | inv-01 | 150 |
| org-01 | bom-01 | inv-02 | 120 |
| org-01 | bom-01 | inv-04 | 8 |
| org-01 | bom-01 | inv-05 | 20 |

#### bom-03: Egg Biryani Half
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-03 | inv-01 | 150 |
| org-01 | bom-03 | inv-04 | 8 |
| org-01 | bom-03 | inv-05 | 20 |

#### bom-04: Egg Biryani Full
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-04 | inv-01 | 300 |
| org-01 | bom-04 | inv-04 | 15 |
| org-01 | bom-04 | inv-05 | 40 |

#### bom-05: Prawn Biryani Full
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-05 | inv-01 | 300 |
| org-01 | bom-05 | inv-03 | 150 |
| org-01 | bom-05 | inv-04 | 20 |
| org-01 | bom-05 | inv-05 | 40 |

#### bom-06: Veg Biryani Half
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-06 | inv-01 | 150 |
| org-01 | bom-06 | inv-06 | 80 |
| org-01 | bom-06 | inv-07 | 100 |
| org-01 | bom-06 | inv-04 | 8 |
| org-01 | bom-06 | inv-05 | 20 |

#### bom-07: Veg Biryani Full
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-07 | inv-01 | 300 |
| org-01 | bom-07 | inv-06 | 150 |
| org-01 | bom-07 | inv-07 | 200 |
| org-01 | bom-07 | inv-04 | 15 |
| org-01 | bom-07 | inv-05 | 40 |

#### bom-08: Chicken Tikka 4 Pieces
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-08 | inv-02 | 200 |
| org-01 | bom-08 | inv-08 | 30 |
| org-01 | bom-08 | inv-05 | 15 |

#### bom-09: Chicken Tikka 8 Pieces
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-09 | inv-02 | 400 |
| org-01 | bom-09 | inv-08 | 60 |
| org-01 | bom-09 | inv-05 | 30 |

#### bom-11: Packaged Kit (sell — single item BOM)
| org_id | bom_id | inventory_item_id | required_quantity |
|--------|--------|-------------------|-------------------|
| org-01 | bom-11 | inv-09 (Packaged Kit) | 1 |

Note: `bom-10` is for production (converting materials → kits). `bom-11` is for selling (deducting 1 kit from stock on order).

---

### Step 17 — Create Item Variants

**Table: `item_variants`**

| id | org_id | item_id | bom_id | sku | name | price | manage_inventory |
|----|--------|---------|--------|-----|------|-------|-----------------|
| var-01 | org-01 | itm-01 | bom-01 | BIR-CHK-H | Chicken Biryani - Half | 180.00 | true |
| var-02 | org-01 | itm-01 | bom-02 | BIR-CHK-F | Chicken Biryani - Full | 320.00 | true |
| var-03 | org-01 | itm-01 | bom-03 | BIR-EGG-H | Egg Biryani - Half | 160.00 | true |
| var-04 | org-01 | itm-01 | bom-04 | BIR-EGG-F | Egg Biryani - Full | 280.00 | true |
| var-05 | org-01 | itm-01 | bom-05 | BIR-PRW-F | Prawn Biryani - Full | 420.00 | true |
| var-06 | org-01 | itm-02 | bom-06 | VEG-BIR-H | Veg Biryani - Half | 120.00 | true |
| var-07 | org-01 | itm-02 | bom-07 | VEG-BIR-F | Veg Biryani - Full | 220.00 | true |
| var-08 | org-01 | itm-03 | bom-08 | TKK-4PC | Chicken Tikka - 4 Pieces | 280.00 | true |
| var-09 | org-01 | itm-03 | bom-09 | TKK-8PC | Chicken Tikka - 8 Pieces | 520.00 | true |
| var-10 | org-01 | itm-04 | null | COLD-COFFEE | Cold Coffee | 120.00 | false |
| var-11 | org-01 | itm-05 | bom-11 | PKG-BIR-KIT | Packaged Biryani Kit | 450.00 | true |

- `bom_id` set → on order, deduct bom_lines from inventory
- `bom_id` null → no inventory impact (Cold Coffee)
- Stocked products use a single-line BOM (1x inv-09)

---

### Step 18 — Link Variants to Option Values

**Table: `item_variant_option_values`**

| org_id | variant_id | option_value_id | meaning |
|--------|------------|-----------------|---------|
| org-01 | var-01 | ov-01 | Half |
| org-01 | var-01 | ov-03 | Chicken |
| org-01 | var-02 | ov-02 | Full |
| org-01 | var-02 | ov-03 | Chicken |
| org-01 | var-03 | ov-01 | Half |
| org-01 | var-03 | ov-04 | Egg |
| org-01 | var-04 | ov-02 | Full |
| org-01 | var-04 | ov-04 | Egg |
| org-01 | var-05 | ov-02 | Full |
| org-01 | var-05 | ov-05 | Prawns |
| org-01 | var-06 | ov-06 | Half |
| org-01 | var-07 | ov-07 | Full |
| org-01 | var-08 | ov-08 | 4 Pieces |
| org-01 | var-09 | ov-09 | 8 Pieces |

---

### Step 19 — Create Modifier Groups + Options

**Table: `modifier_groups`**

| id | org_id | bu_id | name | selection_type | min_selections | max_selections |
|----|--------|-------|------|---------------|----------------|----------------|
| mg-01 | org-01 | bu-01 | Spice Level | SINGLE | 1 | 1 |
| mg-02 | org-01 | bu-01 | Add-ons | MULTI | 0 | null |
| mg-03 | org-01 | bu-01 | Dips | MULTI | 0 | 2 |

**Table: `modifier_options`**

| id | org_id | group_id | name | additional_price | is_default |
|----|--------|----------|------|-----------------|------------|
| mo-01 | org-01 | mg-01 | Mild | 0.00 | true |
| mo-02 | org-01 | mg-01 | Medium | 0.00 | false |
| mo-03 | org-01 | mg-01 | Hot | 0.00 | false |
| mo-04 | org-01 | mg-01 | Extra Hot | 0.00 | false |
| mo-05 | org-01 | mg-02 | Extra Raita | 30.00 | false |
| mo-06 | org-01 | mg-02 | Extra Gravy | 20.00 | false |
| mo-07 | org-01 | mg-02 | Boiled Egg | 25.00 | false |
| mo-08 | org-01 | mg-03 | Mint Chutney | 0.00 | false |
| mo-09 | org-01 | mg-03 | Tamarind Chutney | 0.00 | false |

**Table: `item_modifier_groups`**

| org_id | item_id | group_id |
|--------|---------|----------|
| org-01 | itm-01 | mg-01 |
| org-01 | itm-01 | mg-02 |
| org-01 | itm-02 | mg-01 |
| org-01 | itm-02 | mg-02 |
| org-01 | itm-03 | mg-01 |
| org-01 | itm-03 | mg-03 |

---

### Step 20 — Set Price Overrides (optional)

**Table: `price_overrides`**

| org_id | bu_id | item_id | variant_id | context_type | context_value | price |
|--------|-------|---------|------------|-------------|---------------|-------|
| org-01 | bu-01 | null | var-02 | CHANNEL | swiggy | 350.00 |
| org-01 | bu-01 | null | var-02 | CHANNEL | zomato | 345.00 |
| org-01 | bu-01 | null | var-02 | TIME | happy_hour | 280.00 |
| org-01 | bu-01 | null | var-07 | CHANNEL | swiggy | 240.00 |

---

## Catalog is now complete.

---

## Part 7: Order Management — Take Orders

---

### Step 21 — Customer Places an Order

Customer orders: **2x Chicken Biryani Full, Hot, + Extra Raita** and **1x Packaged Biryani Kit**

**Order resolution:**
```
Chicken Biryani Full:
  catalog_items   → itm-01
  item_variants   → var-02 (Full + Chicken)
  modifiers       → mo-03 (Hot, +₹0) + mo-05 (Extra Raita, +₹30)
  price           → check price_overrides (context=walk_in) → none → variant.price = ₹320
  line total      → (₹320 + ₹30) × 2 = ₹700

Packaged Biryani Kit:
  catalog_items   → itm-05
  item_variants   → var-11
  price           → ₹450
  line total      → ₹450 × 1 = ₹450
```

**Inventory deduction — reserve stock via BOM:**

```
var-02 × 2 (bom-02: Chicken Biryani Full):
  inv-01 (Rice):    300 × 2 = 600  → reserved_qty += 600
  inv-02 (Chicken): 200 × 2 = 400  → reserved_qty += 400
  inv-04 (Masala):  15  × 2 = 30   → reserved_qty += 30
  inv-05 (Oil):     40  × 2 = 80   → reserved_qty += 80

var-11 × 1 (bom-11: single line):
  inv-09 (Kit):     1   × 1 = 1    → reserved_qty += 1
```

**`inventory_levels` after reservation:**

| inventory_item_id | stocked_qty | reserved_qty | available |
|-------------------|-------------|--------------|-----------|
| inv-01 | 1900 | 600 | 1300 |
| inv-02 | 850 | 400 | 450 |
| inv-04 | 850 | 30 | 820 |
| inv-05 | 5000 | 80 | 4920 |
| inv-09 | 10 | 1 | 9 |

---

### Step 22 — Order Completed → Deduct Stock + Create Invoice

**Stock deduction:**
```
stocked_qty -= reserved amount
reserved_qty -= reserved amount
```

**Invoice (RECEIVABLE) created automatically:**

| id | type | invoice_number | party_type | party_name | reference_type | reference_id | total_amount | status |
|----|------|----------------|------------|------------|----------------|--------------|--------------|--------|
| inv-r01 | RECEIVABLE | INV-R-2026-0001 | CUSTOMER | Walk-in | order | ord-01 | 1150.00 | ISSUED |

**Payment:**

| id | invoice_id | amount | method | status |
|----|------------|--------|--------|--------|
| pay-02 | inv-r01 | 1150.00 | UPI | COMPLETED |

Invoice status → PAID.

---

## Part 8: Manual Stock Corrections

### Wastage

**Table: `stock_adjustments`**

| id | org_id | bu_id | inventory_item_id | type | quantity | reason | adjusted_by |
|----|--------|-------|-------------------|------|----------|--------|-------------|
| adj-01 | org-01 | bu-01 | inv-02 | WASTE | -50 | Spoiled during prep | user-chef |

`inventory_levels.stocked_qty += -50`

### Physical Count Correction

| id | org_id | bu_id | inventory_item_id | type | quantity | reason | adjusted_by |
|----|--------|-------|-------------------|------|----------|--------|-------------|
| adj-02 | org-01 | bu-01 | inv-01 | CORRECTION | -200 | Physical count variance | user-manager |

---

## Part 9: Stock Transfer Between Kitchens

**Table: `stock_transfers`**

| id | org_id | inventory_item_id | from_bu_id | to_bu_id | quantity | status | requested_by |
|----|--------|-------------------|------------|----------|----------|--------|--------------|
| txr-01 | org-01 | inv-01 | bu-01 (Indiranagar) | bu-02 (Koramangala) | 500 | REQUESTED | user-manager |

Status: `REQUESTED → IN_TRANSIT → RECEIVED / CANCELLED`

On `IN_TRANSIT`: `from_bu.stocked_qty -= 500`
On `RECEIVED`: `to_bu.stocked_qty += 500`

---

## Summary: Full Stock Movement Map

| Event | stocked_qty | reserved_qty |
|-------|-------------|--------------|
| Opening stock setup | set directly | 0 |
| Goods receipt (PO) | + accepted_qty | — |
| Conversion completed (inputs) | - (quantity + wastage_quantity) | — |
| Conversion completed (outputs) | + quantity (wastage not stocked) | — |
| Order placed | — | + (bom_lines × qty) |
| Order completed/cancelled | - reserved amount | - reserved amount |
| Stock adjustment (waste/damage) | - quantity | — |
| Stock adjustment (correction) | +/- quantity | — |
| Transfer sent (IN_TRANSIT) | - at from_bu | — |
| Transfer received | + at to_bu | — |

**Available stock at any moment = `stocked_qty - reserved_qty`**
