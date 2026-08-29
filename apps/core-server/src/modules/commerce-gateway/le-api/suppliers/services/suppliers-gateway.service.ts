import type { AddSupplierItemDto } from '@commerce/suppliers/dto/request/add-supplier-item.dto';
import type { AddSupplierItemPriceDto } from '@commerce/suppliers/dto/request/add-supplier-item-price.dto';
import type { AddSupplierItemSiteDto } from '@commerce/suppliers/dto/request/add-supplier-item-site.dto';
import type { AddSupplierSiteDto } from '@commerce/suppliers/dto/request/add-supplier-site.dto';
import type { BulkSetSupplierItemPreferredDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-preferred.dto';
import type { BulkSetSupplierItemSchemeDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-scheme.dto';
import type { BulkUnlinkSupplierItemsDto } from '@commerce/suppliers/dto/request/bulk-unlink-supplier-items.dto';
import type { ChangeSupplierCurrencyDto } from '@commerce/suppliers/dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '@commerce/suppliers/dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '@commerce/suppliers/dto/request/update-supplier.dto';
import type { UpdateSupplierItemDto } from '@commerce/suppliers/dto/request/update-supplier-item.dto';
import type { UpdateSupplierItemPriceDto } from '@commerce/suppliers/dto/request/update-supplier-item-price.dto';
import type { UpdateSupplierItemSiteDto } from '@commerce/suppliers/dto/request/update-supplier-item-site.dto';
import type { UpdateSupplierSiteDto } from '@commerce/suppliers/dto/request/update-supplier-site.dto';
import type { SupplierItemPriceResponseDto } from '@commerce/suppliers/dto/response/supplier-item-price-response.dto';
import type { SupplierItemPriceTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-price-table-response.dto';
import type { SupplierItemResponseDto } from '@commerce/suppliers/dto/response/supplier-item-response.dto';
import type { SupplierItemSiteResponseDto } from '@commerce/suppliers/dto/response/supplier-item-site-response.dto';
import type { SupplierItemSiteTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-site-table-response.dto';
import type { SupplierItemTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-table-response.dto';
import type { SupplierResponseDto } from '@commerce/suppliers/dto/response/supplier-response.dto';
import type { SupplierSiteResponseDto } from '@commerce/suppliers/dto/response/supplier-site-response.dto';
import type { SupplierSiteTableResponseDto } from '@commerce/suppliers/dto/response/supplier-site-table-response.dto';
import type { SupplierTableResponseDto } from '@commerce/suppliers/dto/response/supplier-table-response.dto';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SuppliersGatewayService {
  private readonly logger = new Logger(SuppliersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

  // Returns paginated, filtered, and sorted suppliers for the data table
  async findForTable(userId: string): Promise<SupplierTableResponseDto> {
    this.logger.log('le.suppliers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-le-suppliers');

    const { result, count } = await this.nats.send<{ result: SupplierResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new supplier
  async create(dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierResponseDto>> {
    this.logger.log(`le.suppliers.create — partyId: ${dto.partyId}, code: ${dto.code}`);
    return this.nats.send('commerce', 'le.suppliers.create', dto);
  }

  // Finds a supplier by ID
  async findById(id: string): Promise<SupplierResponseDto> {
    this.logger.log('le.suppliers.findById');
    return this.nats.send('commerce', 'le.suppliers.findById', { id });
  }

  // Returns linked supplier items for the table
  async findItemsTable(supplierId: string, userId: string): Promise<SupplierItemTableResponseDto> {
    this.logger.log('le.suppliers.itemsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-${supplierId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierItemResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.itemsTable',
      { supplierId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns linked inventory item IDs for a supplier
  async findItemIds(supplierId: string): Promise<string[]> {
    this.logger.log('le.suppliers.itemIds');
    return this.nats.send('commerce', 'le.suppliers.itemIds', { supplierId });
  }

  // Updates a supplier by ID
  async update(id: string, dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.update');
    return this.nats.send('commerce', 'le.suppliers.update', { id, ...dto });
  }

  // Deletes a supplier by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.delete');
    return this.nats.send('commerce', 'le.suppliers.delete', { id });
  }

  // Changes supplier currency and reprices all supplier items
  async changeCurrency(id: string, dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.changeCurrency — id: ${id}, currency: ${dto.currencyCode}`);
    return this.nats.send('commerce', 'le.suppliers.changeCurrency', { id, ...dto });
  }

  // Adds an inventory item to a supplier
  async addItem(supplierId: string, dto: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemResponseDto>> {
    this.logger.log(`le.suppliers.addItem — item: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'le.suppliers.addItem', { supplierId, ...dto });
  }

  // Updates a supplier item link
  async updateItem(
    supplierId: string,
    supplierItemId: string,
    dto: UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.updateItem — id: ${supplierItemId}`);
    return this.nats.send('commerce', 'le.suppliers.updateItem', { supplierId, supplierItemId, ...dto });
  }

  // Unlinks an inventory item from a supplier
  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.unlinkItem');
    return this.nats.send('commerce', 'le.suppliers.unlinkItem', { supplierId, supplierItemId });
  }

  // Bulk-unlinks multiple inventory items from a supplier
  async bulkUnlinkItems(supplierId: string, dto: BulkUnlinkSupplierItemsDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkUnlinkItems');
    return this.nats.send('commerce', 'le.suppliers.bulkUnlinkItems', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
    });
  }

  // Bulk-sets the free-goods scheme on multiple supplier items
  async bulkSetItemScheme(supplierId: string, dto: BulkSetSupplierItemSchemeDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemScheme');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemScheme', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      schemeBuyQty: dto.schemeBuyQty,
      schemeFreeQty: dto.schemeFreeQty,
      hasScheme: dto.hasScheme,
    });
  }

  // Bulk-marks supplier items as preferred (or clears it)
  async bulkSetItemPreferred(supplierId: string, dto: BulkSetSupplierItemPreferredDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemPreferred');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemPreferred', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      isPreferred: dto.isPreferred,
    });
  }

  // Returns the unit price for a supplier-item pair
  async findItemPrice(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('le.suppliers.findItemPrice');
    return this.nats.send('commerce', 'le.suppliers.findItemPrice', { supplierId, inventoryItemId, uomId });
  }

  // Returns enrolled sites for a supplier, enriched with site names
  async findSitesTable(supplierId: string, userId: string, orgId: string): Promise<SupplierSiteTableResponseDto> {
    this.logger.log(`le.suppliers.sitesTable — supplierId: ${supplierId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-${supplierId}-sites`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierSiteResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.sitesTable',
      { supplierId, ...state },
    );

    return { result: await this.enrichSiteNames(orgId, result), count, state, activeViewId };
  }

  // Enrolls a site for a supplier after validating it belongs to the session legal entity
  async addSite(
    supplierId: string,
    dto: AddSupplierSiteDto,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<SupplierSiteResponseDto>> {
    await this.validateSiteInSessionLe(orgId, legalEntityId, dto.siteId);
    this.logger.log(`le.suppliers.addSite — supplierId: ${supplierId}, siteId: ${dto.siteId}`);
    return this.nats.send('commerce', 'le.suppliers.addSite', { supplierId, ...dto });
  }

  // Updates a supplier site enrollment
  async updateSite(
    supplierId: string,
    supplierSiteId: string,
    dto: UpdateSupplierSiteDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.updateSite — id: ${supplierSiteId}`);
    return this.nats.send('commerce', 'le.suppliers.updateSite', { supplierId, supplierSiteId, ...dto });
  }

  // Removes a supplier site enrollment
  async removeSite(supplierId: string, supplierSiteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.removeSite — id: ${supplierSiteId}`);
    return this.nats.send('commerce', 'le.suppliers.removeSite', { supplierId, supplierSiteId });
  }

  // Returns a single supplier item by ID
  async findItemById(supplierItemId: string): Promise<SupplierItemResponseDto> {
    this.logger.log(`le.suppliers.findItemById — id: ${supplierItemId}`);
    return this.nats.send('commerce', 'le.suppliers.findItemById', { supplierItemId });
  }

  // Returns the price timeline of a supplier item for the table
  async findItemPricesTable(supplierItemId: string, userId: string): Promise<SupplierItemPriceTableResponseDto> {
    this.logger.log(`le.suppliers.itemPricesTable — supplierItemId: ${supplierItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-item-${supplierItemId}-prices`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierItemPriceResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.itemPricesTable',
      { supplierItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds a price record to a supplier item's timeline
  async addItemPrice(
    supplierItemId: string,
    dto: AddSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SupplierItemPriceResponseDto>> {
    this.logger.log(`le.suppliers.addItemPrice — supplierItemId: ${supplierItemId}, validFrom: ${dto.validFrom}`);
    return this.nats.send('commerce', 'le.suppliers.addItemPrice', { supplierItemId, ...dto });
  }

  // Updates a supplier item price record
  async updateItemPrice(
    supplierItemId: string,
    priceId: string,
    dto: UpdateSupplierItemPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.updateItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'le.suppliers.updateItemPrice', { supplierItemId, priceId, ...dto });
  }

  // Deletes a supplier item price record
  async deleteItemPrice(supplierItemId: string, priceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.deleteItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'le.suppliers.deleteItemPrice', { supplierItemId, priceId });
  }

  // Returns per-site overrides of a supplier item, enriched with site names
  async findItemSitesTable(
    supplierItemId: string,
    userId: string,
    orgId: string,
  ): Promise<SupplierItemSiteTableResponseDto> {
    this.logger.log(`le.suppliers.itemSitesTable — supplierItemId: ${supplierItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-item-${supplierItemId}-sites`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierItemSiteResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.itemSitesTable',
      { supplierItemId, ...state },
    );

    return { result: await this.enrichSiteNames(orgId, result), count, state, activeViewId };
  }

  // Adds a per-site override to a supplier item after validating the site belongs to the session legal entity
  async addItemSite(
    supplierItemId: string,
    dto: AddSupplierItemSiteDto,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<SupplierItemSiteResponseDto>> {
    await this.validateSiteInSessionLe(orgId, legalEntityId, dto.siteId);
    this.logger.log(`le.suppliers.addItemSite — supplierItemId: ${supplierItemId}, siteId: ${dto.siteId}`);
    return this.nats.send('commerce', 'le.suppliers.addItemSite', { supplierItemId, ...dto });
  }

  // Updates a supplier item's per-site override
  async updateItemSite(
    supplierItemId: string,
    supplierItemSiteId: string,
    dto: UpdateSupplierItemSiteDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.updateItemSite — id: ${supplierItemSiteId}`);
    return this.nats.send('commerce', 'le.suppliers.updateItemSite', { supplierItemId, supplierItemSiteId, ...dto });
  }

  // Deletes a supplier item's per-site override
  async deleteItemSite(supplierItemId: string, supplierItemSiteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.deleteItemSite — id: ${supplierItemSiteId}`);
    return this.nats.send('commerce', 'le.suppliers.deleteItemSite', { supplierItemId, supplierItemSiteId });
  }

  // Rejects site picks outside the session legal entity
  private async validateSiteInSessionLe(
    orgId: string,
    legalEntityId: string | undefined,
    siteId: string,
  ): Promise<void> {
    if (!legalEntityId) {
      throw new BadRequestException({
        label: 'Missing Legal Entity Context',
        detail: 'A legal entity workspace is required to manage supplier sites.',
      });
    }

    const [site] = await this.siteRepository.findByIds(orgId, [siteId]);
    if (!site || site.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Site',
        detail: 'The selected site does not belong to this legal entity.',
      });
    }
  }

  // Fills siteName/siteCode on rows carrying a bare siteId
  private async enrichSiteNames<T extends { siteId: string; siteName?: string | null; siteCode?: string | null }>(
    orgId: string,
    rows: T[],
  ): Promise<T[]> {
    if (rows.length === 0) return rows;

    const siteIds = [...new Set(rows.map((row) => row.siteId))];
    const sites = await this.siteRepository.findByIds(orgId, siteIds);
    const sitesById = new Map(sites.map((site) => [site.id, site]));

    return rows.map((row) => ({
      ...row,
      siteName: sitesById.get(row.siteId)?.name ?? null,
      siteCode: sitesById.get(row.siteId)?.code ?? null,
    }));
  }
}
