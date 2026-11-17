import type { SupplierItemPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { SupplierItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import type { AddSupplierSiteItemPriceDto } from '@domain/supplier-item-prices/dto/request/add-supplier-site-item-price.dto';
import type { UpdateSupplierSiteItemPriceDto } from '@domain/supplier-item-prices/dto/request/update-supplier-site-item-price.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { Injectable } from '@nestjs/common';
import type { FilterCondition } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LeSupplierSiteItemPricesService } from '@/modules/legal-entity/suppliers/site-items/prices/services/supplier-site-item-prices.service';

@Injectable()
export class SiteSupplierSiteItemPricesService {
  constructor(
    private readonly pricesService: SupplierItemPricesDomainService,
    private readonly legalEntityPrices: LeSupplierSiteItemPricesService,
  ) {}

  // Adds a price row for the caller's site, setting the item up there first when it is not yet
  addPrice(dto: AddSupplierSiteItemPriceDto, siteId: string): Promise<CreateResponseDto<SupplierItemPriceDto[]>> {
    return this.legalEntityPrices.addPrice(dto, [siteId]);
  }

  // Updates a price row of the caller's site; RLS hides other sites' rows, and the legal entity's prices it only reads
  updatePrice(dto: UpdateSupplierSiteItemPriceDto): Promise<SuccessResponseDto> {
    return this.pricesService.updatePrice(dto);
  }

  // Returns a supplier item's price timeline for the caller's site
  findPricesForTable(
    supplierItemId: string,
    state: TableState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    return this.pricesService.findPricesForTable(supplierItemId, state);
  }

  // Returns the caller site's price windows for a supplier item — its own and the legal entity's — ignoring a sites pick,
  // which only the legal entity makes
  findPriceHistory(supplierItemId: string, context: FilterCondition[]): Promise<SupplierItemPriceHistoryDto> {
    return this.pricesService.findPriceHistory(
      supplierItemId,
      context.filter((condition) => condition.field !== 'sites'),
    );
  }

  // Deletes a future price row of the caller's site; RLS hides other sites' rows, and the legal entity's prices it only
  // reads
  deletePrice(id: string): Promise<SuccessResponseDto> {
    return this.pricesService.deletePrice(id);
  }
}
