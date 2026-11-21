import type { CreateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import type { UpdateEnrollmentPurchasingDto } from '@commerce/supplier-enrollments/dto/request/update-enrollment-purchasing.dto';
import type { UpdateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import type { CreatedSupplierEnrollmentResponseDto } from '@commerce/supplier-enrollments/dto/response/created-supplier-enrollment-response.dto';
import type { EnrollmentPurchasingResponseDto } from '@commerce/supplier-enrollments/dto/response/enrollment-purchasing-response.dto';
import type { SupplierEnrollmentCountsResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-counts-response.dto';
import type { SupplierEnrollmentDetailResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-detail-response.dto';
import type { SupplierEnrollmentResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-response.dto';
import {
  type SupplierEnrollmentRowResponseDto,
  SupplierEnrollmentStatusValues,
} from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-row-response.dto';
import type { SupplierEnrollmentTableResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-table-response.dto';
import type { AddSupplierSiteItemDto } from '@commerce/supplier-items/dto/request/add-supplier-site-item.dto';
import type { BulkSetSupplierSiteItemPreferredDto } from '@commerce/supplier-items/dto/request/bulk-set-supplier-site-item-preferred.dto';
import type { UpdateSupplierSiteItemDto } from '@commerce/supplier-items/dto/request/update-supplier-site-item.dto';
import type { SupplierItemCountsResponseDto } from '@commerce/supplier-items/dto/response/supplier-item-counts-response.dto';
import type { SupplierSiteItemResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-response.dto';
import type { SupplierSiteItemRowResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-row-response.dto';
import type { SupplierSiteItemRowTableResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-row-table-response.dto';
import type { SupplierSiteItemTableResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-table-response.dto';
import type { AddSupplierItemDto } from '@commerce/suppliers/dto/request/add-supplier-item.dto';
import type { BulkSetSupplierActiveDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-active.dto';
import type { BulkSetSupplierDefaultPaymentTermDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-default-payment-term.dto';
import type { BulkSetSupplierItemDefaultLeadTimeDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-default-lead-time.dto';
import type { BulkSetSupplierItemMinOrderDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-min-order.dto';
import type { ChangeSupplierCurrencyDto } from '@commerce/suppliers/dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '@commerce/suppliers/dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '@commerce/suppliers/dto/request/update-supplier.dto';
import type { UpdateSupplierItemDto } from '@commerce/suppliers/dto/request/update-supplier-item.dto';
import type { CreatedSupplierResponseDto } from '@commerce/suppliers/dto/response/created-supplier-response.dto';
import type { SupplierCountsResponseDto } from '@commerce/suppliers/dto/response/supplier-counts-response.dto';
import type { SupplierItemResponseDto } from '@commerce/suppliers/dto/response/supplier-item-response.dto';
import type { SupplierItemTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-table-response.dto';
import type { SupplierResponseDto } from '@commerce/suppliers/dto/response/supplier-response.dto';
import type { SupplierTableResponseDto } from '@commerce/suppliers/dto/response/supplier-table-response.dto';
import { SiteDomainService } from '@domain/site/services/site.service';
import { UserDomainService } from '@domain/user/services/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { FilterOperators } from '@vritti/api-sdk/conditions';
import { type TableState, TableStateService } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

type UnnamedEnrollmentPurchasing = Omit<EnrollmentPurchasingResponseDto, 'approverNames'>;

type UnnamedEnrollmentDetail = Omit<SupplierEnrollmentDetailResponseDto, 'siteName' | 'siteCode' | 'purchasing'> & {
  purchasing: UnnamedEnrollmentPurchasing | null;
};

@Injectable()
export class SuppliersGatewayService {
  private readonly logger = new Logger(SuppliersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly siteService: SiteDomainService,
    private readonly ownerNames: OwnerNameService,
    private readonly userService: UserDomainService,
  ) {}

  // Creates a new supplier
  async create(dto: CreateSupplierDto): Promise<CreateResponseDto<CreatedSupplierResponseDto>> {
    this.logger.log(`le.suppliers.create — partyId: ${dto.partyId}, code: ${dto.code}`);
    return this.nats.send('commerce', 'le.suppliers.create', dto);
  }

  // Adds an inventory item to a supplier
  async addItem(supplierId: string, dto: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemResponseDto>> {
    this.logger.log(`le.suppliers.addItem — item: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'le.suppliers.addItem', { supplierId, ...dto });
  }

  // Enrolls the supplier at one of the LE's sites
  async createEnrollment(
    supplierId: string,
    dto: CreateSupplierEnrollmentDto,
  ): Promise<CreateResponseDto<CreatedSupplierEnrollmentResponseDto>> {
    if (!dto.siteId) {
      throw new BadRequestException({
        label: 'Site Required',
        detail: 'Pick the site to enroll the supplier at.',
        errors: [{ field: 'siteId', message: 'Site is required' }],
      });
    }
    this.logger.log(`le.suppliers.enrollments.create — supplierId: ${supplierId}, siteId: ${dto.siteId}`);
    return this.nats.send('commerce', 'le.suppliers.enrollments.create', { ...dto, supplierId });
  }

  // Sets a supplier item up at one of the LE's sites
  createSiteItem(
    supplierItemId: string,
    dto: AddSupplierSiteItemDto,
  ): Promise<CreateResponseDto<SupplierSiteItemResponseDto>> {
    this.logger.log(`le.suppliers.siteItems.create — supplierItemId: ${supplierItemId}, siteId: ${dto.siteId}`);
    return this.nats.send('commerce', 'le.suppliers.siteItems.create', { supplierItemId, ...dto });
  }

  // Updates a supplier by ID
  async update(id: string, dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.update');
    return this.nats.send('commerce', 'le.suppliers.update', { id, ...dto });
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

  // Updates the supplier's enrollment picks and flags at one of the LE's sites
  async updateEnrollment(
    supplierId: string,
    siteId: string,
    dto: UpdateSupplierEnrollmentDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.enrollments.update — supplierId: ${supplierId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.suppliers.enrollments.update', { ...dto, supplierId, siteId });
  }

  // Updates the supplier's purchasing settings at one of the LE's sites
  updateEnrollmentPurchasing(
    supplierId: string,
    siteId: string,
    dto: UpdateEnrollmentPurchasingDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.suppliers.enrollments.updatePurchasing — supplierId: ${supplierId}, siteId: ${siteId}, type: ${dto.purchaseType}`,
    );
    return this.nats.send('commerce', 'le.suppliers.enrollments.updatePurchasing', { ...dto, supplierId, siteId });
  }

  // Updates a supplier item's settings at one site
  async updateSiteItem(supplierSiteItemId: string, dto: UpdateSupplierSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.update — id: ${supplierSiteItemId}`);
    return this.nats.send('commerce', 'le.suppliers.siteItems.update', { id: supplierSiteItemId, ...dto });
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

  // Sets the default payment term of several suppliers at once
  async bulkSetDefaultPaymentTerm(dto: BulkSetSupplierDefaultPaymentTermDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.suppliers.bulkSetDefaultPaymentTerm — ${dto.ids.length} selected, paymentTermId: ${dto.defaultPaymentTermId}`,
    );
    return this.nats.send('commerce', 'le.suppliers.bulkSetDefaultPaymentTerm', {
      ids: dto.ids,
      defaultPaymentTermId: dto.defaultPaymentTermId,
    });
  }

  // Sets the payment term new site enrollments of a supplier start from
  async setDefaultPaymentTerm(id: string, defaultPaymentTermId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.setDefaultPaymentTerm — id: ${id}, paymentTermId: ${defaultPaymentTermId}`);
    return this.nats.send('commerce', 'le.suppliers.setDefaultPaymentTerm', { id, defaultPaymentTermId });
  }

  // Blocks or unblocks new purchase orders and goods receipts from a supplier
  async setPurchasingBlocked(id: string, purchasingBlocked: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.setPurchasingBlocked — id: ${id}, purchasingBlocked: ${purchasingBlocked}`);
    return this.nats.send('commerce', 'le.suppliers.setPurchasingBlocked', { id, purchasingBlocked });
  }

  // Blocks or unblocks payments to a supplier
  async setPaymentBlocked(id: string, paymentBlocked: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.setPaymentBlocked — id: ${id}, paymentBlocked: ${paymentBlocked}`);
    return this.nats.send('commerce', 'le.suppliers.setPaymentBlocked', { id, paymentBlocked });
  }

  // Sets the currencies a supplier trades in and its default; prices are never converted
  async changeCurrency(id: string, dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.changeCurrency — id: ${id}, currency: ${dto.currencyCode}`);
    return this.nats.send('commerce', 'le.suppliers.changeCurrency', { id, ...dto });
  }

  // Bulk-marks supplier items as preferred at the chosen sites (or clears it)
  async bulkSetSiteItemsPreferred(
    supplierId: string,
    dto: BulkSetSupplierSiteItemPreferredDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.siteItems.bulkSetPreferred');
    return this.nats.send('commerce', 'le.suppliers.siteItems.bulkSetPreferred', {
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

  // Bulk-sets the default lead time of supplier items, applied to their sites that follow it
  async bulkSetItemDefaultLeadTime(
    supplierId: string,
    dto: BulkSetSupplierItemDefaultLeadTimeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemDefaultLeadTime');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemDefaultLeadTime', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      defaultLeadTimeDays: dto.defaultLeadTimeDays,
    });
  }

  // Activates or deactivates the supplier's own enrollment at one of the LE's sites
  async setEnrollmentActive(supplierId: string, siteId: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.suppliers.enrollments.setActive — supplierId: ${supplierId}, siteId: ${siteId}, isActive: ${isActive}`,
    );
    return this.nats.send('commerce', 'le.suppliers.enrollments.setActive', { supplierId, siteId, isActive });
  }

  // Finds a supplier by ID
  async findById(id: string): Promise<SupplierResponseDto> {
    this.logger.log('le.suppliers.findById');
    return this.nats.send('commerce', 'le.suppliers.findById', { id });
  }

  // Returns a single supplier item by ID
  async findItemById(supplierItemId: string): Promise<SupplierItemResponseDto> {
    this.logger.log(`le.suppliers.findItemById — id: ${supplierItemId}`);
    return this.nats.send('commerce', 'le.suppliers.findItemById', { supplierItemId });
  }

  // Returns paginated, filtered, and sorted suppliers for the data table
  async findForTable(userId: string): Promise<SupplierTableResponseDto> {
    this.logger.log('le.suppliers.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-le-suppliers');

    const { result, count } = await this.nats.send<{ result: SupplierResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns linked supplier items for the table
  async findItemsTable(supplierId: string, userId: string): Promise<SupplierItemTableResponseDto> {
    this.logger.log('le.suppliers.itemsTable');
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Returns every site of the legal entity with the supplier's enrollment there; sites live in core, enrollments in
  // commerce, so the two are merged — and filtered, sorted and paged — here
  async findEnrollmentsTable(
    supplierId: string,
    userId: string,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<SupplierEnrollmentTableResponseDto> {
    this.logger.log(`le.suppliers.enrollments.findAll — supplierId: ${supplierId}`);
    const leId = SuppliersGatewayService.requireLegalEntity(legalEntityId);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-supplier-${supplierId}-enrollments`,
    );
    const [sites, enrollments, supplier] = await Promise.all([
      this.siteService.findByLegalEntityOrdered(orgId, leId),
      this.nats.send<SupplierEnrollmentResponseDto[]>('commerce', 'le.suppliers.enrollments.findAll', { supplierId }),
      this.nats.send<SupplierResponseDto>('commerce', 'le.suppliers.findById', { id: supplierId }),
    ]);
    const enrollmentBySite = new Map(enrollments.map((enrollment) => [enrollment.siteId, enrollment]));
    const rows = sites.map((site): SupplierEnrollmentRowResponseDto => {
      const enrollment = enrollmentBySite.get(site.id);
      return {
        id: enrollment?.id ?? null,
        supplierId,
        supplierCode: supplier.code,
        partyId: supplier.partyId,
        partyName: supplier.partyName,
        partyType: supplier.partyType ?? '',
        siteId: site.id,
        siteName: site.name,
        siteCode: site.code,
        enrollmentStatus: enrollment
          ? SupplierEnrollmentStatusValues.ENROLLED
          : SupplierEnrollmentStatusValues.NOT_ENROLLED,
        isActive: enrollment?.isActive ?? null,
        isSupplierActive: supplier.isActive,
        purchasingBlocked: supplier.purchasingBlocked,
        paymentBlocked: supplier.paymentBlocked,
        currencyCode: supplier.currencyCode,
        currencyCodes: supplier.currencyCodes,
        defaultPaymentTermId: supplier.defaultPaymentTermId,
        paymentTermId: enrollment?.paymentTermId ?? null,
        paymentTermName: enrollment?.paymentTermName ?? null,
        partyTaxRegistrationId: enrollment?.partyTaxRegistrationId ?? null,
        registrationNumber: enrollment?.registrationNumber ?? null,
        registrationCountryCode: enrollment?.registrationCountryCode ?? null,
        registrationJurisdictionName: enrollment?.registrationJurisdictionName ?? null,
        partyBankAccountId: enrollment?.partyBankAccountId ?? null,
        bankAccountName: enrollment?.bankAccountName ?? null,
        orderRelationshipId: enrollment?.orderRelationshipId ?? null,
        orderContactLabel: enrollment?.orderContactLabel ?? null,
        orderContactName: enrollment?.orderContactName ?? null,
        orderEmailCommunicationId: enrollment?.orderEmailCommunicationId ?? null,
        orderEmail: enrollment?.orderEmail ?? null,
        orderPhoneCommunicationId: enrollment?.orderPhoneCommunicationId ?? null,
        orderPhone: enrollment?.orderPhone ?? null,
        enrolledAt: enrollment?.createdAt ?? null,
      };
    });

    const filtered = rows.filter(
      (row) =>
        SuppliersGatewayService.matchesEnrollmentFilters(row, state) &&
        SuppliersGatewayService.matchesEnrollmentSearch(row, state),
    );
    const sort = state.sort[0];
    if (sort) {
      const key = sort.field as keyof SupplierEnrollmentRowResponseDto;
      const direction = sort.direction === 'desc' ? -1 : 1;
      filtered.sort((a, b) => direction * String(a[key] ?? '').localeCompare(String(b[key] ?? '')));
    }
    const { limit = 20, offset = 0 } = state.pagination;
    return { result: filtered.slice(offset, offset + limit), count: filtered.length, state, activeViewId };
  }

  // Returns a supplier's site items at one of the LE's sites
  async findEnrollmentSiteItemsTable(
    supplierId: string,
    siteId: string,
    userId: string,
  ): Promise<SupplierSiteItemRowTableResponseDto> {
    this.logger.log(`le.suppliers.enrollments.siteItems.table — supplierId: ${supplierId}, siteId: ${siteId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-supplier-${supplierId}-site-${siteId}-site-items`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierSiteItemRowResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.enrollments.siteItems.table',
      { supplierId, siteId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns the site items of a supplier item, enriched with site names
  async findSiteItemsTable(
    supplierItemId: string,
    userId: string,
    orgId: string,
  ): Promise<SupplierSiteItemTableResponseDto> {
    this.logger.log(`le.suppliers.siteItems.table — supplierItemId: ${supplierItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-supplier-item-${supplierItemId}-site-items`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierSiteItemResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.siteItems.table',
      { supplierItemId, ...state },
    );

    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns the supplier's enrollment at one of the LE's sites, enrolled or not, with the site and approvers named
  async findEnrollment(
    supplierId: string,
    siteId: string,
    orgId: string,
  ): Promise<SupplierEnrollmentDetailResponseDto> {
    this.logger.log(`le.suppliers.enrollments.findBySite — supplierId: ${supplierId}, siteId: ${siteId}`);
    const row = await this.nats.send<UnnamedEnrollmentDetail>('commerce', 'le.suppliers.enrollments.findBySite', {
      supplierId,
      siteId,
    });
    const [named] = await this.ownerNames.withSiteNames(orgId, [row]);
    return { ...named, purchasing: await this.namePurchasingApprovers(orgId, named.purchasing) };
  }

  // Counts a supplier's items, quotations and people in commerce, and its Enrollments tab's rows — every site of the
  // legal entity, which lives in core
  async findCounts(id: string, orgId: string, legalEntityId: string | undefined): Promise<SupplierCountsResponseDto> {
    this.logger.log(`le.suppliers.findCounts — id: ${id}`);
    const leId = SuppliersGatewayService.requireLegalEntity(legalEntityId);
    const [counts, sites] = await Promise.all([
      this.nats.send<Omit<SupplierCountsResponseDto, 'enrollmentCount'>>('commerce', 'le.suppliers.findCounts', { id }),
      this.siteService.findByLegalEntityOrdered(orgId, leId),
    ]);
    return { ...counts, enrollmentCount: sites.length };
  }

  // Counts a supplier item's sites and prices
  findItemCounts(supplierItemId: string): Promise<SupplierItemCountsResponseDto> {
    this.logger.log(`le.suppliers.findItemCounts — id: ${supplierItemId}`);
    return this.nats.send('commerce', 'le.suppliers.findItemCounts', { supplierItemId });
  }

  // Counts a supplier's items, quotations and invoices at one of the LE's sites
  findEnrollmentCounts(supplierId: string, siteId: string): Promise<SupplierEnrollmentCountsResponseDto> {
    this.logger.log(`le.suppliers.enrollments.findCounts — supplierId: ${supplierId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.suppliers.enrollments.findCounts', { supplierId, siteId });
  }

  // Deletes a supplier by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.delete');
    return this.nats.send('commerce', 'le.suppliers.delete', { id });
  }

  // Unlinks an inventory item from a supplier
  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.unlinkItem');
    return this.nats.send('commerce', 'le.suppliers.unlinkItem', { supplierId, supplierItemId });
  }

  // Removes the supplier's enrollment at one of the LE's sites
  async deleteEnrollment(supplierId: string, siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.enrollments.delete — supplierId: ${supplierId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.suppliers.enrollments.delete', { supplierId, siteId });
  }

  // Removes a supplier item from a site
  async deleteSiteItem(supplierSiteItemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.delete — id: ${supplierSiteItemId}`);
    return this.nats.send('commerce', 'le.suppliers.siteItems.delete', { id: supplierSiteItemId });
  }

  // Applies the Enrollments tab's enrollment-status filter (single or multi value, positive or negated)
  private static matchesEnrollmentFilters(row: SupplierEnrollmentRowResponseDto, state: TableState): boolean {
    return state.filters.panel.every((filter) => {
      if (filter.field !== 'enrollmentStatus') return true;
      const values = Array.isArray(filter.value) ? filter.value.map(String) : [String(filter.value)];
      const hit = values.includes(row.enrollmentStatus);
      const negated =
        filter.operator === FilterOperators.NOT_EQUALS || filter.operator === FilterOperators.IS_NOT_ANY_OF;
      return negated ? !hit : hit;
    });
  }

  // Matches the search box against the site's name and code
  private static matchesEnrollmentSearch(row: SupplierEnrollmentRowResponseDto, state: TableState): boolean {
    const term = state.search?.value?.trim().toLowerCase();
    if (!term) return true;
    const columns =
      state.search?.columnId && state.search.columnId !== 'all' ? [state.search.columnId] : ['siteName', 'siteCode'];
    return columns.some((column) =>
      String(row[column as keyof SupplierEnrollmentRowResponseDto] ?? '')
        .toLowerCase()
        .includes(term),
    );
  }

  // Names the approvers of an enrollment's purchasing settings, which a site the supplier isn't enrolled at has none of
  private async namePurchasingApprovers(
    orgId: string,
    purchasing: UnnamedEnrollmentPurchasing | null,
  ): Promise<EnrollmentPurchasingResponseDto | null> {
    if (!purchasing) return null;
    const names = await this.userService.findNamesByIds(orgId, purchasing.approverUserIds);
    return { ...purchasing, approverNames: purchasing.approverUserIds.flatMap((id) => names.get(id) ?? []) };
  }

  // Returns the session legal entity, rejecting requests made outside a legal entity workspace
  private static requireLegalEntity(legalEntityId: string | undefined): string {
    if (legalEntityId) return legalEntityId;
    throw new BadRequestException({
      label: 'Missing Legal Entity Context',
      detail: 'A legal entity workspace is required to manage supplier enrollments.',
    });
  }
}
