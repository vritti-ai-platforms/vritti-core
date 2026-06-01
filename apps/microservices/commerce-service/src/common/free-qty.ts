import Decimal from '@vritti/api-sdk/decimal';
import type { FreeSchemeMode } from '@/db/schema';

// Derives the bonus (free) quantity for a trade scheme given the paid/ordered quantity.
//   slab     → one free block per complete buyQty (9+1 on 15 → 1; on 18 → 2)
//   pro_rata → orderedQty × (freeQty / buyQty), to 3 decimal places
// Returns 0 when the scheme is incomplete (no ratio or no mode).
export function computeFreeQty(
  orderedQty: number,
  buyQty?: number | null,
  freeQty?: number | null,
  mode?: FreeSchemeMode | null,
): number {
  if (mode !== 'slab' && mode !== 'pro_rata') return 0;
  if (!buyQty || buyQty <= 0 || !freeQty || freeQty <= 0 || orderedQty <= 0) return 0;
  if (mode === 'slab') return Math.floor(orderedQty / buyQty) * freeQty;
  return new Decimal(orderedQty).times(freeQty).div(buyQty).toDecimalPlaces(3).toNumber();
}
