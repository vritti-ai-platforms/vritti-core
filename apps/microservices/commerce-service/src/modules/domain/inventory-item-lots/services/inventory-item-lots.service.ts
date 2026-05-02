import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import { ilike } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemLot, inventoryItemLots } from '@/db/schema';
import { InventoryItemLotsRepository } from '../repositories/inventory-item-lots.repository';

@Injectable()
export class InventoryItemLotsService {
  private readonly logger = new Logger(InventoryItemLotsService.name);

  constructor(private readonly repository: InventoryItemLotsRepository) {}

  // Returns existing lot or creates a new one. Lot identity is (orgId, itemId, lotNumber).
  async findOrCreateLot(params: {
    inventoryItemId: string;
    lotNumber: string;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
  }): Promise<InventoryItemLot> {
    const existing = await this.repository.findByItemAndNumber(params.inventoryItemId, params.lotNumber);
    if (existing) return existing;

    return this.repository.createLot({
      inventoryItemId: params.inventoryItemId,
      lotNumber: params.lotNumber,
      manufacturingDate: params.manufacturingDate ?? null,
      expiryDate: params.expiryDate ?? null,
    });
  }

  // Returns paginated lot options for the select component
  async findForSelect(query: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    if (!query.inventoryItemId) throw new BadRequestException('inventoryItemId is required.');
    const search = query.search?.trim();
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'lotNumber',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      values: query.values,
      excludeIds: query.excludeIds,
      limit: query.limit,
      offset: query.offset,
      orderByKey: query.orderByKey || 'createdAt',
      orderDirection: query.orderDirection || 'desc',
      where: { inventoryItemId: query.inventoryItemId },
      conditions: search ? [ilike(inventoryItemLots.lotNumber, `%${search}%`)] : undefined,
    });
  }
}
