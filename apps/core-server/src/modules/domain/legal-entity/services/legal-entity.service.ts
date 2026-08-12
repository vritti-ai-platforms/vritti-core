import { CatalogDomainService } from '@domain/catalog/services/catalog.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { type SelectOptionsQueryDto, type SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { AUTH_STATUS_EVENTS, LegalEntityUpdatedEvent } from '@/common/events/auth-status.events';
import type { TaxRegime } from '@/db/schema';
import { normalizeLocks } from '@/rbac/permission-dependencies';
import { sequentialSortOrders } from '@/utils/sort-order';
import { LeTaxRegistrationDto } from '../dto/entity/le-tax-registration.dto';
import { LegalEntityDto } from '../dto/entity/legal-entity.dto';
import type { CreateLeTaxRegistrationInternalDto } from '../dto/request/create-le-tax-registration-internal.dto';
import type { CreateLegalEntityInternalDto } from '../dto/request/create-legal-entity-internal.dto';
import type { UpdateLegalEntityInternalDto } from '../dto/request/update-legal-entity-internal.dto';
import { LeTaxRegistrationDomainRepository } from '../repositories/le-tax-registration.repository';
import { LegalEntityDomainRepository } from '../repositories/legal-entity.repository';

@Injectable()
export class LegalEntityDomainService {
  private readonly logger = new Logger(LegalEntityDomainService.name);

  constructor(
    private readonly legalEntityRepository: LegalEntityDomainRepository,
    private readonly leTaxRegistrationRepository: LeTaxRegistrationDomainRepository,
    private readonly catalogService: CatalogDomainService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Returns legal entities as select options, excluding a node and its descendant subtree
  findForSelect(query: SelectOptionsQueryDto, excludeId?: string): Promise<SelectQueryResult> {
    return this.legalEntityRepository.findForSelectOptions(query, excludeId);
  }

  // Returns the legal entity's feature lock deny-list
  async getFeatureLocks(id: string): Promise<FeatureLocks | null> {
    const legalEntity = await this.legalEntityRepository.findById(id);
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');
    return legalEntity.featureLocks ?? null;
  }

  // Replaces the legal entity's feature lock deny-list
  async setFeatureLocks(id: string, featureLocks: FeatureLocks | null): Promise<SuccessResponseDto> {
    const legalEntity = await this.legalEntityRepository.findById(id);
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');

    const snapshot = featureLocks ? await this.catalogService.getActiveSnapshot() : null;
    const expanded = normalizeLocks(featureLocks, snapshot);

    await this.legalEntityRepository.update(id, { featureLocks: expanded, updatedAt: new Date() });

    this.logger.log(
      `Set feature locks for legal entity ${id}: ${featureLocks ? pluralize('feature', Object.keys(featureLocks).length, true) : 'inherit full plan'}`,
    );
    this.eventEmitter.emit(
      AUTH_STATUS_EVENTS.LEGAL_ENTITY_UPDATED,
      new LegalEntityUpdatedEvent(id, legalEntity.organizationId),
    );
    return { success: true, message: 'Legal entity feature locks updated successfully.' };
  }

  // Creates a legal entity after validation
  async create(orgId: string, dto: CreateLegalEntityInternalDto): Promise<LegalEntityDto> {
    const existing = await this.legalEntityRepository.findByOrgAndCode(orgId, dto.code);
    if (existing) {
      throw new ConflictException({
        label: 'Duplicate Code',
        detail: `A legal entity with code "${dto.code}" already exists in this organization.`,
      });
    }

    if (dto.parentId) await this.assertParentInOrg(dto.parentId, orgId);

    const legalEntity = await this.legalEntityRepository.create({
      organizationId: orgId,
      code: dto.code,
      name: dto.name,
      country: dto.country.toUpperCase(),
      currencyCode: dto.currencyCode.toUpperCase(),
      taxRegime: dto.taxRegime as TaxRegime,
      taxId: dto.taxId ?? null,
      ...(dto.fiscalYearStart !== undefined && { fiscalYearStart: dto.fiscalYearStart }),
      parentId: dto.parentId ?? null,
      sortOrder: dto.sortOrder ?? (await this.legalEntityRepository.nextSortOrder(orgId, dto.parentId ?? null)),
    });

    this.logger.log(`Created legal entity "${dto.name}" (${legalEntity.id}) for org ${orgId}`);
    return LegalEntityDto.from(legalEntity);
  }

  // Updates a legal entity after validation
  async update(id: string, dto: UpdateLegalEntityInternalDto): Promise<SuccessResponseDto> {
    const legalEntity = await this.legalEntityRepository.findById(id);
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');

    if (dto.code && dto.code !== legalEntity.code) {
      const existing = await this.legalEntityRepository.findByOrgAndCode(legalEntity.organizationId, dto.code);
      if (existing) {
        throw new ConflictException({
          label: 'Duplicate Code',
          detail: `A legal entity with code "${dto.code}" already exists in this organization.`,
        });
      }
    }

    if (dto.currencyCode && dto.currencyCode.toUpperCase() !== legalEntity.currencyCode) {
      const [siteCount, registrationCount] = await Promise.all([
        this.legalEntityRepository.countSitesByLegalEntity(id),
        this.leTaxRegistrationRepository.countByLegalEntity(id),
      ]);
      if (siteCount > 0 || registrationCount > 0) {
        throw new ConflictException({
          label: 'Currency Locked',
          detail: 'The base currency cannot change once the legal entity has sites or tax registrations.',
        });
      }
    }

    if (dto.parentId) {
      await this.assertParentInOrg(dto.parentId, legalEntity.organizationId);
      await this.assertNoCycle(id, dto.parentId);
    }

    const oldParentId = legalEntity.parentId;
    const reparented = dto.parentId !== undefined && dto.parentId !== oldParentId;
    const effectiveSortOrder =
      dto.sortOrder !== undefined
        ? dto.sortOrder
        : reparented
          ? await this.legalEntityRepository.nextSortOrder(legalEntity.organizationId, dto.parentId ?? null)
          : undefined;

    await this.legalEntityRepository.update(id, {
      ...(dto.code && { code: dto.code }),
      ...(dto.name && { name: dto.name }),
      ...(dto.country && { country: dto.country.toUpperCase() }),
      ...(dto.currencyCode && { currencyCode: dto.currencyCode.toUpperCase() }),
      ...(dto.taxRegime && { taxRegime: dto.taxRegime as TaxRegime }),
      ...(dto.taxId !== undefined && { taxId: dto.taxId }),
      ...(dto.fiscalYearStart !== undefined && { fiscalYearStart: dto.fiscalYearStart }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(effectiveSortOrder !== undefined && { sortOrder: effectiveSortOrder }),
      updatedAt: new Date(),
    });

    if (reparented) await this.compactSiblings(legalEntity.organizationId, oldParentId);

    this.logger.log(`Updated legal entity ${id}`);
    this.eventEmitter.emit(
      AUTH_STATUS_EVENTS.LEGAL_ENTITY_UPDATED,
      new LegalEntityUpdatedEvent(id, legalEntity.organizationId),
    );
    return { success: true, message: 'Legal entity updated successfully.' };
  }

  // Deactivates a legal entity
  async deactivate(id: string): Promise<SuccessResponseDto> {
    const legalEntity = await this.legalEntityRepository.findById(id);
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');

    await this.legalEntityRepository.update(id, { isActive: false, updatedAt: new Date() });

    this.logger.log(`Deactivated legal entity "${legalEntity.name}" (${id})`);
    return { success: true, message: 'Legal entity deactivated successfully.' };
  }

  // Deletes a legal entity after reference checks
  async remove(id: string): Promise<SuccessResponseDto> {
    const legalEntity = await this.legalEntityRepository.findById(id);
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');

    const siteCount = await this.legalEntityRepository.countSitesByLegalEntity(id);
    if (siteCount > 0) {
      throw new ConflictException({
        label: 'Cannot Delete',
        detail: `This legal entity is linked to ${pluralize('site', siteCount, true)}. Unlink them before deleting.`,
      });
    }

    const childCount = await this.legalEntityRepository.countChildren(id);
    if (childCount > 0) {
      throw new ConflictException({
        label: 'Cannot Delete',
        detail: `This legal entity has ${pluralize('child legal entity', childCount, true)}. Remove or reassign them first.`,
      });
    }

    const { organizationId, parentId } = legalEntity;
    await this.legalEntityRepository.delete(id);

    await this.compactSiblings(organizationId, parentId);

    this.logger.log(`Deleted legal entity "${legalEntity.name}" (${id})`);
    this.eventEmitter.emit(
      AUTH_STATUS_EVENTS.LEGAL_ENTITY_UPDATED,
      new LegalEntityUpdatedEvent(id, legalEntity.organizationId),
    );
    return { success: true, message: 'Legal entity deleted successfully.' };
  }

  // Reorders sibling legal entities
  async reorder(orgId: string, ids: string[]): Promise<SuccessResponseDto> {
    const legalEntities = await this.legalEntityRepository.findByIds(orgId, ids);
    if (legalEntities.length !== ids.length) {
      throw new BadRequestException({
        label: 'Invalid Legal Entities',
        detail: 'One or more legal entities do not exist or belong to a different organization.',
      });
    }

    await this.legalEntityRepository.setSortOrders(sequentialSortOrders(ids));

    this.logger.log(`Reordered ${pluralize('legal entity', ids.length, true)} for org ${orgId}`);
    for (const legalEntity of legalEntities) {
      this.eventEmitter.emit(
        AUTH_STATUS_EVENTS.LEGAL_ENTITY_UPDATED,
        new LegalEntityUpdatedEvent(legalEntity.id, orgId),
      );
    }
    return { success: true, message: 'Legal entities reordered successfully.' };
  }

  // Resequences a parent's siblings to close gaps
  private async compactSiblings(orgId: string, parentId: string | null): Promise<void> {
    const siblings = await this.legalEntityRepository.siblingsOrdered(orgId, parentId);
    if (siblings.length === 0) return;
    await this.legalEntityRepository.setSortOrders(sequentialSortOrders(siblings.map((sibling) => sibling.id)));
  }

  // Adds a tax registration to a legal entity
  async addRegistration(legalEntityId: string, dto: CreateLeTaxRegistrationInternalDto): Promise<LeTaxRegistrationDto> {
    const legalEntity = await this.legalEntityRepository.findById(legalEntityId);
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');

    const existing = await this.leTaxRegistrationRepository.findByLegalEntityAndTaxNumber(legalEntityId, dto.taxNumber);
    if (existing) {
      throw new ConflictException({
        label: 'Duplicate Registration',
        detail: `Tax number "${dto.taxNumber}" is already registered on this legal entity.`,
      });
    }

    const registration = await this.leTaxRegistrationRepository.create({
      organizationId: legalEntity.organizationId,
      legalEntityId,
      taxNumber: dto.taxNumber,
      region: dto.region ?? null,
    });

    this.logger.log(`Added tax registration "${dto.taxNumber}" to legal entity ${legalEntityId}`);
    return LeTaxRegistrationDto.from(registration);
  }

  // Deletes a tax registration after reference checks
  async removeRegistration(legalEntityId: string, registrationId: string): Promise<SuccessResponseDto> {
    const registration = await this.leTaxRegistrationRepository.findById(registrationId);
    if (!registration || registration.legalEntityId !== legalEntityId) {
      throw new NotFoundException('Tax registration not found.');
    }

    const siteCount = await this.leTaxRegistrationRepository.countSitesByRegistration(registrationId);
    if (siteCount > 0) {
      throw new ConflictException({
        label: 'Cannot Delete',
        detail: `This tax registration is linked to ${pluralize('site', siteCount, true)}. Unlink them before deleting.`,
      });
    }

    await this.leTaxRegistrationRepository.delete(registrationId);

    this.logger.log(
      `Deleted tax registration "${registration.taxNumber}" (${registrationId}) from legal entity ${legalEntityId}`,
    );
    return { success: true, message: 'Tax registration deleted successfully.' };
  }

  // Returns the org's legal entities and tax registrations
  async listByOrg(
    orgId: string,
  ): Promise<{ legalEntities: LegalEntityDto[]; taxRegistrations: LeTaxRegistrationDto[] }> {
    const [entities, registrations] = await Promise.all([
      this.legalEntityRepository.findByOrg(orgId),
      this.leTaxRegistrationRepository.findByOrg(orgId),
    ]);

    return {
      legalEntities: entities.map(LegalEntityDto.from),
      taxRegistrations: registrations.map(LeTaxRegistrationDto.from),
    };
  }

  // Ensures the parent exists in the same organization
  private async assertParentInOrg(parentId: string, orgId: string): Promise<void> {
    const parent = await this.legalEntityRepository.findById(parentId);
    if (!parent || parent.organizationId !== orgId) {
      throw new BadRequestException({
        label: 'Invalid Parent',
        detail: 'The parent legal entity does not exist or belongs to a different organization.',
      });
    }
  }

  // Rejects a parent that would form a cycle
  private async assertNoCycle(id: string, parentId: string): Promise<void> {
    let cursor: string | null = parentId;
    let guard = 0;
    while (cursor && guard < 100) {
      if (cursor === id) {
        throw new BadRequestException({
          label: 'Invalid Parent',
          detail: 'A legal entity cannot be nested under itself or one of its own subsidiaries.',
        });
      }
      const node = await this.legalEntityRepository.findById(cursor);
      cursor = node?.parentId ?? null;
      guard += 1;
    }
  }
}
