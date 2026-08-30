// `/max` rather than the default export, which ships *min* metadata and validates length only —
// it accepts `+91 1111111111`, a number no Indian mobile can have. Every send here costs a real
// WhatsApp message, so the larger metadata that checks each country's actual numbering plan is
// worth its bundle size.
import {
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/max';

/**
 * One country a phone number can belong to.
 *
 * `flag` is an emoji rather than an image, so a picker needs no asset pipeline and renders the same
 * in a browser, a React Native app and an email.
 */
export interface DialingCountry {
  /** ISO 3166-1 alpha-2. */
  iso: CountryCode;
  /** Localised via CLDR, falling back to the ISO code where the runtime has no data. */
  name: string;
  /** ITU-T E.164 country calling code, including the `+`. */
  dialCode: string;
  flag: string;
}

/** Where a picker starts when nothing else is known. These storefronts sell in India. */
export const DEFAULT_COUNTRY: CountryCode = 'IN';
export const DEFAULT_DIAL_CODE = `+${getCountryCallingCode(DEFAULT_COUNTRY)}`;

/**
 * The flag emoji for an ISO 3166-1 alpha-2 code.
 *
 * Computed rather than tabulated: a flag emoji *is* its two letters expressed as Unicode regional
 * indicator symbols, so every present and future country code works without a lookup table anyone
 * has to maintain.
 */
export function countryFlag(iso: string): string {
  return String.fromCodePoint(...[...iso.toUpperCase()].map((letter) => 0x1f1a5 + letter.charCodeAt(0)));
}

/**
 * Every country libphonenumber knows, with its calling code — 245 of them.
 *
 * Built from the library rather than hand-listed, so the calling codes stay correct as the metadata
 * is updated; a curated list is a copy that silently goes stale and quietly excludes somebody.
 *
 * Names come from `Intl.DisplayNames`, which is CLDR data the runtime already carries. Where it is
 * unavailable — Hermes without full ICU, notably — the ISO code stands in, which is unlovely but
 * still selectable and still correct.
 *
 * Sorted by name so a picker reads alphabetically, with the default country first because it is
 * overwhelmingly the common answer and scrolling past it every time is a small daily tax.
 */
export const DIALING_COUNTRIES: readonly DialingCountry[] = buildCountries();

function buildCountries(): DialingCountry[] {
  const display = regionNames();

  const countries = getCountries().map((iso) => ({
    iso,
    name: display?.of(iso) ?? iso,
    dialCode: `+${getCountryCallingCode(iso)}`,
    flag: countryFlag(iso),
  }));

  countries.sort((a, b) => a.name.localeCompare(b.name));

  const defaultIndex = countries.findIndex((country) => country.iso === DEFAULT_COUNTRY);
  if (defaultIndex > 0) countries.unshift(...countries.splice(defaultIndex, 1));

  return countries;
}

function regionNames(): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
}

/**
 * Strips formatting so the same number written two ways matches.
 *
 * Spaces, dashes and brackets go; a single leading `+` survives. **Deliberately not a parse:** this
 * is what a *lookup* key is normalised with, and it must never guess. A number with no `+` stays
 * without one and fails validation, which is the honest outcome — nobody can tell whether
 * `9876543210` is Indian or American without being told.
 *
 * Use `toE164` when a country *is* known; that one parses properly.
 */
export function normalizePhone(value: string | null | undefined): string {
  if (!value) return '';
  const cleaned = value.replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? `+${cleaned.slice(1).replace(/\+/g, '')}` : cleaned.replace(/\+/g, '');
}

/**
 * Whether this is a real, dialable number — not merely E.164-shaped.
 *
 * libphonenumber checks it against the country's actual numbering plan, so a number of the right
 * length with an impossible prefix is rejected. That matters here because every send costs money.
 */
export function isValidPhone(value: string | null | undefined, country?: CountryCode): boolean {
  const normalized = normalizePhone(value);
  if (!normalized) return false;
  try {
    return isValidPhoneNumber(normalized, country);
  } catch {
    return false;
  }
}

/**
 * Joins a chosen country to a typed number, in E.164.
 *
 * Parses rather than concatenates, so the trunk prefix people type out of habit — `0` in India and
 * the UK, `1` where it applies — is removed by the numbering plan's own rules rather than by a
 * blanket strip that would corrupt the countries where a leading zero is significant.
 *
 * Returns `''` when the result is not a valid number, so a caller can treat "unparseable" and
 * "invalid" identically instead of sending something that fails at Meta.
 */
export function toE164(dialCodeOrCountry: string, nationalNumber: string): string {
  const country = asCountry(dialCodeOrCountry);
  const digits = normalizePhone(nationalNumber).replace(/^\+/, '');
  if (!digits) return '';

  const parsed = parsePhoneNumberFromString(digits, country);
  if (parsed?.isValid()) return parsed.format('E.164');

  // No country resolved, or the plan rejected it. Fall back to a plain join so the caller still has
  // something to validate and report on rather than an empty string that hides the input.
  const code = country ? `+${getCountryCallingCode(country)}` : normalizePhone(dialCodeOrCountry);
  return `${code.startsWith('+') ? code : `+${code}`}${digits.replace(/^0+/, '')}`;
}

/**
 * Splits a stored number back into a country and the rest, for re-filling a field.
 *
 * Uses the parser, so `+1` resolves to the country its area code actually belongs to rather than
 * whichever shares the code first — the thing a longest-prefix match cannot get right.
 *
 * Falls back to the default country with the value intact, so a malformed number still renders for
 * the shopper to correct rather than vanishing from the field.
 */
export function splitPhone(value: string | null | undefined): {
  country: CountryCode;
  dialCode: string;
  nationalNumber: string;
} {
  const normalized = normalizePhone(value);
  const parsed = normalized ? parsePhoneNumberFromString(normalized) : undefined;

  if (parsed?.country) {
    return {
      country: parsed.country,
      dialCode: `+${getCountryCallingCode(parsed.country)}`,
      nationalNumber: parsed.nationalNumber,
    };
  }

  return {
    country: DEFAULT_COUNTRY,
    dialCode: DEFAULT_DIAL_CODE,
    nationalNumber: normalized.replace(/^\+/, ''),
  };
}

/** Accepts either an ISO code or a dial code, since a picker may submit either. */
function asCountry(value: string): CountryCode | undefined {
  const upper = value.toUpperCase() as CountryCode;
  if (getCountries().includes(upper)) return upper;

  const code = normalizePhone(value).replace(/^\+/, '');
  return getCountries().find((iso) => getCountryCallingCode(iso) === code);
}

export type { CountryCode };
