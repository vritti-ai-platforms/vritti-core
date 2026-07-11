import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { InventoryItem, InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/db/schema';

export class InventoryItemDto {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  pickStrategy: InventoryPickStrategy;
  categoryId: string;
  categoryName: string | null;
  purchaseTaxGroupName: string | null;
  mrpUomSymbol: string | null;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  purchaseTaxGroupId: string | null;
  hsnCode: string | null;
  hasMrp: boolean;
  mrpUomId: string | null;
  defaultMrp: CurrencyAmountDto | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: InventoryItem & { purchaseTaxGroupName?: string | null; mrpUomSymbol?: string | null },
    uomSymbol?: string | null,
    canDelete = true,
    categoryName?: string | null,
    siteCurrencyCode?: string,
  ): InventoryItemDto {
    const dto = new InventoryItemDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.type = entity.type;
    dto.tracking = entity.tracking;
    dto.pickStrategy = entity.pickStrategy;
    dto.categoryId = entity.categoryId;
    dto.categoryName = categoryName ?? null;
    dto.description = entity.description ?? null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? null;
    dto.purchaseTaxGroupId = entity.purchaseTaxGroupId ?? null;
    dto.purchaseTaxGroupName = entity.purchaseTaxGroupName ?? null;
    dto.mrpUomSymbol = entity.mrpUomSymbol ?? null;
    dto.hsnCode = entity.hsnCode ?? null;
    dto.hasMrp = entity.hasMrp;
    dto.mrpUomId = entity.mrpUomId ?? null;
    dto.defaultMrp =
      entity.hasMrp && siteCurrencyCode ? CurrencyAmountDto.from(entity.defaultMrp, siteCurrencyCode) : null;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
