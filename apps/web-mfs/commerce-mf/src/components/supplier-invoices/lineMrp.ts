import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import Decimal from '@vritti/quantum-ui/decimal';

// A receipt batch's MRP, or nothing when it had none — the API sends a zero for that
export function invoiceLineMrp(source: { mrp: CurrencyValue }): CurrencyValue | undefined {
  return new Decimal(source.mrp.value).isZero() ? undefined : source.mrp;
}
