import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import Decimal from '@vritti/quantum-ui/decimal';

export interface ReceiveWithInvoiceTableLine {
  allocationId: string;
  inventoryItemName?: string;
  uomSymbol?: string;
  purchaseNumber?: string;
  quantity: number;
  freeQty: number;
  unitPrice?: CurrencyValue;
  discountAmount?: CurrencyValue | null;
  taxAmount?: CurrencyValue | null;
  lotNumber?: string | null;
  expiryDate?: string | null;
}

export interface ReceiveWithInvoiceTotals {
  subtotal: CurrencyValue;
  discount: CurrencyValue;
  tax: CurrencyValue;
  total: CurrencyValue;
}

// An amount as a decimal, nothing entered counting as zero
function amountOf(amount: CurrencyValue | null | undefined): Decimal {
  return new Decimal(amount?.value || 0);
}

// A line's invoiced amount before discount and tax: quantity times unit price
function grossOf(line: ReceiveWithInvoiceTableLine): Decimal {
  return amountOf(line.unitPrice).times(line.quantity);
}

// A line's total as the invoice computes it: gross less discount plus tax, in the invoice currency
export function receiveWithInvoiceLineTotal(line: ReceiveWithInvoiceTableLine, currency: string): CurrencyValue {
  return {
    currency,
    value: grossOf(line).minus(amountOf(line.discountAmount)).plus(amountOf(line.taxAmount)).toFixed(),
  };
}

// The invoice's subtotal, discount, tax and total over its lines, in the invoice currency
export function receiveWithInvoiceTotals(
  lines: ReceiveWithInvoiceTableLine[],
  currency: string,
): ReceiveWithInvoiceTotals {
  const subtotal = lines.reduce((sum, line) => sum.plus(grossOf(line)), new Decimal(0));
  const discount = lines.reduce((sum, line) => sum.plus(amountOf(line.discountAmount)), new Decimal(0));
  const tax = lines.reduce((sum, line) => sum.plus(amountOf(line.taxAmount)), new Decimal(0));
  return {
    subtotal: { currency, value: subtotal.toFixed() },
    discount: { currency, value: discount.toFixed() },
    tax: { currency, value: tax.toFixed() },
    total: { currency, value: subtotal.minus(discount).plus(tax).toFixed() },
  };
}

// An entered amount carried in the invoice currency, or nothing when it is empty or zero
export function invoiceAmount(amount: CurrencyValue | null | undefined, currency: string): CurrencyValue | undefined {
  return amount?.value && !amountOf(amount).isZero() ? { currency, value: amount.value } : undefined;
}
