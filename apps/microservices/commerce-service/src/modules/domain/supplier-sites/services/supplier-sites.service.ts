import { PartyFunctionsDomainService } from '@domain/party-functions/services/party-functions.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PartyFunctionTypeValues, PaymentTermStatusValues } from '@/db/schema';
import { SupplierSiteDto } from '../dto/entity/supplier-site.dto';
import { SupplierSitesDomainRepository } from '../repositories/supplier-sites.repository';

export interface EnrollmentPicks {
  paymentTermId?: string;
  partyTaxRegistrationId?: string;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
}

@Injectable()
export class SupplierSitesDomainService {
  private readonly logger = new Logger(SupplierSitesDomainService.name);

  constructor(
    private readonly repository: SupplierSitesDomainRepository,
    private readonly functionsService: PartyFunctionsDomainService,
  ) {}

  // Returns every site enrollment of a supplier; the gateway merges them into the legal entity's site list
  async findAllForSupplier(supplierId: string): Promise<SupplierSiteDto[]> {
    const supplier = await this.repository.findSupplier(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return (await this.repository.findAllForSupplier(supplierId)).map(SupplierSiteDto.from);
  }

  // Enrolls a supplier for a site under one of its active tax registrations, validating the other picks
  async enroll(
    supplierId: string,
    siteId: string,
    picks: EnrollmentPicks & { paymentTermId: string; partyTaxRegistrationId: string },
  ): Promise<CreateResponseDto<SupplierSiteDto>> {
    const supplier = await this.repository.findSupplier(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    await this.assertPaymentTermUsable(picks.paymentTermId);
    const partyTaxRegistrationId = picks.partyTaxRegistrationId;
    await this.assertRegistrationBelongsToParty(partyTaxRegistrationId, supplier.partyId);

    const partyBankAccountId = picks.partyBankAccountId ?? null;
    if (partyBankAccountId) {
      await this.assertBankAccountBelongsToParty(partyBankAccountId, supplier.partyId);
    }

    const orderRelationshipId = picks.orderRelationshipId ?? null;
    if (orderRelationshipId) {
      await this.assertOrderRelationshipBelongsToParty(orderRelationshipId, supplier.partyId);
    }

    try {
      const entity = await this.repository.create({
        supplierId,
        siteId,
        paymentTermId: picks.paymentTermId,
        partyTaxRegistrationId,
        partyBankAccountId,
        orderRelationshipId,
      });
      this.logger.log(`Enrolled supplier ${supplierId} for site ${siteId}`);
      return { success: true, message: 'Supplier enrolled for this site.', data: SupplierSiteDto.from(entity) };
    } catch (error: unknown) {
      if (_.get(error, 'code') === '23505') {
        throw new ConflictException('Supplier is already enrolled for this site.');
      }
      throw error;
    }
  }

  // Updates an enrollment's payment term, registration, bank and order-contact picks
  async updateEnrollment(id: string, data: EnrollmentPicks): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithPartyId(id);
    if (!existing) throw new NotFoundException('Enrollment not found.');

    if (data.paymentTermId) {
      await this.assertPaymentTermUsable(data.paymentTermId);
    }
    if (data.partyTaxRegistrationId) {
      await this.assertRegistrationBelongsToParty(data.partyTaxRegistrationId, existing.partyId ?? '');
    }
    if (data.partyBankAccountId) {
      await this.assertBankAccountBelongsToParty(data.partyBankAccountId, existing.partyId ?? '');
    }
    if (data.orderRelationshipId) {
      await this.assertOrderRelationshipBelongsToParty(data.orderRelationshipId, existing.partyId ?? '');
    }

    if (Object.keys(data).length > 0) {
      await this.repository.update(id, data);
    }

    this.logger.log(`Updated supplier site enrollment: ${id}`);
    return { success: true, message: 'Enrollment updated successfully.' };
  }

  // Removes an enrollment and its site picks; the next purchase from the site enrolls it again with defaults
  async unenroll(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Enrollment not found.');
    await this.repository.delete(id);
    this.logger.log(`Unenrolled supplier ${existing.supplierId} from site ${existing.siteId}`);
    return { success: true, message: 'Supplier unenrolled from this site.' };
  }

  // Returns true when the supplier is enrolled for the site — the purchasing gate
  isEnrolled(supplierId: string, siteId: string): Promise<boolean> {
    return this.repository.isEnrolled(supplierId, siteId);
  }

  async updateForSite(supplierId: string, siteId: string, data: EnrollmentPicks): Promise<SuccessResponseDto> {
    const enrollment = await this.repository.findBySupplierAndSite(supplierId, siteId);
    if (!enrollment) throw new NotFoundException('Supplier is not enrolled for this site.');
    return this.updateEnrollment(enrollment.id, data);
  }

  async unenrollForSite(supplierId: string, siteId: string): Promise<SuccessResponseDto> {
    const enrollment = await this.repository.findBySupplierAndSite(supplierId, siteId);
    if (!enrollment) throw new NotFoundException('Supplier is not enrolled for this site.');
    return this.unenroll(enrollment.id);
  }

  // Loads an enrollment by ID, throwing when it does not exist
  async findById(id: string): Promise<SupplierSiteDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Enrollment not found.');
    return SupplierSiteDto.from(row);
  }

  // Rejects payment-term picks that do not exist or are inactive
  private async assertPaymentTermUsable(paymentTermId: string): Promise<void> {
    const term = await this.repository.findPaymentTermById(paymentTermId);
    if (!term || term.status !== PaymentTermStatusValues.ACTIVE) {
      throw new BadRequestException({
        label: 'Invalid Payment Term',
        detail: term
          ? 'The selected payment term is not active. Pick an active payment term.'
          : 'The selected payment term does not exist.',
        errors: [{ field: 'paymentTermId', message: term ? 'Payment term is not active' : 'Payment term not found' }],
      });
    }
  }

  // Rejects registration picks that belong to a different party than the supplier's
  private async assertRegistrationBelongsToParty(registrationId: string, partyId: string): Promise<void> {
    const registration = await this.repository.findRegistrationById(registrationId);
    if (registration && registration.partyId === partyId && !registration.isActive) {
      throw new BadRequestException({
        label: 'Inactive Registration',
        detail: 'The selected tax registration is inactive. Pick an active registration of this company.',
        errors: [{ field: 'partyTaxRegistrationId', message: 'Registration is inactive' }],
      });
    }
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

  // Rejects order-contact picks that are not a relationship of this party or do not hold the ORDER function
  private async assertOrderRelationshipBelongsToParty(relationshipId: string, partyId: string): Promise<void> {
    const relationship = await this.repository.findRelationshipById(relationshipId);
    if (!relationship || relationship.parentPartyId !== partyId) {
      throw new BadRequestException({
        label: 'Invalid Order Contact',
        detail: "The selected order contact does not belong to this supplier's company.",
        errors: [{ field: 'orderRelationshipId', message: 'Not a contact of this company' }],
      });
    }
    const hasOrderFunction = await this.functionsService.relationshipHasFunction(
      relationshipId,
      PartyFunctionTypeValues.ORDER,
    );
    if (!hasOrderFunction) {
      throw new BadRequestException({
        label: 'Invalid Order Contact',
        detail: 'The selected contact is not marked as an order contact.',
        errors: [{ field: 'orderRelationshipId', message: 'Not an order contact of this company' }],
      });
    }
  }
}
