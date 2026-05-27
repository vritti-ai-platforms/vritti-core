import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type OrderSource, type OrderStatus, OrderStatusValues, type OrderType, orders } from '@/db/schema';
import type { CreateOrderDto, CreateOrderItemDto } from '@/modules/orders/dto/request/create-order.dto';
import type { UpdateOrderStatusDto } from '@/modules/orders/dto/request/update-order-status.dto';
import { OrderDetailDto, OrderDto, OrderItemDto, OrderItemModifierDto } from '../dto/entity/order.dto';
import { OrdersRepository } from '../repositories/orders.repository';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    orderNumber: { column: orders.orderNumber, type: 'string' },
    status: { column: orders.status, type: 'string' },
    channel: { column: orders.channel, type: 'string' },
    type: { column: orders.type, type: 'string' },
  };

  // Valid status transitions: current status -> allowed next statuses
  private static readonly STATUS_TRANSITIONS: Record<string, string[]> = {
    [OrderStatusValues.PENDING]: [OrderStatusValues.ACCEPTED, OrderStatusValues.CANCELLED],
    [OrderStatusValues.ACCEPTED]: [OrderStatusValues.PREPARING, OrderStatusValues.CANCELLED],
    [OrderStatusValues.PREPARING]: [OrderStatusValues.READY, OrderStatusValues.CANCELLED],
    [OrderStatusValues.READY]: [OrderStatusValues.COMPLETED, OrderStatusValues.CANCELLED],
    [OrderStatusValues.COMPLETED]: [],
    [OrderStatusValues.CANCELLED]: [],
  };

  constructor(private readonly repository: OrdersRepository) {}

  // Returns paginated orders for the data table
  async findForTable(state: TableViewState): Promise<{ result: OrderDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, OrdersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, OrdersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, OrdersService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(orders.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(OrderDto.from), count };
  }

  // Creates a new order with items and modifiers, denormalizing catalog data
  async create(data: CreateOrderDto): Promise<OrderDto> {
    const orderNumber = await this.repository.generateOrderNumber();

    // Build order items with denormalized catalog data
    const { itemRows, modifierRows, subtotal, taxAmount } = await this.buildOrderItems(data.items);

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
    const createdItems = await this.repository.createItems(
      itemRows.map((item) => ({
        orderId: entity.id,
        itemId: item.itemId,
        variantId: item.variantId,
        itemName: item.itemName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate.toNumber(),
        taxAmount: toMinorBigInt(item.taxAmount),
        subtotal: toMinorBigInt(item.subtotal),
        total: toMinorBigInt(item.total),
        notes: item.notes ?? null,
      })),
    );

    // Insert order item modifiers linked to created item IDs
    const allModifiers = modifierRows.flatMap((mods, idx) =>
      mods.map((mod) => ({
        orderItemId: createdItems[idx].id,
        modifierGroupId: mod.modifierGroupId,
        modifierOptionId: mod.modifierOptionId,
        name: mod.name,
        additionalPrice: mod.additionalPrice,
      })),
    );

    if (allModifiers.length > 0) {
      await this.repository.createModifiers(allModifiers);
    }

    this.logger.log(`Created order: ${entity.orderNumber} (${entity.id})`);
    return OrderDto.from(entity);
  }

  // Returns order detail with items and modifiers
  async findById(id: string): Promise<OrderDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Order not found.');

    const itemRows = await this.repository.findItemsByOrderId(id);
    const itemIds = itemRows.map((item) => item.id);
    const modifierRows = await this.repository.findModifiersByOrderItemIds(itemIds);

    // Group modifiers by order item ID
    const modifiersByItem = new Map<string, typeof modifierRows>();
    for (const mod of modifierRows) {
      const existing = modifiersByItem.get(mod.orderItemId) ?? [];
      existing.push(mod);
      modifiersByItem.set(mod.orderItemId, existing);
    }

    const itemDtos = itemRows.map((item) => {
      const mods = (modifiersByItem.get(item.id) ?? []).map(OrderItemModifierDto.from);
      return OrderItemDto.from(item, mods);
    });

    return OrderDetailDto.fromDetail(entity, itemDtos);
  }

  // Transitions order to a new status with validation
  async updateStatus(id: string, data: UpdateOrderStatusDto): Promise<OrderDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Order not found.');

    const allowedNext = OrdersService.STATUS_TRANSITIONS[existing.status] ?? [];
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

  // Builds denormalized order item rows from variant catalog data
  private async buildOrderItems(items: CreateOrderItemDto[]): Promise<{
    itemRows: {
      itemId: string;
      variantId: string;
      itemName: string;
      variantName: string | null;
      quantity: number;
      unitPrice: bigint;
      taxRate: Decimal;
      taxAmount: Decimal;
      subtotal: Decimal;
      total: Decimal;
      notes: string | null;
    }[];
    modifierRows: {
      modifierGroupId: string;
      modifierOptionId: string;
      name: string;
      additionalPrice: bigint;
    }[][];
    subtotal: Decimal;
    taxAmount: Decimal;
  }> {
    const itemRows: {
      itemId: string;
      variantId: string;
      itemName: string;
      variantName: string | null;
      quantity: number;
      unitPrice: bigint;
      taxRate: Decimal;
      taxAmount: Decimal;
      subtotal: Decimal;
      total: Decimal;
      notes: string | null;
    }[] = [];
    const modifierRows: {
      modifierGroupId: string;
      modifierOptionId: string;
      name: string;
      additionalPrice: bigint;
    }[][] = [];
    let orderSubtotal = new Decimal(0);
    let orderTaxAmount = new Decimal(0);

    for (const item of items) {
      const variant = await this.repository.findVariantWithItem(item.variantId);
      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} not found.`);
      }

      const taxRate = new Decimal(await this.repository.getEffectiveTaxRate(variant.taxGroupId));
      const unitPrice = new Decimal(variant.price.toString());

      // Sum modifier additional prices
      const modifierTotal = (item.modifiers ?? []).reduce(
        (sum, m) => sum.plus(new Decimal(m.additionalPrice.toString())),
        new Decimal(0),
      );

      const lineSubtotal = unitPrice.plus(modifierTotal).times(item.quantity);
      const lineTax = lineSubtotal.times(taxRate).dividedBy(100);
      const lineTotal = lineSubtotal.plus(lineTax);

      itemRows.push({
        itemId: variant.itemId,
        variantId: item.variantId,
        itemName: variant.itemName,
        variantName: variant.variantName,
        quantity: item.quantity,
        unitPrice: variant.price,
        taxRate,
        taxAmount: lineTax,
        subtotal: lineSubtotal,
        total: lineTotal,
        notes: item.notes ?? null,
      });

      modifierRows.push(
        (item.modifiers ?? []).map((m) => ({
          modifierGroupId: m.modifierGroupId,
          modifierOptionId: m.modifierOptionId,
          name: m.name,
          additionalPrice: toMinorBigInt(new Decimal(m.additionalPrice)),
        })),
      );

      orderSubtotal = orderSubtotal.plus(lineSubtotal);
      orderTaxAmount = orderTaxAmount.plus(lineTax);
    }

    return { itemRows, modifierRows, subtotal: orderSubtotal, taxAmount: orderTaxAmount };
  }
}

function toMinorBigInt(value: Decimal): bigint {
  return BigInt(value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
}
