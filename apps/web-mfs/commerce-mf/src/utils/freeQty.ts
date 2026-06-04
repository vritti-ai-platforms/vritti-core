// Display-only mirror of the backend computeFreeQty. The persisted free_qty is always derived
// server-side; this only previews it in the form as the ordered qty / scheme inputs change.
export function computeFreeQty(
  orderedQty: number | null | undefined,
  buyQty: number | null | undefined,
  freeQty: number | null | undefined,
  hasScheme: boolean | null | undefined,
): number {
  if (!hasScheme || !buyQty || buyQty <= 0 || !freeQty || freeQty <= 0 || !orderedQty || orderedQty <= 0) return 0;
  return Math.floor(orderedQty / buyQty) * freeQty;
}
