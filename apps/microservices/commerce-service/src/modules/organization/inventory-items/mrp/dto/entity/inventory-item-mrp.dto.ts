import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { InventoryItemMrp } from '@/db/schema';

export class InventoryItemMrpDto {
  id: string;
  inventoryItemId: string;
  amount: CurrencyAmountDto;
  sourceLotId: string | null;
  sourcedAt: string | null;
  createdAt: string;
  updatedAt: string;

  static from(entity: InventoryItemMrp): InventoryItemMrpDto {
    const dto = new InventoryItemMrpDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.amount = CurrencyAmountDto.from(entity.amount, entity.currencyCode);
    dto.sourceLotId = entity.sourceLotId ?? null;
    dto.sourcedAt = entity.sourcedAt ? entity.sourcedAt.toISOString() : null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
