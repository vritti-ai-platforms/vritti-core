import { BadRequestException } from '@vritti/api-sdk/exceptions';

// Razorpay takes amounts as a JSON integer in minor units, so the bigint has to become a number here —
// guarded so a value past float precision is refused rather than silently rounded
export function toMinorUnitsNumber(amount: bigint, field = 'amount'): number {
  if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new BadRequestException({
      label: 'Invalid Amount',
      detail: 'The amount must be positive and within the range the gateway accepts.',
      errors: [{ field, message: 'Out of range' }],
    });
  }
  return Number(amount);
}
