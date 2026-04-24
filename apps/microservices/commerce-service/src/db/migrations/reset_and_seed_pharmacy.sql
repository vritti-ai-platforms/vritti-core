BEGIN;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'vritti_core'
      AND tablename NOT IN (
        '__drizzle_migrations_commerce',
        'organizations',
        'business_units',
        'users',
        'sessions',
        'verifications',
        'org_roles',
        'user_role_assignments',
        'media'
      )
  LOOP
    EXECUTE format('TRUNCATE TABLE vritti_core.%I RESTART IDENTITY CASCADE', t.tablename);
  END LOOP;
END $$;

CREATE TEMP TABLE _env AS
SELECT
  o.id AS organization_id,
  b.id AS business_unit_id
FROM vritti_core.organizations o
JOIN vritti_core.business_units b ON b.organization_id = o.id
ORDER BY o.created_at, b.created_at
LIMIT 1;

INSERT INTO vritti_core.categories (
  id, organization_id, business_unit_id, name, image, parent_id, is_active, sort_order, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  e.business_unit_id,
  'Drugs',
  NULL,
  NULL,
  true,
  1,
  now(),
  now()
FROM _env e;

INSERT INTO vritti_core.uom (
  id, organization_id, business_unit_id, name, symbol, base_unit_id, conversion_factor, created_at
)
SELECT gen_random_uuid(), e.organization_id, e.business_unit_id, x.name, x.symbol, NULL, 1, now()
FROM _env e
CROSS JOIN (
  VALUES
    ('Tablet', 'tab'),
    ('Capsule', 'cap'),
    ('Bottle', 'btl')
) AS x(name, symbol);

CREATE TEMP TABLE _uom AS
SELECT id, name, symbol
FROM vritti_core.uom
WHERE business_unit_id = (SELECT business_unit_id FROM _env);

CREATE TEMP TABLE _locations AS
WITH ins AS (
  INSERT INTO vritti_core.storage_locations (
    id, organization_id, business_unit_id, name, code, parent_id, path, sort_order, area, manager_id, address, is_active, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    e.organization_id,
    e.business_unit_id,
    x.name,
    x.code,
    NULL::uuid,
    x.path::vritti_core.ltree,
    x.sort_order,
    x.area,
    NULL::uuid,
    x.address,
    true,
    now(),
    now()
  FROM _env e
  CROSS JOIN (
    VALUES
      ('Main Pharmacy Store', 'LOC-MAIN', 'main', 1, 'Ground Floor', 'Main counter and retail shelves'),
      ('Cold Storage', 'LOC-COLD', 'main.cold', 2, 'Back Room', 'Temperature controlled medicines'),
      ('Receiving Zone', 'LOC-RECV', 'main.recv', 3, 'Dock', 'Incoming stock inspection area')
  ) AS x(name, code, path, sort_order, area, address)
  RETURNING id, code
)
SELECT * FROM ins;

INSERT INTO vritti_core.storage_locations (
  id, organization_id, business_unit_id, name, code, parent_id, path, sort_order, area, manager_id, address, is_active, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  e.business_unit_id,
  x.name,
  x.code,
  p.id,
  x.path::vritti_core.ltree,
  x.sort_order,
  x.area,
  NULL::uuid,
  x.address,
  true,
  now(),
  now()
FROM _env e
JOIN (
  SELECT
    'Main Rack ' || lpad(gs::text, 2, '0') AS name,
    'M-RACK-' || lpad(gs::text, 2, '0') AS code,
    'LOC-MAIN' AS parent_code,
    'main.rack_' || lpad(gs::text, 2, '0') AS path,
    100 + gs AS sort_order,
    'Ground Floor' AS area,
    'High volume aisle' AS address
  FROM generate_series(1, 15) gs
  UNION ALL
  SELECT
    'Cold Rack ' || lpad(gs::text, 2, '0'),
    'C-RACK-' || lpad(gs::text, 2, '0'),
    'LOC-COLD',
    'main.cold.rack_' || lpad(gs::text, 2, '0'),
    200 + gs,
    'Back Room',
    'Cold-chain rack'
  FROM generate_series(1, 6) gs
  UNION ALL
  SELECT
    'Receiving Rack ' || lpad(gs::text, 2, '0'),
    'R-RACK-' || lpad(gs::text, 2, '0'),
    'LOC-RECV',
    'main.recv.rack_' || lpad(gs::text, 2, '0'),
    300 + gs,
    'Dock',
    'Inbound receiving rack'
  FROM generate_series(1, 4) gs
) AS x ON true
JOIN _locations p ON p.code = x.parent_code
ON CONFLICT (business_unit_id, code) DO NOTHING;

INSERT INTO vritti_core.storage_locations (
  id, organization_id, business_unit_id, name, code, parent_id, path, sort_order, area, manager_id, address, is_active, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  e.business_unit_id,
  x.name,
  x.code,
  p.id,
  x.path::vritti_core.ltree,
  x.sort_order,
  x.area,
  NULL::uuid,
  x.address,
  true,
  now(),
  now()
FROM _env e
JOIN (
  SELECT
    'Main Shelf ' || lpad(rack_no::text, 2, '0') || '-' || lpad(shelf_no::text, 2, '0') AS name,
    'M-SH-' || lpad(rack_no::text, 2, '0') || '-' || lpad(shelf_no::text, 2, '0') AS code,
    'M-RACK-' || lpad(rack_no::text, 2, '0') AS parent_code,
    'main.rack_' || lpad(rack_no::text, 2, '0') || '.shelf_' || lpad(shelf_no::text, 2, '0') AS path,
    1000 + rack_no * 10 + shelf_no AS sort_order,
    'Ground Floor' AS area,
    'Retail shelf' AS address
  FROM generate_series(1, 15) rack_no
  CROSS JOIN generate_series(1, 6) shelf_no
  UNION ALL
  SELECT
    'Cold Shelf ' || lpad(rack_no::text, 2, '0') || '-' || lpad(shelf_no::text, 2, '0'),
    'C-SH-' || lpad(rack_no::text, 2, '0') || '-' || lpad(shelf_no::text, 2, '0'),
    'C-RACK-' || lpad(rack_no::text, 2, '0'),
    'main.cold.rack_' || lpad(rack_no::text, 2, '0') || '.shelf_' || lpad(shelf_no::text, 2, '0'),
    2000 + rack_no * 10 + shelf_no,
    'Back Room',
    'Cold shelf'
  FROM generate_series(1, 6) rack_no
  CROSS JOIN generate_series(1, 2) shelf_no
  UNION ALL
  SELECT
    'Receiving Shelf ' || lpad(rack_no::text, 2, '0') || '-' || lpad(shelf_no::text, 2, '0'),
    'R-SH-' || lpad(rack_no::text, 2, '0') || '-' || lpad(shelf_no::text, 2, '0'),
    'R-RACK-' || lpad(rack_no::text, 2, '0'),
    'main.recv.rack_' || lpad(rack_no::text, 2, '0') || '.shelf_' || lpad(shelf_no::text, 2, '0'),
    3000 + rack_no * 10 + shelf_no,
    'Dock',
    'Receiving shelf'
  FROM generate_series(1, 4) rack_no
  CROSS JOIN generate_series(1, 2) shelf_no
) AS x ON true
JOIN vritti_core.storage_locations p ON p.code = x.parent_code
WHERE p.business_unit_id = e.business_unit_id;

CREATE TEMP TABLE _suppliers AS
WITH ins AS (
  INSERT INTO vritti_core.suppliers (
    id, organization_id, business_unit_id, name, code, contact_name, phone, email, website, address, tax_id, payment_terms, lead_time_days, notes, is_active, currency_code, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    e.organization_id,
    e.business_unit_id,
    s.name,
    s.code,
    s.contact_name,
    s.phone,
    s.email,
    NULL,
    s.address,
    NULL,
    'Net 30',
    s.lead_time_days,
    'Pharmacy partner supplier',
    true,
    'OMR',
    now(),
    now()
  FROM _env e
  CROSS JOIN (
    VALUES
      ('HealWell Distributors', 'SUP-HW', 'Arjun Mehta', '+919811110001', 'ops@healwell.example', 'Bengaluru', 3, 'HealWell'),
      ('MediCure Wholesale', 'SUP-MC', 'Kiran Rao', '+919811110002', 'ops@medicure.example', 'Bengaluru', 2, 'MediCure'),
      ('VitaPharm Traders', 'SUP-VP', 'Neha Iyer', '+919811110003', 'ops@vitapharm.example', 'Bengaluru', 4, 'VitaPharm'),
      ('NovaRx Agencies', 'SUP-NR', 'Sameer Khan', '+919811110004', 'ops@novarx.example', 'Bengaluru', 3, 'NovaRx'),
      ('ZenithLabs Supply', 'SUP-ZL', 'Priya Das', '+919811110005', 'ops@zenithlabs.example', 'Bengaluru', 5, 'ZenithLabs')
  ) AS s(name, code, contact_name, phone, email, address, lead_time_days, brand_key)
  RETURNING id, name, code
)
SELECT
  i.id,
  i.name,
  i.code,
  CASE
    WHEN i.code = 'SUP-HW' THEN 'HealWell'
    WHEN i.code = 'SUP-MC' THEN 'MediCure'
    WHEN i.code = 'SUP-VP' THEN 'VitaPharm'
    WHEN i.code = 'SUP-NR' THEN 'NovaRx'
    ELSE 'ZenithLabs'
  END AS brand_key
FROM ins i;

INSERT INTO vritti_core.supplier_contacts (
  id, organization_id, business_unit_id, supplier_id, name, phone, alternate_phone, email, alternate_email, designation, notes, is_primary, is_active, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  e.business_unit_id,
  s.id,
  split_part(s.name, ' ', 1) || ' Contact',
  '+91991122' || right(s.code, 2),
  NULL,
  lower(replace(s.code, '-', '')) || '@supplier.example',
  NULL,
  'Key Account Manager',
  'Primary supplier contact',
  true,
  true,
  now(),
  now()
FROM _env e
JOIN _suppliers s ON true;

CREATE TEMP TABLE _category AS
SELECT id
FROM vritti_core.categories
WHERE business_unit_id = (SELECT business_unit_id FROM _env)
  AND name = 'Drugs'
LIMIT 1;

CREATE TEMP TABLE _items AS
WITH formulas AS (
  SELECT *
  FROM (
    VALUES
      ('Paracetamol', '500mg', 'Tablet'),
      ('Amoxicillin', '500mg', 'Capsule'),
      ('Cetirizine', '10mg', 'Tablet'),
      ('Metformin', '500mg', 'Tablet'),
      ('Amlodipine', '5mg', 'Tablet'),
      ('Atorvastatin', '10mg', 'Tablet'),
      ('Omeprazole', '20mg', 'Capsule'),
      ('Azithromycin', '500mg', 'Tablet'),
      ('Levocetirizine', '5mg', 'Tablet'),
      ('Dextromethorphan', '100ml', 'Bottle')
  ) AS f(formula, strength, form)
),
brands AS (
  SELECT *
  FROM (
    VALUES
      ('HealWell'),
      ('MediCure'),
      ('VitaPharm'),
      ('NovaRx'),
      ('ZenithLabs')
  ) AS b(brand)
),
combinations AS (
  SELECT
    f.formula,
    f.strength,
    f.form,
    b.brand,
    row_number() OVER (ORDER BY f.formula, b.brand) AS rn
  FROM formulas f
  CROSS JOIN brands b
),
ins AS (
  INSERT INTO vritti_core.inventory_items (
    id, organization_id, business_unit_id, name, code, type, category_id, description, uom_id, metadata, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    e.organization_id,
    e.business_unit_id,
    c.formula || ' ' || c.strength || ' - ' || c.brand,
    'DRG-' || lpad(c.rn::text, 3, '0'),
    'PRODUCT',
    cat.id,
    c.formula || ' ' || c.strength || ' (' || c.brand || ')',
    u.id,
    jsonb_build_object(
      'formula', c.formula,
      'strength', c.strength,
      'brand', c.brand,
      'form', c.form
    ),
    now(),
    now()
  FROM combinations c
  JOIN _env e ON true
  JOIN _category cat ON true
  JOIN _uom u ON u.name = c.form
  RETURNING id, name, code, uom_id, metadata
)
SELECT
  i.id,
  i.name,
  i.code,
  i.uom_id,
  i.metadata->>'brand' AS brand,
  i.metadata->>'form' AS form,
  row_number() OVER (ORDER BY i.code) AS rn
FROM ins i;

INSERT INTO vritti_core.supplier_items (
  id, organization_id, supplier_id, inventory_item_id, supplier_item_code, unit_price, uom_id, min_order_quantity, lead_time_days, is_preferred, is_active, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  s.id,
  i.id,
  s.code || '-' || right(i.code, 3),
  CASE
    WHEN i.form = 'Bottle' THEN (85 + (i.rn % 40))::numeric(12,2)
    WHEN i.form = 'Capsule' THEN (18 + (i.rn % 12))::numeric(12,2)
    ELSE (12 + (i.rn % 10))::numeric(12,2)
  END,
  i.uom_id,
  CASE WHEN i.form = 'Bottle' THEN 12::numeric(12,3) ELSE 50::numeric(12,3) END,
  2 + (i.rn % 4),
  true,
  true,
  now(),
  now()
FROM _items i
JOIN _suppliers s ON s.brand_key = i.brand
JOIN _env e ON true;

INSERT INTO vritti_core.storage_location_configs (
  id, organization_id, business_unit_id, inventory_item_id, location_id, reorder_level, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  e.business_unit_id,
  i.id,
  l.id,
  CASE WHEN i.form = 'Bottle' THEN 10 ELSE 40 END,
  now(),
  now()
FROM _items i
JOIN _env e ON true
JOIN _locations l ON l.code = 'LOC-MAIN';

CREATE TEMP TABLE _batches AS
WITH ins AS (
  INSERT INTO vritti_core.inventory_item_batches (
    id, organization_id, business_unit_id, inventory_item_id, location_id, batch_number, quantity, reserved_quantity, manufacturing_date, expiry_date, goods_receipt_item_id, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    e.organization_id,
    e.business_unit_id,
    i.id,
    l.id,
    'BATCH-' || right(i.code, 3) || '-01',
    (60 + (i.rn % 140))::numeric(12,3),
    0::numeric(12,3),
    (current_date - ((i.rn % 180) || ' days')::interval)::date,
    (current_date + ((240 + (i.rn % 360)) || ' days')::interval)::date,
    NULL,
    now(),
    now()
  FROM _items i
  JOIN _env e ON true
  JOIN _locations l ON l.code = 'LOC-MAIN'
  RETURNING id, inventory_item_id, quantity
)
SELECT * FROM ins;

INSERT INTO vritti_core.inventory_ledger (
  id, organization_id, business_unit_id, inventory_item_id, batch_id, type, quantity, reference_type, reference_id, notes, created_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  e.business_unit_id,
  b.inventory_item_id,
  b.id,
  'OPENING_STOCK',
  b.quantity,
  NULL,
  NULL,
  'Opening stock for pharmacy seed',
  now()
FROM _batches b
JOIN _env e ON true;

CREATE TEMP TABLE _catalog_items AS
WITH ins AS (
  INSERT INTO vritti_core.items (
    id, organization_id, business_unit_id, category_id, type, code, name, description, tax_group_id, is_available, sort_order, attributes, metadata, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    e.organization_id,
    e.business_unit_id,
    cat.id,
    'PRODUCT',
    'CAT-' || i.code,
    i.name,
    i.name,
    NULL::uuid,
    true,
    i.rn,
    jsonb_build_object('form', i.form, 'brand', i.brand),
    jsonb_build_object('inventory_item_id', i.id, 'form', i.form, 'brand', i.brand),
    now(),
    now()
  FROM _items i
  JOIN _env e ON true
  JOIN _category cat ON true
  RETURNING id, code, name, metadata
)
SELECT
  ins.id AS item_id,
  (ins.metadata->>'inventory_item_id')::uuid AS inventory_item_id,
  ins.code,
  ins.name
FROM ins;

CREATE TEMP TABLE _catalog_variants AS
WITH priced AS (
  SELECT
    ci.item_id,
    ci.inventory_item_id,
    ci.code,
    ci.name,
    COALESCE(AVG(si.unit_price::numeric), 25)::numeric(12,2) AS avg_unit_price
  FROM _catalog_items ci
  LEFT JOIN vritti_core.supplier_items si ON si.inventory_item_id = ci.inventory_item_id
  GROUP BY ci.item_id, ci.inventory_item_id, ci.code, ci.name
),
ins AS (
  INSERT INTO vritti_core.item_variants (
    id, organization_id, item_id, bom_id, sku, name, price, is_available, manage_inventory, sort_order, attributes, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    e.organization_id,
    p.item_id,
    NULL::uuid,
    p.code || '-STD',
    'Standard Pack',
    ROUND((p.avg_unit_price * 1.35 + ((row_number() OVER (ORDER BY p.code)) % 4))::numeric, 2),
    true,
    true,
    1,
    '{}'::jsonb,
    now(),
    now()
  FROM priced p
  JOIN _env e ON true
  RETURNING id, item_id, price
)
SELECT
  v.id AS variant_id,
  v.item_id,
  v.price,
  ci.inventory_item_id,
  ci.name
FROM ins v
JOIN _catalog_items ci ON ci.item_id = v.item_id;

CREATE TEMP TABLE _order_days AS
SELECT
  d::date AS day_date,
  (200 + floor(random() * 301))::int AS orders_count
FROM generate_series(current_date - interval '20 days', current_date, interval '1 day') AS gs(d);

CREATE TEMP TABLE _orders_seed AS
WITH expanded AS (
  SELECT
    od.day_date,
    gs.seq
  FROM _order_days od
  JOIN LATERAL generate_series(1, od.orders_count) AS gs(seq) ON true
),
ins AS (
  INSERT INTO vritti_core.orders (
    id, organization_id, business_unit_id, order_number, type, channel, status, customer_name, customer_phone, delivery_address, subtotal, tax_amount,
    service_charge, delivery_charge, discount_amount, total_amount, notes, external_order_id, placed_at, confirmed_at, ready_at, completed_at, cancelled_at,
    cancellation_reason, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    e.organization_id,
    e.business_unit_id,
    'RX-' || to_char(x.day_date, 'YYYYMMDD') || '-' || lpad(x.seq::text, 4, '0'),
    CASE
      WHEN random() < 0.30 THEN 'DELIVERY'
      WHEN random() < 0.96 THEN 'TAKEAWAY'
      ELSE 'DINE_IN'
    END::vritti_core.order_type,
    CASE WHEN random() < 0.32 THEN 'ONLINE' ELSE 'WALK_IN' END::vritti_core.order_source,
    CASE
      WHEN random() < 0.87 THEN 'COMPLETED'
      WHEN random() < 0.93 THEN 'READY'
      WHEN random() < 0.97 THEN 'ACCEPTED'
      ELSE 'CANCELLED'
    END::vritti_core.order_status,
    'Customer ' || x.seq::text,
    '+9198' || lpad(((10000000 + ((x.seq * 37) % 89999999)))::text, 8, '0'),
    CASE WHEN random() < 0.30 THEN 'Local delivery zone' ELSE NULL END,
    0, 0, 0,
    0,
    0,
    0,
    NULL,
    NULL,
    x.day_date::timestamp + (((x.seq * 157) % 86400) || ' seconds')::interval,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    x.day_date::timestamp + (((x.seq * 157) % 86400) || ' seconds')::interval,
    now()
  FROM expanded x
  JOIN _env e ON true
  RETURNING id, order_number, placed_at, status, type
)
SELECT * FROM ins;

CREATE TEMP TABLE _variant_weighted AS
WITH base AS (
  SELECT
    cv.variant_id,
    cv.item_id,
    cv.price,
    cv.name AS item_name,
    split_part(cv.name, ' ', 1) AS formula
  FROM _catalog_variants cv
),
weighted AS (
  SELECT
    b.*,
    CASE
      WHEN b.formula IN ('Paracetamol', 'Cetirizine', 'Omeprazole', 'Metformin') THEN 4
      WHEN b.formula IN ('Amoxicillin', 'Amlodipine', 'Atorvastatin') THEN 3
      ELSE 2
    END AS weight
  FROM base b
)
SELECT
  w.variant_id,
  w.item_id,
  w.price,
  w.item_name
FROM weighted w
JOIN generate_series(1, w.weight) gs(i) ON true;

INSERT INTO vritti_core.order_items (
  id, organization_id, order_id, item_id, variant_id, item_name, variant_name, quantity, unit_price, tax_rate, tax_amount, subtotal, total, notes, created_at
)
SELECT
  gen_random_uuid(),
  e.organization_id,
  o.id,
  v.item_id,
  v.variant_id,
  v.item_name,
  'Standard Pack',
  q.qty,
  v.price,
  q.tax_rate,
  ROUND((v.price * q.qty::numeric * q.tax_rate / 100)::numeric, 2),
  ROUND((v.price * q.qty::numeric)::numeric, 2),
  ROUND((v.price * q.qty::numeric) + (v.price * q.qty::numeric * q.tax_rate / 100), 2),
  NULL,
  o.placed_at
FROM _orders_seed o
JOIN _env e ON true
JOIN LATERAL generate_series(1, (1 + floor(random() * 4))::int) AS li(n) ON true
JOIN LATERAL (
  SELECT
    vw.variant_id,
    vw.item_id,
    vw.price,
    vw.item_name
  FROM _variant_weighted vw
  ORDER BY random()
  LIMIT 1
) v ON true
JOIN LATERAL (
  SELECT
    (1 + floor(random() * 3))::int AS qty,
    CASE WHEN random() < 0.72 THEN 5::numeric(5,2) ELSE 12::numeric(5,2) END AS tax_rate
) q ON true;

UPDATE vritti_core.orders o
SET
  subtotal = agg.subtotal,
  tax_amount = agg.tax_amount,
  delivery_charge = CASE WHEN o.type = 'DELIVERY' THEN 25 ELSE 0 END,
  discount_amount = CASE WHEN agg.subtotal >= 500 THEN ROUND((agg.subtotal * 0.03)::numeric, 2) ELSE 0 END,
  service_charge = 0,
  total_amount = ROUND(
    (
      agg.subtotal
      + agg.tax_amount
      + (CASE WHEN o.type = 'DELIVERY' THEN 25 ELSE 0 END)
      - (CASE WHEN agg.subtotal >= 500 THEN (agg.subtotal * 0.03) ELSE 0 END)
    )::numeric,
    2
  ),
  confirmed_at = CASE WHEN o.status IN ('ACCEPTED', 'READY', 'COMPLETED') THEN o.placed_at + interval '4 minutes' ELSE NULL END,
  ready_at = CASE WHEN o.status IN ('READY', 'COMPLETED') THEN o.placed_at + interval '12 minutes' ELSE NULL END,
  completed_at = CASE WHEN o.status = 'COMPLETED' THEN o.placed_at + interval '18 minutes' ELSE NULL END,
  cancelled_at = CASE WHEN o.status = 'CANCELLED' THEN o.placed_at + interval '8 minutes' ELSE NULL END,
  cancellation_reason = CASE WHEN o.status = 'CANCELLED' THEN 'Customer changed mind' ELSE NULL END,
  updated_at = now()
FROM (
  SELECT
    oi.order_id,
    ROUND(SUM(oi.subtotal::numeric), 2) AS subtotal,
    ROUND(SUM(oi.tax_amount::numeric), 2) AS tax_amount
  FROM vritti_core.order_items oi
  GROUP BY oi.order_id
) agg
WHERE o.id = agg.order_id;

COMMIT;
