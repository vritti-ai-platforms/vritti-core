import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk';
import type { AddSupplierItemDto } from '../dto/request/add-supplier-item.dto';
import type { UpdateSupplierItemDto } from '../dto/request/update-supplier-item.dto';

// Top-level service used by the items sub-controller for the two write paths that
// need cross-domain validation: a supplier_item's UOM must be in the inventory
// item's allowed-UOM set (primary + per-item conversions + globally-derived family).
@Injectable()
export class SuppliersItemsService {
  private readonly logger = new Logger(SuppliersItemsService.name);

  constructor(
    private readonly supplierItemsService: SupplierItemsService,
    private readonly inventoryItemsService: InventoryItemsService,
  ) {}

  async addItem(supplierId: string, dto: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    this.logger.log(`addItem — supplierId=${supplierId}, itemId=${dto.inventoryItemId}, uomId=${dto.uomId}`);
    await this.assertUomAllowed(dto.inventoryItemId, dto.uomId);
    return this.supplierItemsService.addItem(supplierId, dto);
  }

  async updateItem(
    supplierId: string,
    supplierItemId: string,
    dto: UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`updateItem — supplierItemId=${supplierItemId}${dto.uomId ? `, uomId=${dto.uomId}` : ''}`);
    if (dto.uomId !== undefined) {
      const inventoryItemId = await this.supplierItemsService.findInventoryItemIdFor(supplierItemId);
      if (!inventoryItemId) throw new NotFoundException('Supplier item not found.');
      await this.assertUomAllowed(inventoryItemId, dto.uomId);
    }
    return this.supplierItemsService.updateItem(supplierId, supplierItemId, dto);
  }

  private async assertUomAllowed(inventoryItemId: string, uomId: string): Promise<void> {
    const allowed = await this.inventoryItemsService.findAllowedUomIds(inventoryItemId);
    if (!allowed.includes(uomId)) {
      this.logger.warn(`assertUomAllowed rejected — itemId=${inventoryItemId}, uomId=${uomId}`);
      throw new BadRequestException({
        label: 'Invalid UOM',
        detail:
          "The selected unit of measure is not in this item's allowed UOM set. Define a per-item conversion first.",
      });
    }
  }
}
