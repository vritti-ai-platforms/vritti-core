import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { eq, ilike } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemQuantItems, QuantItemStatusValues } from '@/db/schema';
import { InventoryItemQuantItemsRepository } from '../repositories/inventory-item-quant-items.repository';

@Injectable()
export class InventoryItemQuantItemsService {
  private readonly logger = new Logger(InventoryItemQuantItemsService.name);

  constructor(private readonly repository: InventoryItemQuantItemsRepository) {}

  // Returns paginated AVAILABLE quant items (physical units) for a given quant
  async findForSelect(query: SelectOptionsQueryDto & { quantId: string }): Promise<SelectQueryResult> {
    if (!query.quantId) throw new BadRequestException('quantId is required.');
    const search = query.search?.trim();
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'serialNumber',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      values: query.values,
      excludeIds: query.excludeIds,
      limit: query.limit,
      offset: query.offset,
      orderByKey: query.orderByKey || 'createdAt',
      orderDirection: query.orderDirection || 'asc',
      where: { inventoryItemQuantId: query.quantId },
      conditions: [
        eq(inventoryItemQuantItems.status, QuantItemStatusValues.AVAILABLE),
        ...(search ? [ilike(inventoryItemQuantItems.serialNumber, `%${search}%`)] : []),
      ],
    });
  }
}
