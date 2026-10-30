import { BadRequestException } from '@vritti/api-sdk/exceptions';

// The only currency Easebuzz takes
export const EASEBUZZ_CURRENCY = 'INR';

const PAISE_PER_RUPEE = 100n;
// A rupee amount as Easebuzz writes it back: "10", "10.0" or "10.00"
const RUPEE_AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/;

// Paise as the rupee string Easebuzz takes, always with two decimals ("10.00"). Done in integers, so nothing rounds
export function toRupees(amount: bigint, field = 'amount'): string {
  if (amount <= 0n) {
    throw new BadRequestException({
      label: 'Invalid Amount',
      detail: 'The amount must be positive.',
      errors: [{ field, message: 'Must be greater than zero' }],
    });
  }
  const paise = amount % PAISE_PER_RUPEE;
  return `${amount / PAISE_PER_RUPEE}.${paise.toString().padStart(2, '0')}`;
}

// A rupee amount Easebuzz sent back, as paise; null when it is not a plain decimal
export function toPaise(amount: string | number | null | undefined): bigint | null {
  const text = typeof amount === 'number' ? amount.toFixed(2) : amount?.trim();
  const match = text ? RUPEE_AMOUNT.exec(text) : null;
  if (!match) return null;
  return BigInt(match[1]) * PAISE_PER_RUPEE + BigInt((match[2] ?? '').padEnd(2, '0'));
}
