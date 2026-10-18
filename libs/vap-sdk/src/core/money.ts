import { Decimal } from 'decimal.js';
import type { Dinero, DineroCurrency } from 'dinero.js/bigint';
import {
  dinero,
  greaterThanOrEqual,
  hasSubUnits,
  isNegative,
  isZero,
  normalizeScale,
  subtract,
  toDecimal,
  toSnapshot,
} from 'dinero.js/bigint';
import * as currencies from 'dinero.js/bigint/currencies';
import type { Money } from './types.js';

// Money, the same way the admin apps do it.

// A currency this SDK can do arithmetic in, resolved from its ISO 4217 code.
function resolveCurrency(currencyCode: string): DineroCurrency<bigint> {
  const currency = (currencies as Record<string, DineroCurrency<bigint> | undefined>)[currencyCode];
  // Guessing an exponent would be the worst possible failure: two decimals assumed for a currency with none silently
  // multiplies every price by a hundred.
  if (!currency) throw new Error(`Unknown currency: ${currencyCode}`);
  return currency;
}

// Minor units — paise, cents — to the major-unit string core and this SDK pass around.
export function minorToMajor(minor: string | number | bigint, currencyCode: string): string {
  const currency = resolveCurrency(currencyCode);
  return toDecimal(dinero({ amount: BigInt(minor), currency }));
}

// Major units to the whole number of minor units a payment gateway and core both expect.
export function majorToMinor(major: string | number, currencyCode: string): string {
  const currency = resolveCurrency(currencyCode);
  const factor = new Decimal(10).pow(Number(currency.exponent));
  return new Decimal(major).mul(factor).toFixed(0);
}

// Minor units as the `{ currency, value }` pair core answers with, for a column that stores paise.
export function moneyFromMinor(minor: string | number | bigint, currencyCode: string): Money {
  return { currency: currencyCode, value: minorToMajor(minor, currencyCode) };
}

// The same pair as a Dinero object, which is what every calculation below actually operates on.
function toDinero(money: Money): Dinero<bigint> {
  const currency = resolveCurrency(money.currency);
  return dinero({ amount: BigInt(majorToMinor(money.value, money.currency)), currency });
}

// How far under a list price a price is, as a whole percentage — 23 for a tile to show "−23%".
export function percentOff(listPrice: Money | null | undefined, price: Money | null | undefined): number | null {
  if (!listPrice?.value || !price?.value) return null;
  if (listPrice.currency !== price.currency) return null;

  const list = toDinero(listPrice);
  const paid = toDinero(price);
  if (isZero(list) || isNegative(list) || isNegative(paid)) return null;
  if (greaterThanOrEqual(paid, list)) return null;

  // Normalised together so the two amounts are counted in the same unit before they are divided — dinero keeps its own
  // scale per object, and dividing a scale-2 amount by a scale-4 one is off by a factor of a hundred with nothing to
  // show it.
  const [saved, total] = normalizeScale([subtract(list, paid), list]);
  const ratio = new Decimal(toSnapshot(saved).amount.toString()).div(toSnapshot(total).amount.toString());
  const percent = ratio.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  return percent > 0 ? percent : null;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, currencyCode: string, withDecimals: boolean): Intl.NumberFormat {
  const key = `${locale}|${currencyCode}|${withDecimals}`;
  const cached = formatters.get(key);
  if (cached) return cached;
  const made = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    ...(withDecimals ? {} : { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  });
  formatters.set(key, made);
  return made;
}

// Major units as a party reads them: "₹1,234.50", "$12.99", "1.000,00 €".
export function formatCurrencyMajor(major: string | number, currencyCode: string, locale = 'en-IN'): string {
  return formatMoney({ currency: currencyCode, value: String(major) }, locale) ?? '';
}

// Minor units as a party reads them.
export function formatCurrency(minor: string | number | bigint, currencyCode: string, locale = 'en-IN'): string {
  return formatCurrencyMajor(minorToMajor(minor, currencyCode), currencyCode, locale);
}

// A price from core, as a party reads it — **the whole string, symbol included**.
export function formatMoney(money: Money | null | undefined, locale = 'en-IN'): string | null {
  if (!money?.value?.trim() || !money.currency) return null;

  const amount = toDinero(money);
  return toDecimal(amount, ({ value, currency }) =>
    // `Number` on the way into Intl is dinero's documented transformer, and is safe here because this is the last step
    // before a party reads it: nothing is calculated from the result.
    formatter(locale, currency.code, hasSubUnits(amount)).format(Number(value)),
  );
}
