// `/max` rather than the default export, which ships *min* metadata and validates length only — it accepts `+91
// 1111111111`, a number no Indian mobile can have.
import {
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/max';

export interface DialingCountry {
  iso: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

export const DEFAULT_COUNTRY: CountryCode = 'IN';
export const DEFAULT_DIAL_CODE = `+${getCountryCallingCode(DEFAULT_COUNTRY)}`;

// The flag emoji for an ISO 3166-1 alpha-2 code.
export function countryFlag(iso: string): string {
  return String.fromCodePoint(...[...iso.toUpperCase()].map((letter) => 0x1f1a5 + letter.charCodeAt(0)));
}

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

// Strips formatting so the same number written two ways matches.
export function normalizePhone(value: string | null | undefined): string {
  if (!value) return '';
  const cleaned = value.replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? `+${cleaned.slice(1).replace(/\+/g, '')}` : cleaned.replace(/\+/g, '');
}

// Whether this is a real, dialable number — not merely E.164-shaped. libphonenumber checks it against the country's
// actual numbering plan, so a number of the right length with an impossible prefix is rejected.
export function isValidPhone(value: string | null | undefined, country?: CountryCode): boolean {
  const normalized = normalizePhone(value);
  if (!normalized) return false;
  try {
    return isValidPhoneNumber(normalized, country);
  } catch {
    return false;
  }
}

// Joins a chosen country to a typed number, in E.164.
export function toE164(dialCodeOrCountry: string, nationalNumber: string): string {
  const country = asCountry(dialCodeOrCountry);
  const digits = normalizePhone(nationalNumber).replace(/^\+/, '');
  if (!digits) return '';

  const parsed = parsePhoneNumberFromString(digits, country);
  if (parsed?.isValid()) return parsed.format('E.164');

  const code = country ? `+${getCountryCallingCode(country)}` : normalizePhone(dialCodeOrCountry);
  return `${code.startsWith('+') ? code : `+${code}`}${digits.replace(/^0+/, '')}`;
}

// Splits a stored number back into a country and the rest, for re-filling a field.
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

// Accepts either an ISO code or a dial code, since a picker may submit either.
function asCountry(value: string): CountryCode | undefined {
  const upper = value.toUpperCase() as CountryCode;
  if (getCountries().includes(upper)) return upper;

  const code = normalizePhone(value).replace(/^\+/, '');
  return getCountries().find((iso) => getCountryCallingCode(iso) === code);
}

export type { CountryCode };
