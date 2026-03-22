import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { OrderItemStatus, OrderSource, OrderStatus } from '@/db/schema';
import { OrderItemDto } from '../dto/entity/order-item.dto';
import { OrderDto } from '../dto/entity/order.dto';
import type { AddOrderItemsDto } from '../dto/request/add-order-items.dto';
import type { CreateOrderDto } from '../dto/request/create-order.dto';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { OrderRepository } from '../repositories/order.repository';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  // Creates an order with items in a single transaction
  async create(dto: CreateOrderDto): Promise<OrderDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item.');
    }

    const orderNumber = await this.orderRepository.generateOrderNumber(dto.organizationId, dto.businessUnitId);

    // Calculate totals from items
    let subtotal = 0;
    for (const item of dto.items) {
      subtotal += item.quantity * item.unitPrice;
    }

    const result = await this.orderRepository.transaction(async (tx) => {
      const order = await this.orderRepository.createInTx(
        {
          organizationId: dto.organizationId,
          businessUnitId: dto.businessUnitId,
          orderNumber,
          source: dto.source as OrderSource,
          status: 'PENDING' as OrderStatus,
          customerPhone: dto.customerPhone ?? null,
          notes: dto.notes ?? null,
          paymentMethod: dto.paymentMethod as 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'UNPAID',
          subtotal: String(subtotal),
          tax: '0',
          discount: '0',
          total: String(subtotal),
        },
        tx,
      );

      // Build order items — items with stationId get kotNumber=1 and PENDING status
      const itemInserts = dto.items.map((item) => ({
        orderId: order.id,
        productId: item.productId ?? null,
        name: item.name,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        total: String(item.quantity * item.unitPrice),
        notes: item.notes ?? null,
        stationId: item.stationId ?? null,
        kotNumber: item.stationId ? 1 : null,
        status: (item.stationId ? 'PENDING' : 'SERVED') as OrderItemStatus,
      }));

      const items = await this.orderItemRepository.createManyInTx(itemInserts, tx);
      return { order, items };
    });

    const itemDtos = result.items.map(OrderItemDto.from);
    this.logger.log(`Created order ${orderNumber} (${result.order.id}) with ${dto.items.length} items`);
    return OrderDto.from(result.order, itemDtos);
  }

  // Returns orders for an org+bu with optional filters
  async findAll(
    orgId: string,
    buId: string,
    filters?: { status?: string; source?: string },
  ): Promise<OrderDto[]> {
    const orders = await this.orderRepository.findByOrgAndBu(orgId, buId, {
      status: filters?.status as OrderStatus | undefined,
      source: filters?.source as OrderSource | undefined,
    });
    return orders.map((order) => OrderDto.from(order));
  }

  // Returns a single order with its items
  async findById(id: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found.');

    const items = await this.orderItemRepository.findByOrderId(id);
    const itemDtos = items.map(OrderItemDto.from);
    return OrderDto.from(order, itemDtos);
  }

  // Updates the order status
  async updateStatus(id: string, status: string): Promise<SuccessResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found.');

    await this.orderRepository.update(id, {
      status: status as OrderStatus,
      updatedAt: new Date(),
    });

    this.logger.log(`Updated order ${order.orderNumber} status to ${status}`);
    return { success: true, message: 'Order status updated successfully.' };
  }

  // Adds new items to an existing order with incremented KOT numbers
  async addItems(dto: AddOrderItemsDto): Promise<SuccessResponseDto> {
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found.');

    const maxKot = await this.orderItemRepository.getMaxKotNumber(dto.orderId);
    const newKotNumber = maxKot + 1;

    const itemInserts = dto.items.map((item) => ({
      orderId: dto.orderId,
      productId: item.productId ?? null,
      name: item.name,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      total: String(item.quantity * item.unitPrice),
      notes: item.notes ?? null,
      stationId: item.stationId ?? null,
      kotNumber: item.stationId ? newKotNumber : null,
      status: (item.stationId ? 'PENDING' : 'SERVED') as OrderItemStatus,
    }));

    await this.orderItemRepository.createManyInTx(itemInserts);

    // Recalculate order subtotal and total
    const allItems = await this.orderItemRepository.findByOrderId(dto.orderId);
    let subtotal = 0;
    for (const item of allItems) {
      subtotal += Number(item.total);
    }

    await this.orderRepository.update(dto.orderId, {
      subtotal: String(subtotal),
      total: String(subtotal - Number(order.discount) + Number(order.tax)),
      updatedAt: new Date(),
    });

    this.logger.log(`Added ${dto.items.length} items to order ${order.orderNumber} (KOT #${newKotNumber})`);
    return { success: true, message: 'Items added to order successfully.' };
  }

  // Updates a single order item's status and auto-promotes order to READY when all items are ready
  async updateItemStatus(itemId: string, status: string): Promise<SuccessResponseDto> {
    const item = await this.orderItemRepository.findById(itemId);
    if (!item) throw new NotFoundException('Order item not found.');

    await this.orderItemRepository.update(itemId, {
      status: status as OrderItemStatus,
    });

    // When item is marked READY, check if all items in the order are now READY or beyond
    if (status === 'READY') {
      const pendingCount = await this.orderItemRepository.countNonReadyItems(item.orderId, itemId);
      if (pendingCount === 0) {
        await this.orderRepository.update(item.orderId, {
          status: 'READY' as OrderStatus,
          updatedAt: new Date(),
        });
        this.logger.log(`All items ready — order ${item.orderId} promoted to READY`);
      }
    }

    this.logger.log(`Updated item ${itemId} status to ${status}`);
    return { success: true, message: 'Item status updated successfully.' };
  }
}
