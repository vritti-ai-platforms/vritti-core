-- Orders are made only once their payment has landed, so nothing will ever pay an order still waiting for one. The
-- online orders left in AWAITING_PAYMENT by the retired order-first checkout are closed, with the reason recorded.
-- Runs as the owner, so RLS does not narrow it to one organization.
UPDATE "commerce"."orders"
SET "status" = 'CANCELLED',
    "cancelled_at" = now(),
    "cancellation_reason" = 'Checkout retired: orders are now created only after payment succeeds.',
    "updated_at" = now()
WHERE "status" = 'AWAITING_PAYMENT';
