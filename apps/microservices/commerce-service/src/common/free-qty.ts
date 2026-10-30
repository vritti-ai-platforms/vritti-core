import Decimal from '@vritti/api-sdk/decimal';

// Derives the bonus (free) quantity for a slab trade scheme given the paid/ordered quantity. one free block per
// complete buyQty (9+1 on 15 → 1; on 18 → 2) Returns 0 when there is no scheme or the ratio is incomplete. Decimal keeps
// fractional quantities exact: in floats 0.3 / 0.1 is 2.999…, which would floor to one block short.
export function computeFreeQty(
  orderedQty: number,
  buyQty?: number | null,
  freeQty?: number | null,
  hasScheme?: boolean | null,
): number {
  if (!hasScheme || !buyQty || buyQty <= 0 || !freeQty || freeQty <= 0 || !orderedQty || orderedQty <= 0) return 0;
  return new Decimal(orderedQty).dividedToIntegerBy(buyQty).times(freeQty).toNumber();
}
