import type { SupplierItemPriceDto } from '@domain/supplier-items/dto/entity/supplier-item-price.dto';
import { AddSupplierItemPriceDto } from '@domain/supplier-items/dto/request/add-supplier-item-price.dto';
import { UpdateSupplierItemPriceDto } from '@domain/supplier-items/dto/request/update-supplier-item-price.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class SupplierItemPricesController {
  private readonly logger = new Logger(SupplierItemPricesController.name);

  constructor(private readonly service: SupplierItemsDomainService) {}

  // Returns the paginated price timeline of a supplier item
  @MessagePattern({ cmd: 'le.suppliers.itemPricesTable' })
  itemPricesTable(
    @Payload() data: { supplierItemId: string } & TableViewState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    const { supplierItemId, ...state } = data;
    this.logger.log(`suppliers.itemPricesTable — supplierItemId: ${supplierItemId}`);
    return this.service.findPricesForTable(supplierItemId, state);
  }

  // Adds a validity-dated price to a supplier item's timeline
  @MessagePattern({ cmd: 'le.suppliers.addItemPrice' })
  addItemPrice(@Payload() dto: AddSupplierItemPriceDto): Promise<CreateResponseDto<SupplierItemPriceDto>> {
    this.logger.log(`suppliers.addItemPrice — supplierItemId: ${dto.supplierItemId}, validFrom: ${dto.validFrom}`);
    return this.service.addPrice(dto);
  }

  // Updates a price row's amount, scheme, or end date
  @MessagePattern({ cmd: 'le.suppliers.updateItemPrice' })
  updateItemPrice(@Payload() dto: UpdateSupplierItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.updateItemPrice — id: ${dto.id}`);
    return this.service.updatePrice(dto);
  }

  // Deletes a price row from a supplier item's timeline
  @MessagePattern({ cmd: 'le.suppliers.deleteItemPrice' })
  deleteItemPrice(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.deleteItemPrice — id: ${data.id}`);
    return this.service.deletePrice(data.id);
  }
}
