import { CURRENCIES } from './currencies';

// "INR - Indian Rupee" → "Indian Rupee"; the code is already the headline wherever this is shown
export function currencyName(code: string): string {
  const option = CURRENCIES.find((entry) => entry.value === code);
  return option ? String(option.label).replace(`${code} - `, '') : code;
}
