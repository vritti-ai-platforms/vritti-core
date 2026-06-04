import Decimal from '@vritti/api-sdk/decimal';

// Splits a total (minor units) across weights so the parts sum to EXACTLY total (largest-remainder).
// Floors each total*weightᵢ/Σweights, then hands the leftover one minor unit at a time to the largest
// fractional remainders (ties → lowest index). Returns zeros when Σweights == 0.
export function allocateByWeight(total: bigint, weights: number[]): bigint[] {
  const n = weights.length;
  if (n === 0) return [];

  const totalWeight = weights.reduce((sum, w) => sum.plus(w), new Decimal(0));
  if (totalWeight.lte(0)) return weights.map(() => 0n);

  const totalDec = new Decimal(total.toString());
  const floors: bigint[] = new Array(n);
  const remainders: { index: number; remainder: Decimal }[] = new Array(n);
  let allocated = 0n;

  for (let i = 0; i < n; i++) {
    const exact = totalDec.times(weights[i]).div(totalWeight);
    const floor = exact.floor();
    const floorBig = BigInt(floor.toFixed(0));
    floors[i] = floorBig;
    allocated += floorBig;
    remainders[i] = { index: i, remainder: exact.minus(floor) };
  }

  // Distribute the leftover minor units to the largest fractional remainders; ties keep lowest index.
  let leftover = total - allocated;
  remainders.sort((a, b) => {
    const cmp = b.remainder.comparedTo(a.remainder);
    return cmp !== 0 ? cmp : a.index - b.index;
  });
  for (let i = 0; leftover > 0n && i < n; i++) {
    floors[remainders[i].index] += 1n;
    leftover -= 1n;
  }

  return floors;
}
