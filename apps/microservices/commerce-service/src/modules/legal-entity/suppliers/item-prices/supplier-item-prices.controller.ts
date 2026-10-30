import type { SupplierItemPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { SupplierItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { AddLeSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/add-le-supplier-item-price.dto';
import { UpdateSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/update-supplier-item-price.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SupplierItemPricesController {
  private readonly logger = new Logger(SupplierItemPricesController.name);

  constructor(private readonly service: SupplierItemPricesDomainService) {}

  // Returns the paginated price timeline of a supplier item — every site's rows, or one site's when given
  @MessagePattern({ cmd: 'le.suppliers.itemPricesTable' })
  itemPricesTable(
    @Payload() data: { supplierItemId: string; siteId?: string } & TableViewState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    const { supplierItemId, siteId, ...state } = data;
    this.logger.log(`suppliers.itemPricesTable — supplierItemId: ${supplierItemId}, siteId: ${siteId ?? 'all'}`);
    return this.service.findPricesForTable(supplierItemId, siteId ?? null, state);
  }

  // Returns every price window of a supplier item grouped by site, optionally narrowed to sites and a date range
  @MessagePattern({ cmd: 'le.suppliers.itemPriceHistory' })
  itemPriceHistory(
    @Payload() data: { supplierItemId: string; siteIds?: string[]; from?: string; to?: string },
  ): Promise<SupplierItemPriceHistoryDto> {
    const { supplierItemId, ...options } = data;
    this.logger.log(`suppliers.itemPriceHistory — supplierItemId: ${supplierItemId}`);
    return this.service.findPriceHistory(supplierItemId, options);
  }

  // Adds a validity-dated price to a supplier item's timeline
  @MessagePattern({ cmd: 'le.suppliers.addItemPrice' })
  addItemPrice(
    @Payload() dto: AddLeSupplierItemPriceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierItemPriceDto[]>> {
    this.logger.log(`suppliers.addItemPrice — supplierItemId: ${dto.supplierItemId}, validFrom: ${dto.validFrom}`);
    const { siteIds, ...price } = dto;
    return this.service.addPrice(price, siteIds, headers.userId || null);
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
