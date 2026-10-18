import type { PaymentMoneyResponseDto } from './payment-intent-response.dto';

export interface CheckoutOrderResponseDto {
  orderId: string;
  orderNumber: string;
  total: PaymentMoneyResponseDto;
  totalMinor: string;
  reused: boolean;
  customer?: { name: string | null; phone: string | null; email: string | null } | null;
}
