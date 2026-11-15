import { Injectable } from '@nestjs/common';
import { eq, ilike } from '@vritti/api-sdk/drizzle-orm';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import { inventoryItemSerials, SerialStatusValues } from '@/db/schema';
import { InventoryItemSerialsDomainRepository } from '../repositories/inventory-item-serials.repository';

@Injectable()
export class InventoryItemSerialsDomainService {
  constructor(private readonly repository: InventoryItemSerialsDomainRepository) {}

  // Returns paginated AVAILABLE serials, optionally filtered to a specific inventory quant
  async findForSelect(query: SelectOptionsQueryDto & { quantId?: string }): Promise<SelectQueryResult> {
    const search = query.search?.trim();
    return this.repository.findForSelect({
      ...selectPageOptions(query),
      search: undefined,
      value: query.valueKey || 'id',
      label: query.labelKey || 'serialNumber',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
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
