import type { CheckoutCustomerDto } from '@domain/orders/dto/entity/order-checkout.dto';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { Checkout, CheckoutLine, CheckoutStatus } from '@/db/schema';

// One store's share of a checkout — what its payout leg is sized from
export class CheckoutSiteShareDto {
  siteId: string;
  legalEntityId: string;
  // Minor units as a string, so the payment is split for the exact amount
  subtotalMinor: string;

  static fromLines(lines: CheckoutLine[]): CheckoutSiteShareDto[] {
    const shares = new Map<string, CheckoutSiteShareDto>();
    for (const line of lines) {
      const share =
        shares.get(line.siteId) ??
        Object.assign(new CheckoutSiteShareDto(), {
          siteId: line.siteId,
          legalEntityId: line.legalEntityId,
          subtotalMinor: '0',
        });
      share.subtotalMinor = (BigInt(share.subtotalMinor) + line.lineTotal).toString();
      shares.set(line.siteId, share);
    }
    return [...shares.values()];
  }
}

// A checkout as the payment is opened for it
export class CheckoutStartedDto {
  checkoutId: string;
  status: CheckoutStatus;
  currencyCode: string;
  total: CurrencyAmountDto;
  // The same total in minor units, as a string so the payment intent is created for the exact amount
  totalMinor: string;
  // When the payment window closes; the intent is given the same deadline
  expiresAt: string;
  customer: CheckoutCustomerDto | null;
  sites: CheckoutSiteShareDto[];
  // True when the checkout key answered with a checkout it had already opened, false for a new one
  reused: boolean;

  static from(
    entity: Checkout,
    lines: CheckoutLine[],
    customer: CheckoutCustomerDto | null,
    reused = false,
  ): CheckoutStartedDto {
    const dto = new CheckoutStartedDto();
    dto.checkoutId = entity.id;
    dto.status = entity.status;
    dto.currencyCode = entity.currencyCode;
    dto.total = CurrencyAmountDto.from(entity.totalAmount, entity.currencyCode);
    dto.totalMinor = entity.totalAmount.toString();
    dto.expiresAt = entity.expiresAt.toISOString();
    dto.customer = customer;
    dto.sites = CheckoutSiteShareDto.fromLines(lines);
    dto.reused = reused;
    return dto;
  }
}

// One order a checkout became, at one store
export class CheckoutOrderRefDto {
  siteId: string;
  orderId: string;
  orderNumber: string;
}

// Where a checkout stands: its stores' shares, and the orders it has become
export class CheckoutStatusDto {
  checkoutId: string;
  status: CheckoutStatus;
  currencyCode: string;
  total: CurrencyAmountDto;
  totalMinor: string;
  paymentIntentId: string | null;
  sites: CheckoutSiteShareDto[];
  orders: CheckoutOrderRefDto[];

  static from(entity: Checkout, lines: CheckoutLine[], orders: CheckoutOrderRefDto[]): CheckoutStatusDto {
    const dto = new CheckoutStatusDto();
    dto.checkoutId = entity.id;
    dto.status = entity.status;
    dto.currencyCode = entity.currencyCode;
    dto.total = CurrencyAmountDto.from(entity.totalAmount, entity.currencyCode);
    dto.totalMinor = entity.totalAmount.toString();
    dto.paymentIntentId = entity.paymentIntentId;
    dto.sites = CheckoutSiteShareDto.fromLines(lines);
    dto.orders = orders;
    return dto;
  }
}
