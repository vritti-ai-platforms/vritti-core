import { BadRequestException } from '@vritti/api-sdk/exceptions';

// Cashfree prices in rupees with two decimals; the platform keeps paise as bigint
const MINOR_PER_MAJOR = 100;
// The only currency this integration takes: every other one Cashfree supports needs international payments enabled
export const CASHFREE_CURRENCY = 'INR';

// Paise as the rupee number Cashfree's API takes, refused past float precision rather than silently rounded
export function toMajorUnits(amount: bigint, field = 'amount'): number {
  if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new BadRequestException({
      label: 'Invalid Amount',
      detail: 'The amount must be positive and within the range the gateway accepts.',
      errors: [{ field, message: 'Out of range' }],
    });
  }
  return Number(amount) / MINOR_PER_MAJOR;
}

// A rupee amount Cashfree sent back, as paise
export function toMinorUnits(amount: number | string | null | undefined): bigint {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0n;
  return BigInt(Math.round(value * MINOR_PER_MAJOR));
}
