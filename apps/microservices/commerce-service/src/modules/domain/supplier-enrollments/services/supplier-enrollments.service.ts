import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc, eq, isNotNull, isNull, or } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyAmountDto, majorToMinor } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import {
  parties,
  paymentTerms,
  type Supplier,
  type SupplierEnrollment,
  supplierEnrollments,
  suppliers,
} from '@/db/schema';
import { EnrollmentPurchasingDto } from '../dto/entity/enrollment-purchasing.dto';
import { SupplierEnrollmentDto } from '../dto/entity/supplier-enrollment.dto';
import { SupplierEnrollmentDetailDto } from '../dto/entity/supplier-enrollment-detail.dto';
import { SupplierEnrollmentPurchasingDetailDto } from '../dto/entity/supplier-enrollment-purchasing-detail.dto';
import { SupplierEnrollmentPurchasingSnapshotDto } from '../dto/entity/supplier-enrollment-purchasing-snapshot.dto';
import { SupplierEnrollmentRowDto, SupplierEnrollmentStatusValues } from '../dto/entity/supplier-enrollment-row.dto';
import type { CreateSupplierEnrollmentDto } from '../dto/request/create-supplier-enrollment.dto';
import type { SetSupplierEnrollmentActiveDto } from '../dto/request/set-supplier-enrollment-active.dto';
import type { SupplierEnrolledSitesQueryDto } from '../dto/request/supplier-enrolled-sites-query.dto';
import type { SupplierEnrollmentSelectQueryDto } from '../dto/request/supplier-enrollment-select-query.dto';
import type { UpdateEnrollmentPurchasingDto } from '../dto/request/update-enrollment-purchasing.dto';
import type { UpdateSupplierEnrollmentDto } from '../dto/request/update-supplier-enrollment.dto';
import { SiteSuppliersDomainRepository } from '../repositories/site-suppliers.repository';
import { SupplierEnrollmentsDomainRepository } from '../repositories/supplier-enrollments.repository';

@Injectable()
export class SupplierEnrollmentsDomainService {
  private readonly logger = new Logger(SupplierEnrollmentsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    partyName: { column: parties.displayName, type: 'string' },
    supplierCode: { column: suppliers.code, type: 'string' },
  };

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    currencyCode: { column: suppliers.currencyCode, type: 'string' },
    isActive: { column: supplierEnrollments.isActive, type: 'boolean' },
    purchasingBlocked: { column: suppliers.purchasingBlocked, type: 'boolean' },
    paymentBlocked: { column: suppliers.paymentBlocked, type: 'boolean' },
    paymentTermName: { column: paymentTerms.name, type: 'string' },
    enrollmentStatus: {
      type: 'string',
      expression: (value, operator) => {
        const enrolled =
          (value === SupplierEnrollmentStatusValues.ENROLLED) !== (operator === FilterOperators.NOT_EQUALS);
        return enrolled ? isNotNull(supplierEnrollments.id) : isNull(supplierEnrollments.id);
      },
    },
  };

  constructor(
    private readonly repository: SupplierEnrollmentsDomainRepository,
    private readonly siteSuppliersRepository: SiteSuppliersDomainRepository,
  ) {}

  // Enrolls a supplier at a site, optionally under one of its GSTIN/VAT registrations, validating every pick
  async create(dto: CreateSupplierEnrollmentDto): Promise<CreateResponseDto<SupplierEnrollmentDto>> {
    const { supplierId, siteId, ...picks } = dto;
    const supplier = await this.findSupplierOrThrow(supplierId);
    await this.repository.assertPicksUsable(supplier.partyId, picks);
    await this.repository.assertNotEnrolled(supplierId, siteId);

    const entity = await this.repository.create({
      supplierId,
      siteId,
      paymentTermId: picks.paymentTermId,
      partyTaxRegistrationId: picks.partyTaxRegistrationId ?? null,
      partyBankAccountId: picks.partyBankAccountId ?? null,
      orderRelationshipId: picks.orderRelationshipId ?? null,
      orderEmailCommunicationId: picks.orderEmailCommunicationId,
      orderPhoneCommunicationId: picks.orderPhoneCommunicationId,
      isActive: picks.isActive,
    });
    const created = await this.repository.findByIdWithPicksOrThrow(entity.id);
    this.logger.log(`Enrolled supplier ${supplierId} at site ${siteId}`);
    return {
      success: true,
      message: 'Supplier enrolled for this site.',
      data: SupplierEnrollmentDto.from(created),
    };
  }

  // Updates an enrollment's payment term, registration, bank account and order-contact picks
  async update(dto: UpdateSupplierEnrollmentDto): Promise<SuccessResponseDto> {
    const { supplierId, siteId, ...data } = dto;
    const enrollment = await this.findBySupplierAndSiteOrThrow(supplierId, siteId);
    const supplier = await this.findSupplierOrThrow(supplierId);
    await this.repository.assertPicksUsable(supplier.partyId, data);
    if (Object.keys(data).length > 0) {
      await this.repository.update(enrollment.id, data);
    }
    this.logger.log(`Updated enrollment of supplier ${supplierId} at site ${siteId}`);
    return { success: true, message: 'Enrollment updated successfully.' };
  }

  // Sets how purchases from the supplier run at the site, its amounts in the legal entity's currency; the caller has
  // checked both locations are at that site
  async updatePurchasing(dto: UpdateEnrollmentPurchasingDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const { supplierId, siteId, ...settings } = dto;
    const enrollment = await this.findBySupplierAndSiteOrThrow(supplierId, siteId);
    SupplierEnrollmentsDomainService.assertApprovers(settings.approvalEnabled, settings.approverUserIds);
    SupplierEnrollmentsDomainService.assertQuarantineLocation(
      settings.qualityCheckEnabled,
      settings.quarantineLocationId,
    );
    const approvalThreshold = settings.approvalThreshold
      ? SupplierEnrollmentsDomainService.toLegalEntityMinor(
          settings.approvalThreshold,
          leCurrencyCode,
          'approvalThreshold',
        )
      : null;
    const amountTolerance = SupplierEnrollmentsDomainService.toLegalEntityMinor(
      settings.amountTolerance,
      leCurrencyCode,
      'amountTolerance',
    );
    SupplierEnrollmentsDomainService.assertTolerances(
      settings.priceTolerancePct,
      settings.qtyTolerancePct,
      amountTolerance,
    );
    await this.repository.update(enrollment.id, {
      purchaseType: settings.purchaseType,
      approvalEnabled: settings.approvalEnabled,
      approverUserIds: [...new Set(settings.approverUserIds)],
      approvalThreshold,
      qualityCheckEnabled: settings.qualityCheckEnabled,
      quarantineLocationId: settings.quarantineLocationId,
      defaultReceiptLocationId: settings.defaultReceiptLocationId,
      priceTolerancePct: settings.priceTolerancePct,
      qtyTolerancePct: settings.qtyTolerancePct,
      amountTolerance,
    });
    this.logger.log(`Updated purchasing of supplier ${supplierId} at site ${siteId} — ${settings.purchaseType}`);
    return { success: true, message: 'Purchasing settings updated.' };
  }

  // Activates or deactivates the supplier's own enrollment at a site; the supplier-wide flag is untouched
  async setActive(dto: SetSupplierEnrollmentActiveDto): Promise<SuccessResponseDto> {
    const enrollment = await this.findBySupplierAndSiteOrThrow(dto.supplierId, dto.siteId);
    await this.repository.update(enrollment.id, { isActive: dto.isActive });
    this.logger.log(`Set supplier ${dto.supplierId} active=${dto.isActive} at site ${dto.siteId}`);
    return { success: true, message: `Enrollment ${dto.isActive ? 'activated' : 'deactivated'} at this site.` };
  }

  // Returns the legal entity's suppliers with their enrollment at the site: every active one, plus inactive ones already
  // enrolled here so their enrollment stays visible
  async findForSiteTable(
    legalEntityId: string,
    siteId: string,
    state: TableState,
  ): Promise<{ result: SupplierEnrollmentRowDto[]; count: number }> {
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...SupplierEnrollmentsDomainService.SEARCH_FIELD_MAP,
      ...SupplierEnrollmentsDomainService.FILTER_FIELD_MAP,
    });
    const { result, count } = await this.siteSuppliersRepository.findForSiteTable(legalEntityId, siteId, {
      where: and(
        or(eq(suppliers.isActive, true), isNotNull(supplierEnrollments.id)),
        FilterProcessor.buildWhere(state.filters, SupplierEnrollmentsDomainService.FILTER_FIELD_MAP),
        FilterProcessor.buildSearch(state.search, SupplierEnrollmentsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [isNull(supplierEnrollments.id), asc(parties.displayName)],
      limit,
      offset,
    });
    return { result: result.map((row) => SupplierEnrollmentRowDto.from(row, siteId)), count };
  }

  // Returns a supplier's enrollment at a site with its commercial identity, enrolled or not
  async findDetail(legalEntityId: string, siteId: string, supplierId: string): Promise<SupplierEnrollmentDetailDto> {
    const row = await this.siteSuppliersRepository.findDetailOrThrow(legalEntityId, siteId, supplierId);
    return SupplierEnrollmentDetailDto.fromDetail(row, siteId);
  }

  // Returns every enrollment of a supplier; the gateway merges them into the legal entity's site list
  async findAllForSupplier(supplierId: string): Promise<SupplierEnrollmentDto[]> {
    await this.findSupplierOrThrow(supplierId);
    return (await this.repository.findAllForSupplier(supplierId)).map(SupplierEnrollmentDto.from);
  }

  // Returns true when the supplier is enrolled for the site
  isEnrolled(supplierId: string, siteId: string): Promise<boolean> {
    return this.repository.isEnrolled(supplierId, siteId);
  }

  // Returns supplier options for a site picker with each supplier's enrollment status at the site
  findSuppliersForSelect(
    legalEntityId: string,
    siteId: string,
    query: SupplierEnrollmentSelectQueryDto,
  ): Promise<SelectQueryResult> {
    return this.siteSuppliersRepository.findForSiteSelect(legalEntityId, siteId, query);
  }

  // Returns the sites a supplier (or any supplier of an inventory item) is enrolled at, only the active enrollments with
  // isActive; core-api's site select limits its options to them
  findEnrolledSiteIds({ supplierId, inventoryItemId, isActive }: SupplierEnrolledSitesQueryDto): Promise<string[]> {
    return this.repository.findEnrolledSiteIds({ supplierId, inventoryItemId }, isActive);
  }

  // Returns a supplier's enrollment at a site with its purchasing settings, amounts in the legal entity's currency
  async findDetailWithPurchasing(
    legalEntityId: string,
    siteId: string,
    supplierId: string,
    leCurrencyCode: string,
  ): Promise<SupplierEnrollmentPurchasingDetailDto> {
    const row = await this.siteSuppliersRepository.findDetailOrThrow(legalEntityId, siteId, supplierId);
    const purchasing = row.id ? await this.repository.findPurchasing(row.id) : undefined;
    return SupplierEnrollmentPurchasingDetailDto.fromPurchasing(
      row,
      siteId,
      purchasing ? EnrollmentPurchasingDto.from(purchasing, leCurrencyCode) : null,
    );
  }

  // Returns the settings a purchase leg copies from the supplier's enrollment at the site, or undefined when not enrolled
  async findPurchasingSnapshot(
    supplierId: string,
    siteId: string,
  ): Promise<SupplierEnrollmentPurchasingSnapshotDto | undefined> {
    const enrollment = await this.repository.findPurchasingSnapshot(supplierId, siteId);
    return enrollment ? SupplierEnrollmentPurchasingSnapshotDto.from(enrollment) : undefined;
  }

  // Returns each enrollment's current approvers, keyed by enrollment id
  async findApproverUserIds(enrollmentIds: string[]): Promise<Map<string, string[]>> {
    if (enrollmentIds.length === 0) return new Map();
    const rows = await this.repository.findApprovers([...new Set(enrollmentIds)]);
    return new Map(rows.map((row) => [row.id, row.approverUserIds]));
  }

  // Loads the supplier's enrollment at a site, throwing when the supplier is not enrolled there
  async findBySupplierAndSiteOrThrow(supplierId: string, siteId: string): Promise<SupplierEnrollment> {
    const enrollment = await this.repository.findBySupplierAndSite(supplierId, siteId);
    if (!enrollment) throw new NotFoundException('Supplier is not enrolled for this site.');
    return enrollment;
  }

  // Rejects buying from a supplier that is not enrolled, not active or purchasing-blocked at the site
  async assertPurchasable(supplierId: string, siteId: string): Promise<void> {
    const enrollment = await this.repository.findBySupplierAndSite(supplierId, siteId);
    if (!enrollment) {
      throw new BadRequestException({
        label: 'Not Enrolled',
        detail: 'This supplier is not enrolled for this site. Enroll it here before creating this document.',
      });
    }
    if (!enrollment.isSupplierActive || !enrollment.isActive) {
      const detail = enrollment.isSupplierActive
        ? "This supplier's enrollment at this site is inactive. Activate it at this site before purchasing."
        : 'This supplier is inactive. Activate the supplier before purchasing from it.';
      throw new BadRequestException({ label: 'Supplier Inactive', detail });
    }
    const supplier = await this.findSupplierOrThrow(supplierId);
    if (!supplier.purchasingBlocked) return;
    throw new BadRequestException({
      label: 'Supplier Blocked',
      detail: 'Purchasing is blocked for this supplier. Lift the block on the supplier before purchasing from it.',
    });
  }

  // Removes the supplier's enrollment at a site and its site picks
  async delete(supplierId: string, siteId: string): Promise<SuccessResponseDto> {
    const enrollment = await this.findBySupplierAndSiteOrThrow(supplierId, siteId);
    await this.repository.delete(enrollment.id);
    this.logger.log(`Unenrolled supplier ${supplierId} from site ${siteId}`);
    return { success: true, message: 'Supplier unenrolled from this site.' };
  }

  // Rejects turning approval on without anyone to approve
  private static assertApprovers(approvalEnabled: boolean, approverUserIds: string[]): void {
    if (!approvalEnabled || approverUserIds.length > 0) return;
    throw new BadRequestException({
      label: 'Approvers Required',
      detail: 'Pick at least one user who approves purchases from this supplier, or turn approval off.',
      errors: [{ field: 'approverUserIds', message: 'Pick at least one approver' }],
    });
  }

  // Rejects turning quality check on without a location for receipts to wait in
  private static assertQuarantineLocation(qualityCheckEnabled: boolean, quarantineLocationId: string | null): void {
    if (!qualityCheckEnabled || quarantineLocationId) return;
    throw new BadRequestException({
      label: 'Quarantine Location Required',
      detail: 'Receipts wait in a quarantine location until they pass quality check. Pick one, or turn the check off.',
      errors: [{ field: 'quarantineLocationId', message: 'Required with quality check' }],
    });
  }

  // Rejects a negative price, quantity or amount tolerance
  private static assertTolerances(priceTolerancePct: number, qtyTolerancePct: number, amountTolerance: bigint): void {
    const errors = [
      { field: 'priceTolerancePct', negative: priceTolerancePct < 0 },
      { field: 'qtyTolerancePct', negative: qtyTolerancePct < 0 },
      { field: 'amountTolerance', negative: amountTolerance < 0n },
    ]
      .filter((tolerance) => tolerance.negative)
      .map((tolerance) => ({ field: tolerance.field, message: 'Cannot be negative' }));
    if (errors.length === 0) return;
    throw new BadRequestException({
      label: 'Invalid Tolerance',
      detail: 'A tolerance is how far an invoice may differ before it is held, so it is zero or more.',
      errors,
    });
  }

  // Converts an amount the legal entity's settings hold to minor units, rejecting one in another currency
  private static toLegalEntityMinor(amount: CurrencyAmountDto, leCurrencyCode: string, field: string): bigint {
    if (amount.currency !== leCurrencyCode) {
      throw new BadRequestException({
        label: 'Wrong Currency',
        detail: `Purchasing amounts are in the legal entity's currency (${leCurrencyCode}).`,
        errors: [{ field, message: `Must be in ${leCurrencyCode}` }],
      });
    }
    return majorToMinor(amount.value, amount.currency, field);
  }

  // Loads a supplier row for enrollment validation, throwing when it does not exist
  private async findSupplierOrThrow(supplierId: string): Promise<Supplier> {
    const supplier = await this.repository.findSupplier(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return supplier;
  }
}
