import type { AddSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/add-supplier-item-price.dto';
import type { SupplierItemPriceHistoryQueryDto } from '@commerce/supplier-item-prices/dto/request/supplier-item-price-history-query.dto';
import type { UpdateSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/update-supplier-item-price.dto';
import type { SupplierItemPriceHistoryResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import type { SupplierItemPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-response.dto';
import type { SupplierItemPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SupplierItemPricesGatewayService {
  private readonly logger = new Logger(SupplierItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns the price timeline of a supplier item for the table — every site's rows, or one site's when given
  async findItemPricesTable(
    supplierItemId: string,
    siteId: string | undefined,
    userId: string,
    orgId: string,
  ): Promise<SupplierItemPriceTableResponseDto> {
    this.logger.log(`le.suppliers.itemPricesTable — supplierItemId: ${supplierItemId}, siteId: ${siteId ?? 'all'}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      siteId
        ? `commerce-le-supplier-item-${supplierItemId}-site-${siteId}-prices`
        : `commerce-supplier-item-${supplierItemId}-prices`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierItemPriceResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.itemPricesTable',
      { supplierItemId, siteId, ...state },
    );

    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns every price window of a supplier item grouped by site, with site names
  async findItemPriceHistory(
    supplierItemId: string,
    query: SupplierItemPriceHistoryQueryDto,
    orgId: string,
  ): Promise<SupplierItemPriceHistoryResponseDto> {
    this.logger.log(`le.suppliers.itemPriceHistory — supplierItemId: ${supplierItemId}`);
    const history = await this.nats.send<SupplierItemPriceHistoryResponseDto>(
      'commerce',
      'le.suppliers.itemPriceHistory',
      {
        supplierItemId,
        ...query,
      },
    );
    return { ...history, sites: await this.ownerNames.withSiteNames(orgId, history.sites) };
  }

  // Adds a price record to a supplier item's timeline
  async addItemPrice(
    supplierItemId: string,
    dto: AddSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SupplierItemPriceResponseDto[]>> {
    this.logger.log(`le.suppliers.addItemPrice — supplierItemId: ${supplierItemId}, validFrom: ${dto.validFrom}`);
    return this.nats.send('commerce', 'le.suppliers.addItemPrice', { supplierItemId, ...dto });
  }

  // Updates a supplier item price record
  async updateItemPrice(priceId: string, dto: UpdateSupplierItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.updateItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'le.suppliers.updateItemPrice', { id: priceId, ...dto });
  }

  // Deletes a supplier item price record
  async deleteItemPrice(priceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.deleteItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'le.suppliers.deleteItemPrice', { id: priceId });
  }
}
