import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc, ne } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { variantLabel } from '@/common/variant-label';
import {
  type Order,
  type OrderSource,
  OrderSourceValues,
  type OrderStatus,
  OrderStatusValues,
  type OrderType,
  orders,
} from '@/db/schema';
import { OrderDetailDto, OrderDto, OrderItemDto } from '../dto/entity/order.dto';
import { CheckoutOrderDto, OrderPaymentStatusDto } from '../dto/entity/order-checkout.dto';
import type { AwaitingPaymentOrderInput } from '../dto/request/awaiting-payment-order-input.dto';
import type { CancelUnpaidOrderDto } from '../dto/request/cancel-unpaid-order.dto';
import type { CreateOrderDto, CreateOrderItemDto } from '../dto/request/create-order.dto';
import type { MarkOrderPaidDto } from '../dto/request/mark-order-paid.dto';
import type { UpdateOrderStatusDto } from '../dto/request/update-order-status.dto';
import { OrdersDomainRepository } from '../repositories/orders.repository';

@Injectable()
export class OrdersDomainService {
  private readonly logger = new Logger(OrdersDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    orderNumber: { column: orders.orderNumber, type: 'string' },
    status: { column: orders.status, type: 'string' },
    channel: { column: orders.channel, type: 'string' },
    type: { column: orders.type, type: 'string' },
  };

  // Valid status transitions: current status -> allowed next statuses
  private static readonly STATUS_TRANSITIONS: Record<string, string[]> = {
    // Leaves only through a payment (markPaid) or the checkout expiring (cancelUnpaid), never by hand
    [OrderStatusValues.AWAITING_PAYMENT]: [],
    [OrderStatusValues.PENDING]: [OrderStatusValues.ACCEPTED, OrderStatusValues.CANCELLED],
    [OrderStatusValues.ACCEPTED]: [OrderStatusValues.PREPARING, OrderStatusValues.CANCELLED],
    [OrderStatusValues.PREPARING]: [OrderStatusValues.READY, OrderStatusValues.CANCELLED],
    [OrderStatusValues.READY]: [OrderStatusValues.COMPLETED, OrderStatusValues.CANCELLED],
    [OrderStatusValues.COMPLETED]: [],
    [OrderStatusValues.CANCELLED]: [],
  };

  constructor(private readonly repository: OrdersDomainRepository) {}

  // Returns paginated orders for the data table
  async findForTable(state: TableViewState): Promise<{ result: OrderDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, OrdersDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, OrdersDomainService.FIELD_MAP);
    // Unpaid checkouts stay out of the store's queue unless the reader filters by status explicitly
    const filtersByStatus = state.filters?.some((filter) => filter.field === 'status') ?? false;
    const unpaidHidden = filtersByStatus ? undefined : ne(orders.status, OrderStatusValues.AWAITING_PAYMENT);
    const where = and(filterWhere, searchWhere, unpaidHidden);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, OrdersDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(orders.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(OrderDto.from), count };
  }

  // Creates a new order with items, denormalizing catalog data
  async create(data: CreateOrderDto): Promise<OrderDto> {
    const orderNumber = await this.repository.generateOrderNumber();

    // Build order items using the variant's own price
    const { itemRows, subtotal, taxAmount } = await this.buildOrderItems(data.items);

    const serviceCharge = new Decimal(data.serviceCharge ?? 0);
    const deliveryCharge = new Decimal(data.deliveryCharge ?? 0);
    const discountAmount = new Decimal(data.discountAmount ?? 0);
    const totalAmount = subtotal.plus(taxAmount).plus(serviceCharge).plus(deliveryCharge).minus(discountAmount);

    const entity = await this.repository.create({
      orderNumber,
      type: data.type as OrderType,
      channel: data.channel as OrderSource,
      customerId: data.customerId ?? null,
      customerName: data.customerName ?? null,
      customerPhone: data.customerPhone ?? null,
      deliveryAddress: data.deliveryAddress ?? null,
      notes: data.notes ?? null,
      subtotal: toMinorBigInt(subtotal),
      taxAmount: toMinorBigInt(taxAmount),
      serviceCharge: toMinorBigInt(serviceCharge),
      deliveryCharge: toMinorBigInt(deliveryCharge),
      discountAmount: toMinorBigInt(discountAmount),
      totalAmount: toMinorBigInt(totalAmount),
    });

    // Insert order items
    await this.repository.createItems(
      itemRows.map((item) => ({
        orderId: entity.id,
        offeringId: item.offeringId,
        offeringVariantId: item.offeringVariantId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate.toNumber(),
        taxAmount: toMinorBigInt(item.taxAmount),
        subtotal: toMinorBigInt(item.subtotal),
        total: toMinorBigInt(item.total),
        notes: item.notes ?? null,
      })),
    );

    this.logger.log(`Created order: ${entity.orderNumber} (${entity.id})`);
    return OrderDto.from(entity);
  }

  // Opens an online order from priced basket lines, held in AWAITING_PAYMENT until the payment lands
  async createAwaitingPayment(input: AwaitingPaymentOrderInput): Promise<CheckoutOrderDto> {
    const lines = input.lines.map((line) => ({ ...line, lineTotal: line.unitPrice * BigInt(line.quantity) }));
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0n);

    const entity = await this.repository.transaction(async () => {
      const orderNumber = await this.repository.generateOrderNumber();
      const order = await this.repository.create({
        orderNumber,
        type: input.type,
        channel: OrderSourceValues.ONLINE,
        status: OrderStatusValues.AWAITING_PAYMENT,
        partyId: input.partyId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes,
        checkoutKey: input.checkoutKey,
        currencyCode: input.currencyCode,
        subtotal,
        taxAmount: 0n,
        serviceCharge: 0n,
        deliveryCharge: 0n,
        discountAmount: 0n,
        totalAmount: subtotal,
      });

      await this.repository.createItems(
        lines.map((line) => ({
          orderId: order.id,
          offeringId: line.offeringId,
          offeringVariantId: line.offeringVariantId,
          name: line.name,
          code: line.code,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: 0,
          taxAmount: 0n,
          subtotal: line.lineTotal,
          total: line.lineTotal,
        })),
      );
      return order;
    });

    this.logger.log(
      `Checkout order ${entity.orderNumber} (${entity.id}) awaiting payment — ${subtotal} ${input.currencyCode}`,
    );
    return CheckoutOrderDto.from(entity, input.currencyCode);
  }

  // The order a party's checkout already opened under this key at this site, if any
  async findCheckoutOrder(partyId: string, checkoutKey: string, siteId: string): Promise<Order | undefined> {
    return this.repository.findByCheckoutKey(partyId, checkoutKey, siteId);
  }

  // Records a captured payment against a site's order and releases it to the store. Idempotent per payment intent
  async markPaid(
    data: MarkOrderPaidDto,
    siteId: string,
  ): Promise<{
    result: OrderPaymentStatusDto;
    partyId: string | null;
    paidLines: { code: string; quantity: number }[];
  }> {
    return this.repository.transaction(async () => {
      const order = await this.repository.findByIdForUpdate(data.orderId, siteId);
      if (!order) throw new NotFoundException('Order not found.');

      if (order.paymentIntentId === data.paymentIntentId) {
        return { result: OrderPaymentStatusDto.from(order), partyId: order.partyId, paidLines: [] };
      }
      if (order.paymentIntentId) {
        this.logger.error(
          `markPaid REFUSED — order ${order.id} already paid by intent ${order.paymentIntentId}, second intent ${data.paymentIntentId}`,
        );
        throw new ConflictException({
          label: 'Already Paid',
          detail: `Order ${order.orderNumber} was already paid by another payment. Refund the duplicate.`,
        });
      }

      const amount = BigInt(data.amountMinor);
      if (amount !== order.totalAmount) {
        this.logger.error(
          `markPaid AMOUNT MISMATCH — order ${order.id} (${order.orderNumber}) total ${order.totalAmount} ${order.currencyCode}, intent ${data.paymentIntentId} paid ${amount}. Not marked paid.`,
        );
        throw new ConflictException({
          label: 'Amount Mismatch',
          detail: `The payment of ${amount} does not match the order total of ${order.totalAmount} (minor units).`,
        });
      }

      // Legacy orders carry no currency; only those skip the check
      const currency = data.currency.toUpperCase();
      if (order.currencyCode && currency !== order.currencyCode.toUpperCase()) {
        this.logger.error(
          `markPaid CURRENCY MISMATCH — order ${order.id} (${order.orderNumber}) in ${order.currencyCode}, intent ${data.paymentIntentId} paid in ${currency}. Not marked paid.`,
        );
        throw new ConflictException({
          label: 'Amount Mismatch',
          detail: `The payment in ${currency} does not match the order currency ${order.currencyCode}.`,
        });
      }

      const wasCancelled = order.status === OrderStatusValues.CANCELLED;
      if (order.status !== OrderStatusValues.AWAITING_PAYMENT && !wasCancelled) {
        throw new ConflictException({
          label: 'Order Not Payable',
          detail: `Order ${order.orderNumber} is ${order.status} and is not waiting for a payment.`,
        });
      }

      const paidAt = new Date(data.paidAt);
      const updated = await this.repository.update(order.id, {
        status: OrderStatusValues.PENDING,
        paymentIntentId: data.paymentIntentId,
        paidAt,
        paymentMethod: data.method ?? null,
        paymentReference: data.providerPaymentId ?? null,
        // The store's queue orders by placement — a paid checkout becomes an order when the money lands
        placedAt: paidAt,
        ...(wasCancelled ? this.reopenAfterLatePayment(order) : {}),
      });

      if (wasCancelled) {
        this.logger.warn(
          `Order ${updated.orderNumber} paid after cancellation — reopened as PENDING, flagged for review`,
        );
      } else {
        this.logger.log(`Order ${updated.orderNumber} paid — intent ${data.paymentIntentId}`);
      }

      const items = await this.repository.findItemsByOrderId(order.id);
      return {
        result: OrderPaymentStatusDto.from(updated),
        partyId: updated.partyId,
        paidLines: items.flatMap((item) => (item.code ? [{ code: item.code, quantity: item.quantity }] : [])),
      };
    });
  }

  // Abandons a site's unpaid checkout.
  async cancelUnpaid(data: CancelUnpaidOrderDto, siteId: string): Promise<OrderPaymentStatusDto> {
    const { orderId, reason, paymentIntentId } = data;
    return this.repository.transaction(async () => {
      const order = await this.repository.findByIdForUpdate(orderId, siteId);
      if (!order) throw new NotFoundException('Order not found.');
      if (paymentIntentId && order.paymentIntentId && order.paymentIntentId !== paymentIntentId) {
        this.logger.warn(
          `cancelUnpaid skipped — order ${order.orderNumber} is bound to intent ${order.paymentIntentId}, not ${paymentIntentId}`,
        );
        return OrderPaymentStatusDto.from(order);
      }
      if (order.status !== OrderStatusValues.AWAITING_PAYMENT) return OrderPaymentStatusDto.from(order);

      const updated = await this.repository.update(order.id, {
        status: OrderStatusValues.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      });
      this.logger.log(`Unpaid checkout ${updated.orderNumber} cancelled — ${reason}`);
      return OrderPaymentStatusDto.from(updated);
    });
  }

  // The fields that turn a cancelled order back into a live one flagged for staff review
  private reopenAfterLatePayment(order: Order): Partial<Order> {
    const reason = order.cancellationReason ? ` (was cancelled: ${order.cancellationReason})` : '';
    const reviewNote = `Paid after cancellation${reason} — review.`;
    return {
      needsReview: true,
      cancelledAt: null,
      cancellationReason: null,
      notes: order.notes ? `${order.notes}\n${reviewNote}` : reviewNote,
    };
  }

  // Returns order detail with items
  async findById(id: string): Promise<OrderDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Order not found.');

    const itemRows = await this.repository.findItemsByOrderId(id);
    return OrderDetailDto.fromDetail(entity, itemRows.map(OrderItemDto.from));
  }

  // Transitions order to a new status with validation
  async updateStatus(id: string, data: Omit<UpdateOrderStatusDto, 'id'>): Promise<OrderDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Order not found.');

    const allowedNext = OrdersDomainService.STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowedNext.includes(data.status)) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${data.status}.`);
    }

    const updatePayload: Record<string, unknown> = {
      status: data.status as OrderStatus,
    };

    // Set the appropriate timestamp based on the new status
    const now = new Date();
    if (data.status === OrderStatusValues.ACCEPTED) {
      updatePayload.confirmedAt = now;
    } else if (data.status === OrderStatusValues.READY) {
      updatePayload.readyAt = now;
    } else if (data.status === OrderStatusValues.COMPLETED) {
      updatePayload.completedAt = now;
      // TODO: Create RECEIVABLE invoice when invoice module integration is ready
    } else if (data.status === OrderStatusValues.CANCELLED) {
      updatePayload.cancelledAt = now;
      updatePayload.cancellationReason = data.cancellationReason ?? null;
    }

    const entity = await this.repository.update(id, updatePayload);
    this.logger.log(`Updated order status: ${entity.orderNumber} -> ${data.status}`);
    return OrderDto.from(entity);
  }

  // Builds denormalized order item rows using the variant's own price
  private async buildOrderItems(items: CreateOrderItemDto[]): Promise<{
    itemRows: {
      offeringId: string;
      offeringVariantId: string;
      name: string;
      quantity: number;
      unitPrice: bigint;
      taxRate: Decimal;
      taxAmount: Decimal;
      subtotal: Decimal;
      total: Decimal;
      notes: string | null;
    }[];
    subtotal: Decimal;
    taxAmount: Decimal;
  }> {
    const itemRows: {
      offeringId: string;
      offeringVariantId: string;
      name: string;
      quantity: number;
      unitPrice: bigint;
      taxRate: Decimal;
      taxAmount: Decimal;
      subtotal: Decimal;
      total: Decimal;
      notes: string | null;
    }[] = [];
    let orderSubtotal = new Decimal(0);
    let orderTaxAmount = new Decimal(0);

    for (const item of items) {
      const variant = await this.repository.findVariantWithOffering(item.offeringVariantId);
      if (!variant) {
        throw new NotFoundException(`Variant ${item.offeringVariantId} not found.`);
      }

      const taxRate = new Decimal(await this.repository.getEffectiveTaxRate(variant.taxClassId));
      // TODO(pricing): offering_variants.price was removed with the catalog teardown — a variant's
      const unitPrice = new Decimal(0);

      const lineSubtotal = unitPrice.times(item.quantity);
      const lineTax = lineSubtotal.times(taxRate).dividedBy(100);
      const lineTotal = lineSubtotal.plus(lineTax);

      itemRows.push({
        offeringId: variant.offeringId,
        offeringVariantId: item.offeringVariantId,
        name: variantLabel(variant.offeringName, variant.dimensions),
        quantity: item.quantity,
        unitPrice: 0n,
        taxRate,
        taxAmount: lineTax,
        subtotal: lineSubtotal,
        total: lineTotal,
        notes: item.notes ?? null,
      });

      orderSubtotal = orderSubtotal.plus(lineSubtotal);
      orderTaxAmount = orderTaxAmount.plus(lineTax);
    }

    return { itemRows, subtotal: orderSubtotal, taxAmount: orderTaxAmount };
  }
}

function toMinorBigInt(value: Decimal): bigint {
  return BigInt(value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
}
