import { Injectable, Logger } from '@nestjs/common';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import { eq, ilike } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemSerials, SerialStatusValues } from '@/db/schema';
import { InventoryItemSerialsRepository } from '../repositories/inventory-item-serials.repository';

@Injectable()
export class InventoryItemSerialsService {
  private readonly logger = new Logger(InventoryItemSerialsService.name);

  constructor(private readonly repository: InventoryItemSerialsRepository) {}

  // Returns paginated AVAILABLE serials, optionally filtered to a specific inventory quant
  async findForSelect(query: SelectOptionsQueryDto & { quantId?: string }): Promise<SelectQueryResult> {
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
      where: query.quantId ? { inventoryItemQuantId: query.quantId } : undefined,
      conditions: [
        eq(inventoryItemSerials.status, SerialStatusValues.AVAILABLE),
        ...(search ? [ilike(inventoryItemSerials.serialNumber, `%${search}%`)] : []),
      ],
    });
  }
}
