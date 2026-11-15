import type { SupplierItemPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { SupplierItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { AddSupplierSiteItemPriceDto } from '@domain/supplier-item-prices/dto/request/add-supplier-site-item-price.dto';
import { UpdateSupplierSiteItemPriceDto } from '@domain/supplier-item-prices/dto/request/update-supplier-site-item-price.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteSupplierSiteItemPricesController {
  private readonly logger = new Logger(SiteSupplierSiteItemPricesController.name);

  constructor(private readonly service: SupplierItemPricesDomainService) {}

  // Adds a price row for the caller's site
  @MessagePattern({ cmd: 'site.suppliers.siteItems.prices.create' })
  create(@Payload() dto: AddSupplierSiteItemPriceDto): Promise<CreateResponseDto<SupplierItemPriceDto[]>> {
    this.logger.log(
      `site.suppliers.siteItems.prices.create — supplierItemId: ${dto.supplierItemId}, validFrom: ${dto.validFrom}`,
    );
    return this.service.addPrice(dto);
  }

  // Updates a price row of the caller's site; RLS hides other sites' rows, and the legal entity's prices it only reads
  @MessagePattern({ cmd: 'site.suppliers.siteItems.prices.update' })
  update(@Payload() dto: UpdateSupplierSiteItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.siteItems.prices.update — id: ${dto.id}`);
    return this.service.updatePrice(dto);
  }

  // Returns a supplier item's price timeline for the caller's site
  @MessagePattern({ cmd: 'site.suppliers.siteItems.prices.table' })
  table(
    @Payload() data: { supplierItemId: string } & TableState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    const { supplierItemId, ...state } = data;
    this.logger.log(`site.suppliers.siteItems.prices.table — supplierItemId: ${supplierItemId}`);
    return this.service.findPricesForTable(supplierItemId, state);
  }

  // Returns the caller site's price windows for a supplier item — its own and the legal entity's — at the history's
  // context
  @MessagePattern({ cmd: 'site.suppliers.siteItems.prices.priceHistory' })
  priceHistory(
    @Payload() data: { supplierItemId: string; context: FilterCondition[] },
  ): Promise<SupplierItemPriceHistoryDto> {
    this.logger.log(`site.suppliers.siteItems.prices.priceHistory — supplierItemId: ${data.supplierItemId}`);
    const context = data.context.filter((condition) => condition.field !== 'sites');
    return this.service.findPriceHistory(data.supplierItemId, context);
  }

  // Deletes a future price row of the caller's site; RLS hides other sites' rows, and the legal entity's prices it only reads
  @MessagePattern({ cmd: 'site.suppliers.siteItems.prices.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.siteItems.prices.delete — id: ${data.id}`);
    return this.service.deletePrice(data.id);
  }
}
