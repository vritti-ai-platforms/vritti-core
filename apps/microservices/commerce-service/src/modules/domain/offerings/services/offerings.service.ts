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
import { FulfilmentTypeValues, offerings } from '@/db/schema';
import { OfferingDto } from '../dto/entity/offering.dto';
import type { BulkSetOfferingStatusDto } from '../dto/request/bulk-set-offering-status.dto';
import type { CreateOfferingDto } from '../dto/request/create-offering.dto';
import type { SetOfferingStatusDto } from '../dto/request/set-offering-status.dto';
import type { SetOfferingTaxClassDto } from '../dto/request/set-offering-tax-class.dto';
import type { UpdateOfferingDto } from '../dto/request/update-offering.dto';
import { OfferingsDomainRepository, type OfferingWithMeta } from '../repositories/offerings.repository';

// Postgres reports a unique violation as 23505 with the constraint name attached
function isUniqueViolation(error: unknown, constraint: string): boolean {
  const candidate = error as { code?: string; constraint?: string; constraint_name?: string };
  return candidate?.code === '23505' && (candidate.constraint ?? candidate.constraint_name) === constraint;
}

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

    const counts = await this.repository.countChildren(rows.map((row) => row.id));
    const result = rows.map((row) => {
      const count = counts.get(row.id);
      return this.toDto(row, count?.dimensions ?? 0, count?.variants ?? 0, count?.variantsWithoutBom ?? 0);
    });

    return { result, count };
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
    const row = await this.requireReachable(id);
    const counts = await this.repository.countChildren([id]);
    const count = counts.get(id);
    return this.toDto(row, count?.dimensions ?? 0, count?.variants ?? 0, count?.variantsWithoutBom ?? 0);
  }

  // Creates an offering owned by the calling workspace; the database stamps the owner from its GUCs
  async create(data: CreateOfferingDto): Promise<CreateResponseDto<OfferingDto>> {
    await this.assertNameFree(data.name);
    const created = await this.createOrConflict(data);
    this.logger.log(`Created offering ${created.code} (${created.id})`);
    return {
      success: true,
      message: `"${created.name}" created. Add its dimensions, then generate variants.`,
      data: OfferingDto.from(created, { isOwned: true, canDelete: true }),
    };
  }

  async update(id: string, data: Omit<UpdateOfferingDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) await this.assertNameFree(data.name);
    if (data.code && data.code !== existing.code) await this.assertCodeChangeable(id, existing);
    await this.updateOrConflict(id, data);
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

    const overridden = await this.repository.countTaxClassOverrides(id);
    this.logger.log(`Set tax class on offering ${existing.code} (${id}), cascaded to ${cascaded} variants`);
    return {
      success: true,
      message: `Tax class updated on "${existing.name}" and ${pluralize('variant', cascaded, true)}${
        overridden > 0 ? `. ${pluralize('variant', overridden, true)} kept their own` : ''
      }.`,
    };
  }

  // An offering with no variants would be sellable with nothing to sell, so activation is gated on one
  async setStatus(id: string, data: SetOfferingStatusDto): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    if (data.isActive) {
      const variantCount = await this.repository.countVariants(id);
      if (variantCount === 0) {
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
    const rows = await this.repository.findManyWithMeta(data.ids);
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
      const counts = await this.repository.countChildren(data.ids);
      const empty = rows.filter((row) => (counts.get(row.id)?.variants ?? 0) === 0);
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
    const variantCount = await this.repository.countVariants(id);
    if (variantCount > 0) {
      throw new ConflictException({
        label: 'Offering In Use',
        detail: `"${existing.name}" still has ${pluralize('variant', variantCount, true)}. Remove them first.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted offering ${existing.code} (${id})`);
    return { success: true, message: `"${existing.name}" deleted.` };
  }

  // The code is the first segment of every SKU derived from it. Stored SKUs are never recomputed, so
  // changing it once variants exist would leave them carrying a prefix the offering no longer has —
  // recognisable to nobody. Free to change until the first variant.
  private async assertCodeChangeable(id: string, existing: { name: string; code: string }): Promise<void> {
    const variantCount = await this.repository.countVariants(id);
    if (variantCount > 0) {
      throw new ConflictException({
        label: 'Code Locked',
        detail: `"${existing.name}" already has ${pluralize('variant', variantCount, true)}, whose SKUs were built from "${existing.code}". Delete them before recoding.`,
        errors: [{ field: 'code', message: 'Locked once variants exist' }],
      });
    }
  }

  private async updateOrConflict(id: string, data: Omit<UpdateOfferingDto, 'id'>) {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      if (isUniqueViolation(error, 'uq_offerings_org_code')) {
        throw new ConflictException({
          label: 'Code Already Used',
          detail: `The code "${data.code}" is already in use in this organization.`,
          errors: [{ field: 'code', message: 'Code already used' }],
        });
      }
      throw error;
    }
  }

  // `code` is unique per ORGANIZATION, but reach only shows this workspace its own subtree, so a
  // sibling's clashing code is invisible to a pre-check. The database is the arbiter.
  private async createOrConflict(data: CreateOfferingDto) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      if (isUniqueViolation(error, 'uq_offerings_org_code')) {
        throw new ConflictException({
          label: 'Code Already Used',
          detail: `The code "${data.code}" is already in use in this organization. Codes must be unique because every variant SKU is built from them.`,
          errors: [{ field: 'code', message: 'Code already used' }],
        });
      }
      throw error;
    }
  }

  private async assertNameFree(name: string): Promise<void> {
    const clash = await this.repository.findOwnedByName(name);
    if (clash) {
      throw new ConflictException({
        label: 'Name Already Used',
        detail: `You already have an offering called "${name}".`,
        errors: [{ field: 'name', message: 'Name already used' }],
      });
    }
  }

  private async requireReachable(id: string): Promise<OfferingWithMeta> {
    const row = await this.repository.findByIdWithMeta(id);
    if (!row) throw new NotFoundException('Offering not found.');
    return row;
  }

  // RLS already rejects the write; this fails earlier with a message that explains why
  private async requireOwned(id: string): Promise<OfferingWithMeta> {
    const row = await this.requireReachable(id);
    if (!row.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Offering',
        detail: `"${row.name}" belongs to a wider scope. Switch to the workspace that owns it, or create your own.`,
      });
    }
    return row;
  }

  // A SERVICE offering needs no BOM line, so nothing is ever "missing" for one
  private toDto(
    row: OfferingWithMeta,
    dimensionCount: number,
    variantCount: number,
    variantsWithoutBom = 0,
  ): OfferingDto {
    return OfferingDto.from(row, {
      dimensionCount,
      variantCount,
      variantsMissingBomCount: row.fulfilmentType === FulfilmentTypeValues.SERVICE ? 0 : variantsWithoutBom,
      isOwned: row.isOwned,
      canDelete: row.isOwned && variantCount === 0,
    });
  }
}
