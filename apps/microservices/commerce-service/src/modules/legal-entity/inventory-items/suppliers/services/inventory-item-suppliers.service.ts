import type { AddSupplierItemDto } from '@domain/supplier-items/dto/request/add-supplier-item.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { InventoryItemSupplierDto, SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { SuppliersItemsService } from '@/modules/legal-entity/suppliers/items/services/suppliers-items.service';

@Injectable()
export class LeInventoryItemSuppliersService {
  private readonly logger = new Logger(LeInventoryItemSuppliersService.name);

  constructor(
    private readonly suppliersItemsService: SuppliersItemsService,
    private readonly supplierItemsService: SupplierItemsDomainService,
  ) {}

  // Sets the item up as one of a supplier's items — the same checks as adding it from the supplier: a unit the item
  // allows, not already linked in that unit, and only sites the supplier is enrolled at
  create(dto: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    const { supplierId, ...itemData } = dto;
    this.logger.log(`create — inventoryItemId=${dto.inventoryItemId}, supplierId=${supplierId}`);
    return this.suppliersItemsService.addItem(supplierId, itemData);
  }

  // The legal entity's suppliers carrying the item, narrowed to one site's when the table's context picks one
  findForTable(
    inventoryItemId: string,
    state: TableState,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    return this.supplierItemsService.findSuppliersForItemAtContextSite(inventoryItemId, state);
  }
}
