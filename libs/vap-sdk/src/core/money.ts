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

/**
 * Money, the same way the admin apps do it.
 *
 * Deliberately `dinero.js` + `decimal.js`, with `minorToMajor`, `majorToMinor`, `formatCurrency` and
 * `formatCurrencyMajor` named as they are in `@vritti/quantum-ui/money`: a storefront and the back
 * office that prices it must convert and round identically, and two implementations of "what is 1/3
 * of a rupee" is how a total comes out a paisa apart from the invoice beside it. Same packages, same
 * methods, one answer.
 *
 * Display differs from the admin apps in exactly one way, and on purpose: a whole amount prints as
 * "₹349" here rather than "₹349.00". A back office lines numbers up in a column and wants the
 * decimals; a shop front does not, and `hasSubUnits` is dinero's own answer for deciding which.
 *
 * **Minor units are the only safe wire shape**, so every conversion goes through a decimal type
 * rather than a float: `0.1 + 0.2` is not `0.3` in IEEE-754, and a shop that adds three lines up
 * shows it. Core answers `{ currency, value }` with `value` already in **major units as a string**
 * — see `formatMoney`, which is the one a storefront almost always wants.
 *
 * **The `locale` argument is the reader, not the currency.** It decides the grouping and where the
 * symbol sits, so `en-IN` prints a dollar price in lakhs — correct for an Indian reader, wrong for a
 * shop serving the US. It defaults to `en-IN` because every storefront on this SDK sells from India
 * today; one that does not passes its own rather than letting the host's locale decide, which would
 * print a different number on the server than in the browser.
 *
 * Lives in `core/` because a price is rendered on a server, in a browser and on a device alike:
 * nothing here touches Node, Payload or the DOM.
 */

/** A currency this SDK can do arithmetic in, resolved from its ISO 4217 code. */
function resolveCurrency(currencyCode: string): DineroCurrency<bigint> {
  const currency = (currencies as Record<string, DineroCurrency<bigint> | undefined>)[currencyCode];
  // Guessing an exponent would be the worst possible failure: two decimals assumed for a currency
  // with none silently multiplies every price by a hundred. Refuse instead.
  if (!currency) throw new Error(`Unknown currency: ${currencyCode}`);
  return currency;
}

/** Minor units — paise, cents — to the major-unit string core and this SDK pass around. */
export function minorToMajor(minor: string | number | bigint, currencyCode: string): string {
  const currency = resolveCurrency(currencyCode);
  return toDecimal(dinero({ amount: BigInt(minor), currency }));
}

/** Major units to the whole number of minor units a payment gateway and core both expect. */
export function majorToMinor(major: string | number, currencyCode: string): string {
  const currency = resolveCurrency(currencyCode);
  const factor = new Decimal(10).pow(Number(currency.exponent));
  return new Decimal(major).mul(factor).toFixed(0);
}

/** Minor units as the `{ currency, value }` pair core answers with, for a column that stores paise. */
export function moneyFromMinor(minor: string | number | bigint, currencyCode: string): Money {
  return { currency: currencyCode, value: minorToMajor(minor, currencyCode) };
}

/** The same pair as a Dinero object, which is what every calculation below actually operates on. */
function toDinero(money: Money): Dinero<bigint> {
  const currency = resolveCurrency(money.currency);
  return dinero({ amount: BigInt(majorToMinor(money.value, money.currency)), currency });
}

/**
 * How far under a list price a price is, as a whole percentage — 23 for a tile to show "−23%".
 *
 * **Both sides are money, and the money arithmetic is Dinero's.** The subtraction happens on whole
 * minor units at a common scale, so nothing is ever a float and nothing is ever parsed back out of a
 * formatted string. Only the final ratio leaves money behind — a percentage is not an amount — and
 * even that is `Decimal`, rounded half-up at the last step rather than accumulated in binary.
 *
 * `null` unless there is a real saving to show: no list price, a different currency on each side
 * (a discount across two currencies is a claim about an exchange rate nobody here has), or a list
 * price at or below what is being charged, which is the "struck-through price equal to the real one"
 * trick rather than a discount.
 */
export function percentOff(listPrice: Money | null | undefined, price: Money | null | undefined): number | null {
  if (!listPrice?.value || !price?.value) return null;
  if (listPrice.currency !== price.currency) return null;

  const list = toDinero(listPrice);
  const paid = toDinero(price);
  if (isZero(list) || isNegative(list) || isNegative(paid)) return null;
  if (greaterThanOrEqual(paid, list)) return null;

  // Normalised together so the two amounts are counted in the same unit before they are divided —
  // dinero keeps its own scale per object, and dividing a scale-2 amount by a scale-4 one is off by
  // a factor of a hundred with nothing to show it.
  const [saved, total] = normalizeScale([subtract(list, paid), list]);
  const ratio = new Decimal(toSnapshot(saved).amount.toString()).div(toSnapshot(total).amount.toString());
  const percent = ratio.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  return percent > 0 ? percent : null;
}

// Formatters are cached per locale, currency and decimal rule: resolving a locale is the expensive
// part of `Intl.NumberFormat`, while formatting with one is cheap, and a grid of tiles builds the
// same three combinations over and over.
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

/** Major units as a party reads them: "₹1,234.50", "$12.99", "1.000,00 €". */
export function formatCurrencyMajor(major: string | number, currencyCode: string, locale = 'en-IN'): string {
  return formatMoney({ currency: currencyCode, value: String(major) }, locale) ?? '';
}

/** Minor units as a party reads them. */
export function formatCurrency(minor: string | number | bigint, currencyCode: string, locale = 'en-IN'): string {
  return formatCurrencyMajor(minorToMajor(minor, currencyCode), currencyCode, locale);
}

/**
 * A price from core, as a party reads it — **the whole string, symbol included**.
 *
 * This is dinero's own formatting recipe: `toDecimal` hands the amount and its currency to `Intl`,
 * which decides everything about how it reads. That matters more than it looks, because none of it is
 * ours to choose: `de-DE` writes `1.000,00 €` with the symbol *after* the number and a non-breaking
 * space in front of it, `en-IN` groups in lakhs, and a yen price has no decimal part at all. A caller
 * that pastes a symbol in front of some digits gets all three wrong, which is why this returns one
 * string and there is no function here handing out a symbol on its own.
 *
 * Trailing zeroes go, and that decision is made on the money rather than on its text — `hasSubUnits`
 * asks dinero whether there is a fractional part to show, so "₹349.00" prints as "₹349" without a
 * regex ever looking at a formatted number.
 *
 * `null` in, `null` out: an unpriced listing is a real state, and rendering "₹0" for it would claim
 * something is free rather than unavailable.
 */
export function formatMoney(money: Money | null | undefined, locale = 'en-IN'): string | null {
  if (!money?.value?.trim() || !money.currency) return null;

  const amount = toDinero(money);
  return toDecimal(amount, ({ value, currency }) =>
    // `Number` on the way into Intl is dinero's documented transformer, and is safe here because this
    // is the last step before a party reads it: nothing is calculated from the result.
    formatter(locale, currency.code, hasSubUnits(amount)).format(Number(value)),
  );
}
