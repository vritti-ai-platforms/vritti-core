import { InventoryItemSiteDto } from '@domain/inventory-item-sites/dto/entity/inventory-item-site.dto';
import type { BlockSiteItemDto } from '@domain/inventory-item-sites/dto/request/block-site-item.dto';
import type { ReplenishmentDto } from '@domain/inventory-item-sites/dto/request/replenishment.dto';
import type { SetSupplierItemsRequiredDto } from '@domain/inventory-item-sites/dto/request/set-supplier-items-required.dto';
import type { SiteItemRefDto } from '@domain/inventory-item-sites/dto/request/site-item-ref.dto';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { TableFilters } from '@vritti/api-sdk/data-table';
import _ from '@vritti/api-sdk/lodash';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_STOCK_QUANTITY_KEYS } from '@/modules/site/inventory-items/root/dto/entity/site-stock-display.dto';
import type { ItemStockBySiteViewDto } from '../dto/entity/item-stock-by-site-view.dto';

@Injectable()
export class LeInventoryItemSitesService {
  constructor(
    private readonly siteItemsService: InventoryItemSitesDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Adds the item to one of the legal entity's sites with how it is replenished there
  async create(dto: ReplenishmentDto): Promise<CreateResponseDto<InventoryItemSiteDto>> {
    const entity = await this.siteItemsService.create(dto);
    return { success: true, message: 'Item added to the site.', data: InventoryItemSiteDto.from(entity) };
  }

  // Changes how one of the legal entity's sites replenishes the item
  update(dto: ReplenishmentDto): Promise<SuccessResponseDto> {
    return this.siteItemsService.update(dto);
  }

  // Stops one of the legal entity's sites buying the item, with why
  block(dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    return this.siteItemsService.block(dto);
  }

  // Lets one of the legal entity's sites buy the item again
  unblock(dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    return this.siteItemsService.unblock(dto);
  }

  // Ties buying the item at one of the legal entity's sites to the supplier's item set up there, or frees it
  setSupplierItemsRequired(dto: SetSupplierItemsRequiredDto): Promise<SuccessResponseDto> {
    return this.siteItemsService.setSupplierItemsRequired(dto);
  }

  // The legal entity's sites that carry the item, with the stock each holds by location and whether each passes the
  // table's status filter, each primary-unit quantity also expressed in the item's display unit
  async findStockBySite(
    inventoryItemId: string,
    filters: TableFilters,
    leCurrencyCode: CurrencyCode,
  ): Promise<ItemStockBySiteViewDto> {
    const { rows, sitesNotCarryingMatch } = await this.siteItemsService.findStockBySite(
      inventoryItemId,
      filters,
      leCurrencyCode,
    );
    return {
      rows: rows.map(({ displayUnitRatios, ...row }) => ({
        ...row,
        display: this.uomConversionsService.toDisplayUomQuantities(
          _.pick(row, SITE_STOCK_QUANTITY_KEYS),
          displayUnitRatios,
        ),
      })),
      sitesNotCarryingMatch,
    };
  }

  // The legal entity's sites that already carry the item
  findSiteIds(inventoryItemId: string): Promise<string[]> {
    return this.siteItemsService.findSiteIdsForItem(inventoryItemId);
  }

  // Removes the item from one of the legal entity's sites
  delete(dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    return this.siteItemsService.delete(dto);
  }
}
