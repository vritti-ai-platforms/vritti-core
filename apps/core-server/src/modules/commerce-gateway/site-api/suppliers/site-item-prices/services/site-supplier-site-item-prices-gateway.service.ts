import type { AddSupplierSiteItemPriceDto } from '@commerce/supplier-item-prices/dto/request/add-supplier-site-item-price.dto';
import type { UpdateSupplierSiteItemPriceDto } from '@commerce/supplier-item-prices/dto/request/update-supplier-site-item-price.dto';
import type { SupplierItemPriceHistoryResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import type { SupplierSiteItemPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-site-item-price-response.dto';
import type { SupplierSiteItemPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-site-item-price-table-response.dto';
import { withDefaultPeriod } from '@commerce/supplier-item-prices/price-period';
import { Injectable, Logger } from '@nestjs/common';
import { ContextStateService } from '@vritti/api-sdk/context-state';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SiteSupplierSiteItemPricesGatewayService {
  private readonly logger = new Logger(SiteSupplierSiteItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
    private readonly contextStateService: ContextStateService,
  ) {}

  // Returns the price timeline visible to this site for a supplier item — its own prices and the legal entity's — each
  // named by the site or legal entity that owns it
  async findPricesTable(
    supplierItemId: string,
    userId: string,
    orgId: string,
  ): Promise<SupplierSiteItemPriceTableResponseDto> {
    this.logger.log(`site.suppliers.siteItems.prices.table — supplierItemId: ${supplierItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-supplier-item-${supplierItemId}-prices`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierSiteItemPriceResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.siteItems.prices.table',
      { supplierItemId, ...state },
    );

    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // Adds a site-specific price record to a supplier item's timeline
  async createPrice(
    supplierItemId: string,
    dto: AddSupplierSiteItemPriceDto,
  ): Promise<CreateResponseDto<SupplierSiteItemPriceResponseDto[]>> {
    this.logger.log(
      `site.suppliers.siteItems.prices.create — supplierItemId: ${supplierItemId}, validFrom: ${dto.validFrom}`,
    );
    return this.nats.send('commerce', 'site.suppliers.siteItems.prices.create', { supplierItemId, ...dto });
  }

  // Updates a site-specific supplier item price record
  async updatePrice(priceId: string, dto: UpdateSupplierSiteItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.siteItems.prices.update — id: ${priceId}`);
    return this.nats.send('commerce', 'site.suppliers.siteItems.prices.update', { id: priceId, ...dto });
  }

  // This site's price windows for a supplier item — its own and the legal entity's — in one currency, at the history's
  // saved context
  async findPriceHistory(supplierItemId: string, userId: string): Promise<SupplierItemPriceHistoryResponseDto> {
    this.logger.log(`site.suppliers.siteItems.prices.priceHistory — supplierItemId: ${supplierItemId}`);
    const context = await this.contextStateService.getContextState(
      userId,
      `commerce-site-supplier-item-${supplierItemId}-price-history`,
    );
    return this.nats.send<SupplierItemPriceHistoryResponseDto>(
      'commerce',
      'site.suppliers.siteItems.prices.priceHistory',
      { supplierItemId, context: withDefaultPeriod(context) },
    );
  }

  // Deletes a site-specific supplier item price record
  async deletePrice(priceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.siteItems.prices.delete — id: ${priceId}`);
    return this.nats.send('commerce', 'site.suppliers.siteItems.prices.delete', { id: priceId });
  }
}
