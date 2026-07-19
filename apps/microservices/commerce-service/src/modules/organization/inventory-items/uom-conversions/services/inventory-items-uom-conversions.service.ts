import type { InventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/entity/inventory-item-uom-conversion.dto';
import type { CreateInventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/request/create-inventory-item-uom-conversion.dto';
import type { UpdateInventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/request/update-inventory-item-uom-conversion.dto';
import { InventoryItemUomConversionsDomainService } from '@domain/inventory-item-uom-conversions/services/inventory-item-uom-conversions.service';
import { UomDomainRepository } from '@domain/uom/repositories/uom.repository';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';

@Injectable()
export class InventoryItemsUomConversionsService {
  constructor(
    private readonly conversionsService: InventoryItemUomConversionsDomainService,
    private readonly uomRepository: UomDomainRepository,
  ) {}

  // Returns paginated UOM conversion overrides for an inventory item
  findForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemUomConversionDto[]; count: number }> {
    return this.conversionsService.findForTable(inventoryItemId, state);
  }

  // Creates a per-item UOM conversion override, resolving the UOM's base unit
  async create(data: CreateInventoryItemUomConversionDto): Promise<CreateResponseDto<InventoryItemUomConversionDto>> {
    const { inventoryItemId, ...dto } = data;
    const uomEntity = await this.uomRepository.findById(dto.uomId);
    if (!uomEntity) throw new NotFoundException('Unit of measure not found.');
    return this.conversionsService.create(inventoryItemId, dto, {
      baseUnitId: uomEntity.baseUnitId,
      name: uomEntity.name,
      symbol: uomEntity.symbol,
    });
  }

  // Updates the conversion factor of an existing UOM override
  update(data: UpdateInventoryItemUomConversionDto): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    return this.conversionsService.update(id, dto);
  }

  // Deletes a UOM conversion override
  delete(id: string): Promise<SuccessResponseDto> {
    return this.conversionsService.delete(id);
  }
}
