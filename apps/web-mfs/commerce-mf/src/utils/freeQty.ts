// Display-only mirror of backend computeFreeQty; previews the derived free_qty in the form.
export function computeFreeQty(
  orderedQty: number | null | undefined,
  buyQty: number | null | undefined,
  freeQty: number | null | undefined,
  hasScheme: boolean | null | undefined,
): number {
  if (!hasScheme || !buyQty || buyQty <= 0 || !freeQty || freeQty <= 0 || !orderedQty || orderedQty <= 0) return 0;
  return Math.floor(orderedQty / buyQty) * freeQty;
}
