import type { ItemDetail } from '@/schemas/items';

// Returns a human-readable price range across an item's variants ("₹100" or "₹100 – ₹250")
export function getPriceSummary(item: ItemDetail): string | null {
  if (item.variants.length === 0) return null;

  const prices = item.variants
    .map((v) => (v.price ? Number(v.price) : null))
    .filter((p): p is number => p != null && !Number.isNaN(p));

  if (prices.length === 0) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `₹${min.toLocaleString()}` : `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
}
