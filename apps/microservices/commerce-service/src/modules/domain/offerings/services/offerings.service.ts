import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { type FulfilmentType, FulfilmentTypeValues, offerings } from '@/db/schema';
import { OfferingDto } from '../dto/entity/offering.dto';
import type { BulkSetOfferingStatusDto } from '../dto/request/bulk-set-offering-status.dto';
import type { CreateOfferingDto } from '../dto/request/create-offering.dto';
import type { SetOfferingFulfilmentDto } from '../dto/request/set-offering-fulfilment.dto';
import type { SetOfferingStatusDto } from '../dto/request/set-offering-status.dto';
import type { SetOfferingTaxClassDto } from '../dto/request/set-offering-tax-class.dto';
import type { UpdateOfferingDto } from '../dto/request/update-offering.dto';
import { OfferingsDomainRepository, type OfferingWithOwnership } from '../repositories/offerings.repository';

// Mirrors the variant service's rules — an offering may only take a type its variants can satisfy
const BOM_RULES = {
  [FulfilmentTypeValues.STOCK]: { min: 1, max: 1 },
  [FulfilmentTypeValues.ASSEMBLY]: { min: 1, max: Number.POSITIVE_INFINITY },
  [FulfilmentTypeValues.COMPOSITE]: { min: 1, max: Number.POSITIVE_INFINITY },
  [FulfilmentTypeValues.SERVICE]: { min: 0, max: Number.POSITIVE_INFINITY },
} as const;

@Injectable()
export class OfferingsDomainService {
  private readonly logger = new Logger(OfferingsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    name: { column: offerings.name, type: 'string' },
    code: { column: offerings.code, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    fulfilmentType: { column: offerings.fulfilmentType, type: 'string' },
    categoryId: { column: offerings.categoryId, type: 'string' },
    taxClassId: { column: offerings.taxClassId, type: 'string' },
    isActive: { column: offerings.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: OfferingsDomainRepository) {}

  // Returns paginated, filtered, and sorted offerings for the data table
  async findForTable(state: TableViewState): Promise<{ result: OfferingDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, OfferingsDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, OfferingsDomainService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...OfferingsDomainService.SEARCH_FIELD_MAP,
      ...OfferingsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [asc(offerings.name)],
      limit,
      offset,
    });

    return { result: rows.map((row) => this.toDto(row)), count };
  }

  // Offering options for select dropdowns, restricted to active offerings
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      conditions: [eq(offerings.isActive, true)],
    });
  }

  async findById(id: string): Promise<OfferingDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Offering not found.');
    return this.toDto(row);
  }

  // Creates an offering owned by the calling workspace; the database stamps the owner from its GUCs
  async create(data: CreateOfferingDto): Promise<CreateResponseDto<OfferingDto>> {
    const { nameTaken, codeTaken } = await this.repository.findConflicts(data.name, data.code);
    if (nameTaken) {
      throw new ConflictException({
        label: 'Duplicate Name',
        detail: `You already have an offering called "${data.name}".`,
        errors: [{ field: 'name', message: 'Name already in use' }],
      });
    }
    if (codeTaken) {
      throw new ConflictException({
        label: 'Duplicate Code',
        detail: `The code "${data.code}" is already in use in this organization. Codes must be unique because every variant SKU is built from them.`,
        errors: [{ field: 'code', message: 'Code already in use' }],
      });
    }

    const entity = await this.repository.create(data);
    this.logger.log(`Created offering ${entity.code} (${entity.id})`);
    return {
      success: true,
      message: `"${entity.name}" created. Add its dimensions, then generate variants.`,
      data: OfferingDto.from(entity, { isOwned: true, canDelete: true }),
    };
  }

  async update(id: string, data: Omit<UpdateOfferingDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await this.repository.findByName(data.name);
      if (duplicate) {
        throw new ConflictException({
          label: 'Duplicate Name',
          detail: `You already have an offering called "${data.name}".`,
          errors: [{ field: 'name', message: 'Name already in use' }],
        });
      }
    }
    if (data.code && data.code !== existing.code) this.assertCodeChangeable(existing);

    await this.repository.update(id, data);
    return { success: true, message: `"${data.name ?? existing.name}" updated.` };
  }

  // Sets the offering's tax class and cascades it to every variant that has not been overridden
  async setTaxClass(id: string, data: SetOfferingTaxClassDto): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    if (existing.taxClassId === data.taxClassId) {
      return { success: true, message: `"${existing.name}" already uses that tax class.` };
    }

    const cascaded = await this.repository.transaction(async (tx) => {
      await this.repository.update(id, { taxClassId: data.taxClassId }, tx);
      return this.repository.applyTaxClassToVariants(id, data.taxClassId, tx);
    });

    // Every variant that did not take the cascade is one holding its own class
    const overridden = existing.variantCount - cascaded;
    this.logger.log(`Set tax class on offering ${existing.code} (${id}), cascaded to ${cascaded} variants`);
    return {
      success: true,
      message: `Tax class updated on "${existing.name}" and ${pluralize('variant', cascaded, true)}${
        overridden > 0 ? `. ${pluralize('variant', overridden, true)} kept their own` : ''
      }.`,
    };
  }

  // Changes what the offering is, and cascades to every variant that has not pinned its own. Refused
  // outright when any of those variants already holds a bill of materials the new type forbids —
  // nothing is written until the whole set can move, so an offering never half-changes.
  async setFulfilment(id: string, data: Omit<SetOfferingFulfilmentDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    const next = data.fulfilmentType as FulfilmentType;
    if (existing.fulfilmentType === next) {
      return { success: true, message: `"${existing.name}" is already ${next.toLowerCase()}.` };
    }

    const rule = BOM_RULES[next];
    const breaching = await this.repository.findVariantsBreachingBomRule(id, rule.max, rule.min);
    if (breaching.length > 0) {
      throw new ConflictException({
        label: 'Variants Do Not Fit',
        detail: `${pluralize('variant', breaching.length, true)} cannot be ${next.toLowerCase()} as they stand: ${breaching.map((sku) => `"${sku}"`).join(', ')}. Adjust their components, or pin their own fulfilment type first.`,
      });
    }

    const cascaded = await this.repository.transaction(async (tx) => {
      await this.repository.update(id, { fulfilmentType: next }, tx);
      return this.repository.applyFulfilmentToVariants(id, next, tx);
    });

    const pinned = existing.variantCount - cascaded;
    this.logger.log(`Set fulfilment on offering ${existing.code} (${id}) to ${next}, cascaded to ${cascaded} variants`);
    return {
      success: true,
      message: `"${existing.name}" is now ${next.toLowerCase()}, along with ${pluralize('variant', cascaded, true)}${
        pinned > 0 ? `. ${pluralize('variant', pinned, true)} kept their own` : ''
      }.`,
    };
  }

  // An offering with no variants would be sellable with nothing to sell, so activation is gated on one
  async setStatus(id: string, data: SetOfferingStatusDto): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    if (data.isActive) {
      if (existing.variantCount === 0) {
        throw new ConflictException({
          label: 'No Variants',
          detail: `"${existing.name}" has no variants yet. Generate at least one before activating it.`,
        });
      }
    }
    await this.repository.update(id, { isActive: data.isActive });
    return { success: true, message: `"${existing.name}" ${data.isActive ? 'activated' : 'deactivated'}.` };
  }

  // The batch form of setStatus. Every id is checked before anything is written, so the whole
  // selection either moves together or nothing does — a half-applied bulk action is worse than a refusal.
  async bulkSetStatus(data: BulkSetOfferingStatusDto): Promise<SuccessResponseDto> {
    const rows = await this.repository.findByIds(data.ids);
    if (rows.length !== data.ids.length) {
      throw new NotFoundException({
        label: 'Offerings Not Found',
        detail: 'Some of the selected offerings no longer exist. Refresh and try again.',
      });
    }

    const foreign = rows.filter((row) => !row.isOwned);
    if (foreign.length > 0) {
      throw new ForbiddenException({
        label: 'Not Your Offerings',
        detail: `${pluralize('offering', foreign.length, true)} in this selection belong to a wider scope. Switch to the workspace that owns them.`,
      });
    }

    if (data.isActive) {
      const empty = rows.filter((row) => row.variantCount === 0);
      if (empty.length > 0) {
        throw new ConflictException({
          label: 'No Variants',
          detail: `${pluralize('offering', empty.length, true)} in this selection have no variants yet. Generate at least one before activating.`,
        });
      }
    }

    await this.repository.bulkSetStatus(data.ids, data.isActive);
    this.logger.log(`Bulk ${data.isActive ? 'activated' : 'deactivated'} ${data.ids.length} offerings`);
    return {
      success: true,
      message: `${pluralize('offering', rows.length, true)} marked ${data.isActive ? 'active' : 'draft'}.`,
    };
  }

  // Deleting cascades into dimensions and variants, so it is blocked while any variant exists —
  // a variant may already carry stock or sit on an order line.
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    if (existing.variantCount > 0) {
      throw new ConflictException({
        label: 'Offering In Use',
        detail: `"${existing.name}" still has ${pluralize('variant', existing.variantCount, true)}. Remove them first.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted offering ${existing.code} (${id})`);
    return { success: true, message: `"${existing.name}" deleted.` };
  }

  // The code is the first segment of every SKU derived from it. Stored SKUs are never recomputed, so
  // changing it once variants exist would leave them carrying a prefix the offering no longer has —
  // recognisable to nobody. Free to change until the first variant.
  private assertCodeChangeable(existing: OfferingWithOwnership): void {
    if (existing.variantCount > 0) {
      throw new ConflictException({
        label: 'Code Locked',
        detail: `"${existing.name}" already has ${pluralize('variant', existing.variantCount, true)}, whose SKUs were built from "${existing.code}". Delete them before recoding.`,
        errors: [{ field: 'code', message: 'Locked once variants exist' }],
      });
    }
  }

  // Loads an offering by ID, throwing if not found or owned by a wider scope
  private async requireOwned(id: string): Promise<OfferingWithOwnership> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Offering not found.');
    if (!existing.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Offering',
        detail: `"${existing.name}" belongs to a wider scope. Switch to the workspace that owns it, or create your own.`,
      });
    }
    return existing;
  }

  // A SERVICE offering needs no BOM line, so nothing is ever "missing" for one
  private toDto(row: OfferingWithOwnership): OfferingDto {
    return OfferingDto.from(row, {
      dimensionCount: row.dimensionCount,
      variantCount: row.variantCount,
      variantsMissingBomCount: row.fulfilmentType === FulfilmentTypeValues.SERVICE ? 0 : row.variantsWithoutBom,
      isOwned: row.isOwned,
      canDelete: row.isOwned && row.variantCount === 0,
    });
  }
}
