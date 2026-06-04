import type { CurrencyAmount, OfferingDetail } from '@/schemas/offerings';

export interface PriceRange {
  min: CurrencyAmount;
  max: CurrencyAmount;
}

export function getPriceRange(offering: OfferingDetail): PriceRange | null {
  const prices = offering.variants
    .map((v) => v.price)
    .filter((p): p is CurrencyAmount => p != null && p.value !== '' && !Number.isNaN(Number(p.value)));

  if (prices.length === 0) return null;

  let min = prices[0];
  let max = prices[0];
  for (const price of prices) {
    if (Number(price.value) < Number(min.value)) min = price;
    if (Number(price.value) > Number(max.value)) max = price;
  }
  return { min, max };
}
