import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { KotItemDto } from '../dto/entity/kot-item.dto';
import { OrderItemRepository } from '../../order/repositories/order-item.repository';
import { OrderService } from '../../order/services/order.service';

@Injectable()
export class KotService {
  constructor(
    private readonly orderItemRepository: OrderItemRepository,
    private readonly orderService: OrderService,
  ) {}

  // Finds active KOT items (PENDING/PREPARING) grouped by station for an org+bu
  async findActive(orgId: string, buId: string): Promise<KotItemDto[]> {
    const rows = await this.orderItemRepository.findActiveByStation(orgId, buId);
    return rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      name: row.name,
      quantity: row.quantity,
      notes: row.notes ?? null,
      kotNumber: row.kotNumber,
      status: row.status,
      stationId: row.stationId,
      stationName: row.stationName ?? null,
    }));
  }

  // Updates a KOT item status, delegating to order service for auto-promotion logic
  async updateItemStatus(itemId: string, status: string): Promise<SuccessResponseDto> {
    return this.orderService.updateItemStatus(itemId, status);
  }
}
