import type { PaymentMoneyResponseDto } from './payment-intent-response.dto';

export interface CheckoutOrderResponseDto {
  orderId: string;
  orderNumber: string;
  total: PaymentMoneyResponseDto;
  totalMinor: string;
  // True when commerce handed back the order this idempotency key had already opened
  reused: boolean;
  // Who is paying, from the party's own record — prefills the payment gateway's page
  customer?: { name: string | null; phone: string | null; email: string | null } | null;
}
