import type { InventoryItemLedgerDto } from '@domain/inventory-item-ledger/dto/entity/inventory-item-ledger.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type InventoryItemLedgerDisplayDto = Record<'quantity', DisplayUomQuantityDto | null>;

export type InventoryItemLedgerWithDisplayDto = Omit<InventoryItemLedgerDto, 'displayUnitRatios'> & {
  display: InventoryItemLedgerDisplayDto;
};
