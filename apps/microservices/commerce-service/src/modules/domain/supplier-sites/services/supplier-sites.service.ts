import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { parties, partyBankAccounts, partyTaxRegistrations, supplierSites, suppliers } from '@/db/schema';
import { SiteSupplierDto, SupplierSiteDto } from '../dto/entity/supplier-site.dto';
import { SupplierSitesDomainRepository } from '../repositories/supplier-sites.repository';

export interface EnrollmentPicks {
  partyTaxRegistrationId?: string | null;
  partyBankAccountId?: string | null;
}

@Injectable()
export class SupplierSitesDomainService {
  private readonly logger = new Logger(SupplierSitesDomainService.name);

  private static readonly SUPPLIER_FIELD_MAP: FieldMap = {
    registrationNumber: { column: partyTaxRegistrations.registrationNumber, type: 'string' },
    registrationType: { column: partyTaxRegistrations.registrationType, type: 'string' },
    bankAccountName: { column: partyBankAccounts.accountName, type: 'string' },
    isActive: { column: supplierSites.isActive, type: 'boolean' },
  };

  private static readonly SITE_FIELD_MAP: FieldMap = {
    supplierName: { column: parties.displayName, type: 'string' },
    supplierCode: { column: suppliers.code, type: 'string' },
    currencyCode: { column: suppliers.currencyCode, type: 'string' },
    purchasingBlocked: { column: suppliers.purchasingBlocked, type: 'boolean' },
    isActive: { column: supplierSites.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: SupplierSitesDomainRepository) {}

  // Returns paginated site enrollments of a supplier for the LE Sites tab
  async findForSupplierTable(
    supplierId: string,
    state: TableViewState,
  ): Promise<{ result: SupplierSiteDto[]; count: number }> {
    const supplier = await this.repository.findSupplier(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierSitesDomainService.SUPPLIER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierSitesDomainService.SUPPLIER_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierSitesDomainService.SUPPLIER_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForSupplierTable(supplierId, { where, orderBy, limit, offset });
    return { result: result.map(SupplierSiteDto.from), count };
  }

  // Returns the current site's enrolled suppliers for the site Suppliers table
  async findForSiteTable(state: TableViewState): Promise<{ result: SiteSupplierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierSitesDomainService.SITE_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierSitesDomainService.SITE_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierSitesDomainService.SITE_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForSiteTable({ where, orderBy, limit, offset });
    return { result: result.map(SiteSupplierDto.from), count };
  }

  // Enrolls a supplier for a site, validating picks and auto-picking the registration when the party has exactly one
  async enroll(
    supplierId: string,
    siteId: string,
    picks?: EnrollmentPicks,
  ): Promise<CreateResponseDto<SupplierSiteDto>> {
    const supplier = await this.repository.findSupplier(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    let partyTaxRegistrationId = picks?.partyTaxRegistrationId ?? null;
    if (partyTaxRegistrationId) {
      await this.assertRegistrationBelongsToParty(partyTaxRegistrationId, supplier.partyId);
    } else {
      // Auto-pick when the party has exactly one active registration; otherwise leave null (warning badge)
      const registrations = await this.repository.findActiveRegistrationsByParty(supplier.partyId);
      if (registrations.length === 1) partyTaxRegistrationId = registrations[0].id;
    }

    const partyBankAccountId = picks?.partyBankAccountId ?? null;
    if (partyBankAccountId) {
      await this.assertBankAccountBelongsToParty(partyBankAccountId, supplier.partyId);
    }

    try {
      const entity = await this.repository.create({ supplierId, siteId, partyTaxRegistrationId, partyBankAccountId });
      this.logger.log(`Enrolled supplier ${supplierId} for site ${siteId}`);
      return { success: true, message: 'Supplier enrolled for this site.', data: SupplierSiteDto.from(entity) };
    } catch (error: unknown) {
      if (_.get(error, 'code') === '23505') {
        throw new ConflictException('Supplier is already enrolled for this site.');
      }
      throw error;
    }
  }

  // Updates an enrollment's registration/bank picks and active flag
  async updateEnrollment(id: string, data: EnrollmentPicks & { isActive?: boolean }): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithPartyId(id);
    if (!existing) throw new NotFoundException('Enrollment not found.');

    if (data.partyTaxRegistrationId) {
      await this.assertRegistrationBelongsToParty(data.partyTaxRegistrationId, existing.partyId ?? '');
    }
    if (data.partyBankAccountId) {
      await this.assertBankAccountBelongsToParty(data.partyBankAccountId, existing.partyId ?? '');
    }

    if (Object.keys(data).length > 0) {
      await this.repository.update(id, data);
    }

    this.logger.log(`Updated supplier site enrollment: ${id}`);
    return { success: true, message: 'Enrollment updated successfully.' };
  }

  // Removes an enrollment, blocking the supplier for that site again
  async unenroll(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Enrollment not found.');
    await this.repository.delete(id);
    this.logger.log(`Unenrolled supplier ${existing.supplierId} from site ${existing.siteId}`);
    return { success: true, message: 'Supplier unenrolled from this site.' };
  }

  // Returns true when the supplier has an active enrollment for the site — the purchasing gate
  isEnrolled(supplierId: string, siteId: string): Promise<boolean> {
    return this.repository.isEnrolled(supplierId, siteId);
  }

  // Returns the current site's enrollment of a supplier with commercial identity, throwing when not enrolled
  async findSiteSupplier(supplierId: string, siteId: string): Promise<SiteSupplierDto> {
    const row = await this.repository.findSiteSupplier(supplierId, siteId);
    if (!row) throw new NotFoundException('Supplier is not enrolled for this site.');
    return SiteSupplierDto.from(row);
  }

  // Returns the enrollment of a supplier for a site with its pick details, or null when not enrolled
  async findEnrollment(supplierId: string, siteId: string): Promise<SupplierSiteDto | null> {
    const row = await this.repository.findBySupplierAndSite(supplierId, siteId);
    return row ? SupplierSiteDto.from(row) : null;
  }

  // Loads an enrollment by ID, throwing when it does not exist
  async findById(id: string): Promise<SupplierSiteDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Enrollment not found.');
    return SupplierSiteDto.from(row);
  }

  // Rejects registration picks that belong to a different party than the supplier's
  private async assertRegistrationBelongsToParty(registrationId: string, partyId: string): Promise<void> {
    const registration = await this.repository.findRegistrationById(registrationId);
    if (!registration || registration.partyId !== partyId) {
      throw new BadRequestException({
        label: 'Invalid Registration',
        detail: "The selected tax registration does not belong to this supplier's company.",
        errors: [{ field: 'partyTaxRegistrationId', message: 'Not a registration of this company' }],
      });
    }
  }

  // Rejects bank account picks that belong to a different party than the supplier's
  private async assertBankAccountBelongsToParty(bankAccountId: string, partyId: string): Promise<void> {
    const bankAccount = await this.repository.findBankAccountById(bankAccountId);
    if (!bankAccount || bankAccount.partyId !== partyId) {
      throw new BadRequestException({
        label: 'Invalid Bank Account',
        detail: "The selected bank account does not belong to this supplier's company.",
        errors: [{ field: 'partyBankAccountId', message: 'Not an account of this company' }],
      });
    }
  }
}
