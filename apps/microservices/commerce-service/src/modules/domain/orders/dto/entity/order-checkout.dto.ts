import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { Order, OrderStatus } from '@/db/schema';

export interface CheckoutCustomerDto {
  name: string | null;
  phone: string | null;
  email: string | null;
}

export class CheckoutOrderDto {
  orderId: string;
  orderNumber: string;
  total: CurrencyAmountDto;
  // The same total in minor units, as a string so the payment intent is created for the exact amount
  totalMinor: string;
  customer: CheckoutCustomerDto | null;
  // True when the checkout key answered with an order it had already opened, false for a newly created one
  reused: boolean;

  static from(
    entity: Order,
    currencyCode: string,
    customer: CheckoutCustomerDto | null = null,
    reused = false,
  ): CheckoutOrderDto {
    const dto = new CheckoutOrderDto();
    dto.orderId = entity.id;
    dto.orderNumber = entity.orderNumber;
    dto.total = CurrencyAmountDto.from(entity.totalAmount, currencyCode);
    dto.totalMinor = entity.totalAmount.toString();
    dto.customer = customer;
    dto.reused = reused;
    return dto;
  }
}

export class OrderPaymentStatusDto {
  orderId: string;
  status: OrderStatus;

  static from(entity: Order): OrderPaymentStatusDto {
    const dto = new OrderPaymentStatusDto();
    dto.orderId = entity.id;
    dto.status = entity.status;
    return dto;
  }
}
