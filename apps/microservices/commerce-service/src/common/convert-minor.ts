import Decimal from '@vritti/api-sdk/decimal';
import { type CurrencyCode, resolveCurrency } from '@vritti/api-sdk/money';

// Converts an amount in minor units of one currency into minor units of another, where 1 `from` = `rate` `to`;
// the exponents differ between currencies (JPY 0, INR 2, KWD 3), so the minor units are rescaled as well
export function convertMinor(minor: bigint, from: string, to: string, rate: Decimal.Value): bigint {
  const fromExponent = Number(resolveCurrency(from as CurrencyCode).exponent);
  const toExponent = Number(resolveCurrency(to as CurrencyCode).exponent);
  return BigInt(
    new Decimal(minor.toString())
      .times(rate)
      .times(new Decimal(10).pow(toExponent - fromExponent))
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toFixed(0),
  );
}
