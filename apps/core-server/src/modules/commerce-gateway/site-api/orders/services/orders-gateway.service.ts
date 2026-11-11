import type { CreateOrderDto } from '@commerce/orders/dto/request/create-order.dto';
import type { UpdateOrderStatusDto } from '@commerce/orders/dto/request/update-order-status.dto';
import type {
  OrderPaymentRefundCheckResponseDto,
  OrderPaymentResponseDto,
} from '@commerce/orders/dto/response/order-payment-response.dto';
import type { OrderDetailResponseDto, OrderResponseDto } from '@commerce/orders/dto/response/order-response.dto';
import type { OrderTableResponseDto } from '@commerce/orders/dto/response/order-table-response.dto';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import type {
  PaymentIntentResponseDto,
  PaymentIntentStatusValue,
} from '@/modules/payments-gateway/intents/dto/response/payment-intent-response.dto';

@Injectable()
export class OrdersGatewayService {
  private readonly logger = new Logger(OrdersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
  ) {}

  // Returns paginated, filtered, and sorted orders for the data table
  async findForTable(userId: string): Promise<OrderTableResponseDto> {
    this.logger.log('site.orders.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-site-orders');

    const { result, count } = await this.nats.send<{ result: OrderResponseDto[]; count: number }>(
      'commerce',
      'site.orders.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new order
  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    this.logger.log(`orders.create — type: ${dto.type}, channel: ${dto.channel}`);
    return this.nats.send('commerce', 'site.orders.create', dto);
  }

  // Finds an order by ID with full detail
  async findById(id: string): Promise<OrderDetailResponseDto> {
    this.logger.log(`orders.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.orders.findById', { id });
  }

  // Updates order status
  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    this.logger.log(`orders.updateStatus — id: ${id}, status: ${dto.status}`);
    return this.nats.send('commerce', 'site.orders.updateStatus', { id, ...dto });
  }

  // The payments of the order's checkout, each marked whether the order uses it and whether staff may refund it. The
  // order is read at the site in context first, so only an order of this site opens its checkout's payments
  async listPayments(id: string): Promise<OrderPaymentResponseDto[]> {
    this.logger.log(`orders.listPayments — id: ${id}`);
    const order = await this.findById(id);
    const intents = await this.orderIntents(order);
    return intents.map((intent) => toOrderPayment(intent, order));
  }

  // Retries the refund of a payment of the order's checkout that no order uses, after the gateway refused it. Such a
  // payment (a shopper's second one for a checkout already paid) is refunded automatically when it lands; only a
  // refused refund comes back to staff. The payment the order was paid with is refused here
  async refundPayment(id: string, paymentIntentId: string): Promise<SuccessResponseDto> {
    this.logger.log(`orders.refundPayment — id: ${id}, payment: ${paymentIntentId}`);
    const order = await this.findById(id);
    const intent = (await this.orderIntents(order)).find((candidate) => candidate.id === paymentIntentId);
    if (!intent) throw new NotFoundException('Payment not found for this order.');
    if (intent.id === order.paymentIntentId) {
      throw new ConflictException({
        label: 'Payment Used By Order',
        detail: 'This order was paid with this payment. Cancel the order to refund it.',
      });
    }
    if (!isRefundableStatus(intent.status)) {
      throw new ConflictException({
        label: 'Not Refundable',
        detail: REFUSED_REFUND_DETAIL[intent.status] ?? 'Only a payment whose refund failed can be refunded again.',
      });
    }
    const { credentials } = await this.gatewayConfigService.getDecryptedCredentials(intent.configId);
    await this.nats.send('payments', 'payments.intents.refund', { paymentIntentId: intent.id, credentials });
    this.logger.log(`Refunded payment ${intent.id} of order ${order.orderNumber}`);
    return { success: true, message: 'Refund retried.' };
  }

  // Asks the gateway where a pending refund stands and records what it says: refunded, failed, or still pending.
  // For a refund whose webhook has not arrived; one a webhook already settled is no longer pending and is refused.
  // The events the change writes reach core's handlers through its event sweep
  async checkRefund(id: string, paymentIntentId: string): Promise<OrderPaymentRefundCheckResponseDto> {
    this.logger.log(`orders.checkRefund — id: ${id}, payment: ${paymentIntentId}`);
    const order = await this.findById(id);
    const intent = (await this.orderIntents(order)).find((candidate) => candidate.id === paymentIntentId);
    if (!intent) throw new NotFoundException('Payment not found for this order.');
    if (intent.status !== 'REFUND_PENDING') {
      throw new ConflictException({
        label: 'Nothing To Check',
        detail: 'Only a refund that is still pending can be checked.',
      });
    }
    const { credentials } = await this.gatewayConfigService.getDecryptedCredentials(intent.configId);
    const { intent: checked } = await this.nats.send<{ intent: PaymentIntentResponseDto }>(
      'payments',
      'payments.intents.syncRefund',
      { paymentIntentId: intent.id, credentials },
    );
    this.logger.log(`Refund of payment ${intent.id} (order ${order.orderNumber}) is ${checked.status}`);
    return {
      success: true,
      message: REFUND_CHECK_MESSAGE[checked.status] ?? 'The refund was checked.',
      status: checked.status,
    };
  }

  // The order's checkout's payments, or the one payment of an order paid without a checkout
  private async orderIntents(order: OrderDetailResponseDto): Promise<PaymentIntentResponseDto[]> {
    if (order.checkoutId) {
      return this.nats.send<PaymentIntentResponseDto[]>('payments', 'payments.intents.listByTarget', {
        targetId: order.checkoutId,
      });
    }
    if (order.paymentIntentId) {
      return [
        await this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.get', {
          paymentIntentId: order.paymentIntentId,
        }),
      ];
    }
    return [];
  }
}

// What a refund check found, in words for staff
const REFUND_CHECK_MESSAGE: Partial<Record<PaymentIntentStatusValue, string>> = {
  REFUNDED: 'The gateway has refunded this payment.',
  REFUND_FAILED: 'The gateway could not refund this payment. Retry the refund.',
  REFUND_PENDING: 'The refund is still pending at the gateway.',
};

// Why a payment's refund cannot be retried, by its status
const REFUSED_REFUND_DETAIL: Partial<Record<PaymentIntentStatusValue, string>> = {
  SUCCEEDED: 'This payment is being refunded automatically.',
  REFUND_PENDING: 'A refund of this payment is already with the gateway.',
  REFUNDED: 'This payment has already been refunded.',
};

// Only a refund the gateway refused is retried by hand; every other refund runs on its own
function isRefundableStatus(status: PaymentIntentStatusValue): boolean {
  return status === 'REFUND_FAILED';
}

// True when the payment is for more than this order's total: a checkout across stores is paid once for all of them.
// False when the amounts cannot be compared
function paysMoreThan(intent: PaymentIntentResponseDto, order: OrderDetailResponseDto): boolean {
  try {
    const paid = majorToMinor(intent.amount.value, intent.amount.currency as CurrencyCode);
    return paid > BigInt(order.totalAmount);
  } catch {
    return false;
  }
}

// One payment as the order's payments tab shows it
function toOrderPayment(intent: PaymentIntentResponseDto, order: OrderDetailResponseDto): OrderPaymentResponseDto {
  const usedForOrder = intent.id === order.paymentIntentId;
  return {
    id: intent.id,
    gatewayCode: intent.gatewayCode,
    method: intent.method,
    amount: intent.amount,
    status: intent.status,
    providerOrderId: intent.providerOrderId,
    providerPaymentId: intent.providerPaymentId,
    succeededAt: intent.succeededAt,
    refundedAt: intent.refundedAt ?? null,
    refundReference: intent.refundReference ?? null,
    refundFailureMessage: intent.refundFailureMessage ?? null,
    usedForOrder,
    refundable: !usedForOrder && isRefundableStatus(intent.status),
    coversOtherOrders: paysMoreThan(intent, order),
    createdAt: intent.createdAt,
  };
}
