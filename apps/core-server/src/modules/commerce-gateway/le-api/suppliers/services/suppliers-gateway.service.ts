import type { SiteSupplierItemResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-response.dto';
import type { SiteSupplierItemTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-table-response.dto';
import type { SupplierAtSiteResponseDto } from '@commerce/supplier-sites/dto/response/supplier-at-site-response.dto';
import type { AddSupplierItemDto } from '@commerce/suppliers/dto/request/add-supplier-item.dto';
import type { AddSupplierItemSiteDto } from '@commerce/suppliers/dto/request/add-supplier-item-site.dto';
import type { AddSupplierSiteDto } from '@commerce/suppliers/dto/request/add-supplier-site.dto';
import type { BulkSetSupplierActiveDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-active.dto';
import type { BulkSetSupplierItemLeadTimeDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-lead-time.dto';
import type { BulkSetSupplierItemMinOrderDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-min-order.dto';
import type { BulkSetSupplierItemPreferredDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-preferred.dto';
import type { ChangeSupplierCurrencyDto } from '@commerce/suppliers/dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '@commerce/suppliers/dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '@commerce/suppliers/dto/request/update-supplier.dto';
import type { UpdateSupplierItemDto } from '@commerce/suppliers/dto/request/update-supplier-item.dto';
import type { UpdateSupplierItemSiteDto } from '@commerce/suppliers/dto/request/update-supplier-item-site.dto';
import type { UpdateSupplierSiteDto } from '@commerce/suppliers/dto/request/update-supplier-site.dto';
import type { SupplierItemResponseDto } from '@commerce/suppliers/dto/response/supplier-item-response.dto';
import type { SupplierItemSiteResponseDto } from '@commerce/suppliers/dto/response/supplier-item-site-response.dto';
import type { SupplierItemSiteTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-site-table-response.dto';
import type { SupplierItemTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-table-response.dto';
import type { SupplierResponseDto } from '@commerce/suppliers/dto/response/supplier-response.dto';
import type { SupplierSiteResponseDto } from '@commerce/suppliers/dto/response/supplier-site-response.dto';
import type { SupplierSiteRowResponseDto } from '@commerce/suppliers/dto/response/supplier-site-row-response.dto';
import type { SupplierSiteTableResponseDto } from '@commerce/suppliers/dto/response/supplier-site-table-response.dto';
import type { SupplierTableResponseDto } from '@commerce/suppliers/dto/response/supplier-table-response.dto';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, FilterOperators, type TableViewState } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SuppliersGatewayService {
  private readonly logger = new Logger(SuppliersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly siteRepository: SiteDomainRepository,
    private readonly ownerNames: OwnerNameService,
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

  // Updates a supplier by ID
  async update(id: string, dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.update');
    return this.nats.send('commerce', 'le.suppliers.update', { id, ...dto });
  }

  // Activates or deactivates several suppliers at once
  async bulkSetActive(dto: BulkSetSupplierActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.bulkSetActive — ${dto.ids.length} selected, isActive: ${dto.isActive}`);
    return this.nats.send('commerce', 'le.suppliers.bulkSetActive', { ids: dto.ids, isActive: dto.isActive });
  }

  // Activates or deactivates a supplier
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.setActive — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'le.suppliers.setActive', { id, isActive });
  }

  // Deletes a supplier by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.delete');
    return this.nats.send('commerce', 'le.suppliers.delete', { id });
  }

  // Sets the currencies a supplier trades in and its default; prices are never converted
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

  // Bulk-marks supplier items as preferred (or clears it)
  async bulkSetItemPreferred(supplierId: string, dto: BulkSetSupplierItemPreferredDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemPreferred');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemPreferred', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      siteIds: dto.siteIds,
      isPreferred: dto.isPreferred,
    });
  }

  // Bulk-sets the minimum order of supplier items (or clears it)
  async bulkSetItemMinOrder(supplierId: string, dto: BulkSetSupplierItemMinOrderDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemMinOrder');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemMinOrder', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      minOrderQuantity: dto.minOrderQuantity ?? null,
    });
  }

  // Bulk-sets the lead time of supplier items (or clears it), applied to their sites that follow the item
  async bulkSetItemLeadTime(supplierId: string, dto: BulkSetSupplierItemLeadTimeDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemLeadTime');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemLeadTime', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      leadTimeDays: dto.leadTimeDays ?? null,
    });
  }

  // Returns every site of the legal entity with the supplier's enrollment there; sites live in core, enrollments in
  // commerce, so the two are merged — and filtered, sorted and paged — here
  async findSitesTable(
    supplierId: string,
    userId: string,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<SupplierSiteTableResponseDto> {
    this.logger.log(`le.suppliers.sitesTable — supplierId: ${supplierId}`);
    if (!legalEntityId) {
      throw new BadRequestException({
        label: 'Missing Legal Entity Context',
        detail: 'A legal entity workspace is required to list supplier sites.',
      });
    }
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-${supplierId}-sites`,
    );
    const [sites, enrollments] = await Promise.all([
      this.siteRepository.siblingsOrdered(orgId, legalEntityId),
      this.nats.send<SupplierSiteResponseDto[]>('commerce', 'le.suppliers.enrollments', { supplierId }),
    ]);
    const enrollmentBySite = new Map(enrollments.map((enrollment) => [enrollment.siteId, enrollment]));
    const rows = sites.map((site): SupplierSiteRowResponseDto => {
      const enrollment = enrollmentBySite.get(site.id);
      return {
        id: enrollment?.id ?? null,
        supplierId,
        siteId: site.id,
        siteName: site.name,
        siteCode: site.code,
        enrollmentStatus: enrollment ? 'ENROLLED' : 'NOT_ENROLLED',
        paymentTermId: enrollment?.paymentTermId ?? null,
        paymentTermName: enrollment?.paymentTermName ?? null,
        partyTaxRegistrationId: enrollment?.partyTaxRegistrationId ?? null,
        registrationNumber: enrollment?.registrationNumber ?? null,
        partyBankAccountId: enrollment?.partyBankAccountId ?? null,
        bankAccountName: enrollment?.bankAccountName ?? null,
        orderRelationshipId: enrollment?.orderRelationshipId ?? null,
        orderContactLabel: enrollment?.orderContactLabel ?? null,
        orderContactName: enrollment?.orderContactName ?? null,
        createdAt: enrollment?.createdAt ?? null,
      };
    });

    const filtered = rows.filter(
      (row) =>
        SuppliersGatewayService.matchesSiteFilters(row, state) && SuppliersGatewayService.matchesSiteSearch(row, state),
    );
    const sort = state.sort[0];
    if (sort) {
      const key = sort.field as keyof SupplierSiteRowResponseDto;
      const direction = sort.direction === 'desc' ? -1 : 1;
      filtered.sort((a, b) => direction * String(a[key] ?? '').localeCompare(String(b[key] ?? '')));
    }
    const { limit = 20, offset = 0 } = state.pagination;
    return { result: filtered.slice(offset, offset + limit), count: filtered.length, state, activeViewId };
  }

  // Applies the Sites tab's enrollment-status filter (single or multi value, positive or negated)
  private static matchesSiteFilters(row: SupplierSiteRowResponseDto, state: TableViewState): boolean {
    return state.filters.every((filter) => {
      if (filter.field !== 'enrollmentStatus') return true;
      const values = Array.isArray(filter.value) ? filter.value.map(String) : [String(filter.value)];
      const hit = values.includes(row.enrollmentStatus);
      const negated =
        filter.operator === FilterOperators.NOT_EQUALS || filter.operator === FilterOperators.IS_NOT_ANY_OF;
      return negated ? !hit : hit;
    });
  }

  // Matches the search box against the site's name and code
  private static matchesSiteSearch(row: SupplierSiteRowResponseDto, state: TableViewState): boolean {
    const term = state.search?.value?.trim().toLowerCase();
    if (!term) return true;
    const columns =
      state.search?.columnId && state.search.columnId !== 'all' ? [state.search.columnId] : ['siteName', 'siteCode'];
    return columns.some((column) =>
      String(row[column as keyof SupplierSiteRowResponseDto] ?? '')
        .toLowerCase()
        .includes(term),
    );
  }

  // Returns a supplier as one of the LE's sites sees it, with the site's name
  async findAtSite(supplierId: string, siteId: string, orgId: string): Promise<SupplierAtSiteResponseDto> {
    this.logger.log(`le.suppliers.findAtSite — supplierId: ${supplierId}, siteId: ${siteId}`);
    const row = await this.nats.send<SupplierAtSiteResponseDto>('commerce', 'le.suppliers.findAtSite', {
      supplierId,
      siteId,
    });
    const [enriched] = await this.ownerNames.withSiteNames(orgId, [{ ...row, siteId }]);
    return enriched;
  }

  // Returns a supplier's items carried by one of the LE's sites
  async findSiteItemsTable(
    supplierId: string,
    siteId: string,
    userId: string,
  ): Promise<SiteSupplierItemTableResponseDto> {
    this.logger.log(`le.suppliers.siteItemsTable — supplierId: ${supplierId}, siteId: ${siteId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-supplier-${supplierId}-site-${siteId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: SiteSupplierItemResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.siteItemsTable',
      { supplierId, siteId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns a supplier item as one of the LE's sites carries it
  async findSiteItem(supplierItemId: string, siteId: string): Promise<SiteSupplierItemResponseDto> {
    this.logger.log(`le.suppliers.findSiteItem — id: ${supplierItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.suppliers.findSiteItem', { supplierItemId, siteId });
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

    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
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

  // Updates a supplier item's settings at one site
  async updateItemSite(supplierItemSiteId: string, dto: UpdateSupplierItemSiteDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.updateItemSite — id: ${supplierItemSiteId}`);
    return this.nats.send('commerce', 'le.suppliers.updateItemSite', { id: supplierItemSiteId, ...dto });
  }

  // Removes a supplier item from a site
  async deleteItemSite(supplierItemSiteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.deleteItemSite — id: ${supplierItemSiteId}`);
    return this.nats.send('commerce', 'le.suppliers.deleteItemSite', { id: supplierItemSiteId });
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
}
