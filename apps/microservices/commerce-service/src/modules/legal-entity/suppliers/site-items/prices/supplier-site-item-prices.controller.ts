import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { SupplierItemPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { SupplierItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { AddLeSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/add-le-supplier-item-price.dto';
import { UpdateSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/update-supplier-item-price.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SupplierSiteItemPricesController {
  private readonly logger = new Logger(SupplierSiteItemPricesController.name);

  constructor(
    private readonly service: SupplierItemPricesDomainService,
    private readonly enrollments: SupplierEnrollmentsDomainService,
  ) {}

  // Returns the paginated price timeline of a supplier item at the site in the table's context
  @MessagePattern({ cmd: 'le.suppliers.siteItems.prices.table' })
  table(
    @Payload() data: { supplierItemId: string } & TableState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    const { supplierItemId, ...state } = data;
    this.logger.log(`le.suppliers.siteItems.prices.table — supplierItemId: ${supplierItemId}`);
    return this.service.findPricesForTable(supplierItemId, state);
  }

  // Returns a supplier item's price windows in one currency, grouped by site, at the history's context — its period and
  // sites (when none are picked, every site the supplier is enrolled at or has prices of its own)
  @MessagePattern({ cmd: 'le.suppliers.siteItems.prices.priceHistory' })
  priceHistory(
    @Payload() data: { supplierItemId: string; context: FilterCondition[] },
  ): Promise<SupplierItemPriceHistoryDto> {
    this.logger.log(`le.suppliers.siteItems.prices.priceHistory — supplierItemId: ${data.supplierItemId}`);
    return this.service.findPriceHistory(data.supplierItemId, data.context, (supplierId) =>
      this.enrollments.findEnrolledSiteIds({ supplierId }),
    );
  }

  // Adds a validity-dated price to a supplier item's timeline
  @MessagePattern({ cmd: 'le.suppliers.siteItems.prices.create' })
  create(
    @Payload() dto: AddLeSupplierItemPriceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierItemPriceDto[]>> {
    this.logger.log(
      `le.suppliers.siteItems.prices.create — supplierItemId: ${dto.supplierItemId}, validFrom: ${dto.validFrom}`,
    );
    const { siteIds, ...price } = dto;
    return this.service.addPrice(price, siteIds, headers.userId || null);
  }

  // Updates a price row's amount, scheme, or end date
  @MessagePattern({ cmd: 'le.suppliers.siteItems.prices.update' })
  update(@Payload() dto: UpdateSupplierItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.prices.update — id: ${dto.id}`);
    return this.service.updatePrice(dto);
  }

  // Deletes a price row from a supplier item's timeline
  @MessagePattern({ cmd: 'le.suppliers.siteItems.prices.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.prices.delete — id: ${data.id}`);
    return this.service.deletePrice(data.id);
  }
}
