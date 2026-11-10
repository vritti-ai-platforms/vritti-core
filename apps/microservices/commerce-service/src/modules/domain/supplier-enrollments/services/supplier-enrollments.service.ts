import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc, eq, isNotNull, isNull, or } from '@vritti/api-sdk/drizzle-orm';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import { parties, paymentTerms, supplierEnrollments, suppliers } from '@/db/schema';
import { SupplierEnrollmentDto } from '../dto/entity/supplier-enrollment.dto';
import { SupplierEnrollmentDetailDto } from '../dto/entity/supplier-enrollment-detail.dto';
import { SupplierEnrollmentRowDto, SupplierEnrollmentStatusValues } from '../dto/entity/supplier-enrollment-row.dto';
import type { CreateSupplierEnrollmentDto } from '../dto/request/create-supplier-enrollment.dto';
import type { SetSupplierEnrollmentActiveDto } from '../dto/request/set-supplier-enrollment-active.dto';
import type { SupplierEnrolledSitesQueryDto } from '../dto/request/supplier-enrolled-sites-query.dto';
import type { SupplierEnrollmentSelectQueryDto } from '../dto/request/supplier-enrollment-select-query.dto';
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
    await this.repository.findSupplierOrThrow(supplierId);
    return (await this.repository.findAllForSupplier(supplierId)).map(SupplierEnrollmentDto.from);
  }

  // Enrolls a supplier at a site, optionally under one of its GSTIN/VAT registrations, validating every pick
  async create(dto: CreateSupplierEnrollmentDto): Promise<CreateResponseDto<SupplierEnrollmentDto>> {
    const { supplierId, siteId, ...picks } = dto;
    const supplier = await this.repository.findSupplierOrThrow(supplierId);
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
    const enrollment = await this.repository.findBySupplierAndSiteOrThrow(supplierId, siteId);
    const supplier = await this.repository.findSupplierOrThrow(supplierId);
    await this.repository.assertPicksUsable(supplier.partyId, data);
    if (Object.keys(data).length > 0) {
      await this.repository.update(enrollment.id, data);
    }
    this.logger.log(`Updated enrollment of supplier ${supplierId} at site ${siteId}`);
    return { success: true, message: 'Enrollment updated successfully.' };
  }

  // Activates or deactivates the supplier's own enrollment at a site; the supplier-wide flag is untouched
  async setActive(dto: SetSupplierEnrollmentActiveDto): Promise<SuccessResponseDto> {
    const enrollment = await this.repository.findBySupplierAndSiteOrThrow(dto.supplierId, dto.siteId);
    await this.repository.update(enrollment.id, { isActive: dto.isActive });
    this.logger.log(`Set supplier ${dto.supplierId} active=${dto.isActive} at site ${dto.siteId}`);
    return { success: true, message: `Enrollment ${dto.isActive ? 'activated' : 'deactivated'} at this site.` };
  }

  // Removes the supplier's enrollment at a site and its site picks
  async delete(supplierId: string, siteId: string): Promise<SuccessResponseDto> {
    const enrollment = await this.repository.findBySupplierAndSiteOrThrow(supplierId, siteId);
    await this.repository.delete(enrollment.id);
    this.logger.log(`Unenrolled supplier ${supplierId} from site ${siteId}`);
    return { success: true, message: 'Supplier unenrolled from this site.' };
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
}
