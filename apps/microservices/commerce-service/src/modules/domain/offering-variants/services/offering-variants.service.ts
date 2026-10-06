import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  BOM_RULES,
  type FulfilmentType,
  FulfilmentTypeValues,
  type OfferingVariant,
  offeringVariants,
} from '@/db/schema';
import { OfferingVariantDto, type OfferingVariantTableRowDto } from '../dto/entity/offering-variant.dto';
import type { VariantCombinationsDto } from '../dto/entity/variant-combination.dto';
import type { BulkClearVariantsTaxClassDto } from '../dto/request/bulk-clear-variants-tax-class.dto';
import type { BulkSetVariantsStatusDto } from '../dto/request/bulk-set-variants-status.dto';
import type { BulkSetVariantsTaxClassDto } from '../dto/request/bulk-set-variants-tax-class.dto';
import type { CreateVariantDto } from '../dto/request/create-variant.dto';
import type { GenerateVariantsDto } from '../dto/request/generate-variants.dto';
import type { PreviewCombinationsDto } from '../dto/request/preview-combinations.dto';
import type { SetVariantFulfilmentDto } from '../dto/request/set-variant-fulfilment.dto';
import type { SetVariantTaxClassDto } from '../dto/request/set-variant-tax-class.dto';
import type { UpdateVariantDto } from '../dto/request/update-variant.dto';
import {
  type DimensionValueRow,
  type OfferingRef,
  OfferingVariantsDomainRepository,
  type OfferingVariantTableRow,
  type VariantWithBomCount,
} from '../repositories/offering-variants.repository';

@Injectable()
export class OfferingVariantsDomainService {
  private readonly logger = new Logger(OfferingVariantsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    sku: { column: offeringVariants.sku, type: 'string' },
    externalSku: { column: offeringVariants.externalSku, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    isActive: { column: offeringVariants.isActive, type: 'boolean' },
    salesUomId: { column: offeringVariants.salesUomId, type: 'string' },
    taxClassId: { column: offeringVariants.taxClassId, type: 'string' },
    isTaxClassOverridden: { column: offeringVariants.isTaxClassOverridden, type: 'boolean' },
    fulfilmentType: { column: offeringVariants.fulfilmentType, type: 'string' },
    isFulfilmentOverridden: { column: offeringVariants.isFulfilmentOverridden, type: 'boolean' },
  };

  constructor(private readonly repository: OfferingVariantsDomainRepository) {}

  // Returns paginated, filtered, sorted variants of one offering for the data table
  async findForTable(
    offeringId: string,
    state: TableViewState,
  ): Promise<{ result: OfferingVariantTableRowDto[]; count: number }> {
    await this.requireReachableOffering(offeringId);

    const filterWhere = FilterProcessor.buildWhere(state.filters, OfferingVariantsDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, OfferingVariantsDomainService.SEARCH_FIELD_MAP);
    const where = and(eq(offeringVariants.offeringId, offeringId), filterWhere, searchWhere) as SQL;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...OfferingVariantsDomainService.SEARCH_FIELD_MAP,
      ...OfferingVariantsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(offeringVariants.sku)],
      limit,
      offset,
    });

    return { result: rows.map((row) => this.toTableRow(row)), count };
  }

  // Options for the breadcrumb switcher: this offering's variants, keyed by SKU
  async findForSelect(offeringId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    await this.requireReachableOffering(offeringId);
    return this.repository.findForSelectInOffering(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'sku',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        search: query.search,
        limit: query.limit,
        offset: query.offset,
        values: query.values,
        excludeIds: query.excludeIds,
        orderByKey: query.orderByKey || 'sku',
        orderDirection: query.orderDirection || 'asc',
      },
      offeringId,
    );
  }

  // Flat rows for the file export, scoped to one offering. Reach is settled first so a variant of an
  // offering this workspace cannot see never reaches the file.
  async findForExport(offeringId: string, page: { limit: number; offset: number }): Promise<Record<string, unknown>[]> {
    await this.requireReachableOffering(offeringId);
    const rows = await this.repository.findForExport(offeringId, page);
    return rows.map((row) => ({
      SKU: row.sku,
      'External SKU': row.externalSku ?? '',
      Name: row.name,
      Combination: row.values.map((value) => value.value).join(' \u00b7 '),
      'Sold in': row.salesUomName ?? '',
      'Tax Class': row.taxClassName ?? '',
      'Tax Class Overridden': row.isTaxClassOverridden ? 'Yes' : 'No',
      Fulfilment: row.fulfilmentType,
      'Fulfilment Overridden': row.isFulfilmentOverridden ? 'Yes' : 'No',
      Components: row.bomLineCount,
      Status: row.isActive && row.isOfferingActive ? 'Active' : 'Inactive',
    }));
  }

  async findById(id: string): Promise<OfferingVariantDto> {
    const variant = await this.repository.findByIdWithNames(id);
    if (!variant) throw new NotFoundException('Variant not found.');
    await this.requireReachableOffering(variant.offeringId);
    return this.toDto(variant);
  }

  async previewCombinations(data: PreviewCombinationsDto): Promise<VariantCombinationsDto> {
    const offering = await this.requireReachableOffering(data.offeringId);
    const valueRows = await this.repository.findDimensionValues(data.offeringId);
    const byValueId = new Map(valueRows.map((row) => [row.valueId, row]));

    const axes = data.axes
      .map((axis) => axis.valueIds.map((id) => this.requireValueOnDimension(id, axis.dimensionId, byValueId)))
      .filter((axis) => axis.length > 0)
      .sort((a, b) => a[0].dimensionSortOrder - b[0].dimensionSortOrder);

    if (axes.length === 0) return { combinations: [], total: 0, existingCount: 0 };

    const product = axes.reduce<DimensionValueRow[][]>(
      (acc, axis) => acc.flatMap((row) => axis.map((value) => [...row, value])),
      [[]],
    );

    const existing = await this.existingCombinationKeys(data.offeringId);
    const combinations = product.map((ordered) => ({
      valueIds: ordered.map((row) => row.valueId),
      sku: this.deriveSku(offering.code, ordered),
      name: this.deriveName(offering.name, ordered),
      labels: ordered.map((row) => row.value).join(' \u00b7 '),
      exists: existing.has(this.combinationKey(ordered.map((row) => row.valueId))),
    }));

    return {
      combinations,
      total: combinations.length,
      existingCount: combinations.filter((combination) => combination.exists).length,
    };
  }

  // Creates every selected combination that does not exist yet. Additive by design: a combination the
  // caller left out is never deleted, because removing a variant may destroy stock or order history.
  async generate(data: GenerateVariantsDto): Promise<SuccessResponseDto> {
    const { message } = await this.runGenerate(data);
    return { success: true, message };
  }

  // Shared by generate() and create(): returns the rows it inserted, so a single-variant create can
  // report the variant it actually made rather than guessing at the end of a sorted list.
  private async runGenerate(data: GenerateVariantsDto): Promise<{ created: OfferingVariant[]; message: string }> {
    const offering = await this.requireOwnedOffering(data.offeringId);
    const dimensionCount = await this.repository.countDimensions(data.offeringId);
    if (dimensionCount === 0) {
      throw new ConflictException({
        label: 'No Dimensions',
        detail: `"${offering.name}" has no dimensions yet. Add at least one before generating variants.`,
      });
    }

    const valueRows = await this.repository.findDimensionValues(data.offeringId);
    const byValueId = new Map(valueRows.map((row) => [row.valueId, row]));
    const existing = await this.existingCombinationKeys(data.offeringId);

    const planned: { valueIds: string[]; ordered: DimensionValueRow[]; sku: string; key: string }[] = [];
    const seen = new Set<string>();

    for (const combination of data.combinations) {
      const ordered = this.resolveCombination(combination.valueIds, byValueId);
      const key = this.combinationKey(ordered.map((row) => row.valueId));
      if (existing.has(key) || seen.has(key)) continue;
      seen.add(key);
      planned.push({ valueIds: combination.valueIds, ordered, sku: this.deriveSku(offering.code, ordered), key });
    }

    if (planned.length === 0) {
      return { created: [], message: 'Nothing to create — every selected combination already exists.' };
    }

    await this.assertSkusFree(planned.map((plan) => plan.sku));

    const created = await this.repository.transaction(async () => {
      const inserted = await this.repository.insertVariants(
        planned.map((plan) => ({
          offeringId: data.offeringId,
          sku: plan.sku,
          name: this.deriveName(data.namePrefix ?? offering.name, plan.ordered),
          salesUomId: data.salesUomId,
          taxClassId: offering.taxClassId,
          fulfilmentType: offering.fulfilmentType,
          combinationKey: plan.key,
          isActive: offering.fulfilmentType === FulfilmentTypeValues.SERVICE,
        })),
      );

      await this.repository.insertVariantValues(
        inserted.flatMap((variant, index) =>
          planned[index].ordered.map((row) => ({
            variantId: variant.id,
            dimensionId: row.dimensionId,
            valueId: row.valueId,
          })),
        ),
      );

      return inserted;
    });

    const skipped = data.combinations.length - planned.length;
    this.logger.log(`Generated ${planned.length} variants for ${offering.code}`);
    return {
      created,
      message: `${pluralize('variant', planned.length, true)} created${skipped > 0 ? `. ${skipped} already existed` : ''}.`,
    };
  }

  // One combination, added by hand rather than generated from the matrix
  async create(data: CreateVariantDto): Promise<CreateResponseDto<OfferingVariantDto>> {
    const { created } = await this.runGenerate({
      offeringId: data.offeringId,
      salesUomId: data.salesUomId,
      combinations: [{ valueIds: data.valueIds }],
    });
    if (created.length === 0) {
      throw new ConflictException({
        label: 'Variant Exists',
        detail: 'A variant with this combination already exists.',
      });
    }
    if (data.externalSku) await this.repository.update(created[0].id, { externalSku: data.externalSku });
    // Re-read rather than decorating the insert's own rows: `returning()` carries no joined names
    return { success: true, message: `"${created[0].sku}" created.`, data: await this.findById(created[0].id) };
  }

  async update(id: string, data: Omit<UpdateVariantDto, 'id'>): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);
    if (data.isActive) await this.assertBomSatisfied(variant);
    await this.repository.update(id, data);
    return { success: true, message: `"${variant.sku}" updated.` };
  }

  // The batch form of the isActive flip. Ownership is settled once on the parent offering, and every
  // variant is checked before anything is written — a half-applied bulk action is worse than a refusal.
  async bulkSetStatus(data: BulkSetVariantsStatusDto): Promise<SuccessResponseDto> {
    const offering = await this.repository.findOffering(data.offeringId);
    if (!offering) throw new NotFoundException('Offering not found.');
    if (!offering.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Offering',
        detail: `"${offering.name}" belongs to a wider scope. Switch to the workspace that owns it.`,
      });
    }

    const variants = await this.repository.findManyInOffering(data.offeringId, data.ids);
    if (variants.length !== data.ids.length) {
      throw new NotFoundException({
        label: 'Variants Not Found',
        detail: `Some of the selected variants no longer belong to "${offering.name}". Refresh and try again.`,
      });
    }

    if (data.isActive) {
      const missing = variants.filter((variant) => variant.bomLineCount < BOM_RULES[variant.fulfilmentType].min);
      if (missing.length > 0) {
        throw new ConflictException({
          label: 'No Bill Of Materials',
          detail: `${pluralize('variant', missing.length, true)} in this selection still need components before they can be sold: ${missing.map((variant) => `"${variant.sku}"`).join(', ')}.`,
        });
      }
    }

    await this.repository.bulkSetStatus(data.ids, data.isActive);
    this.logger.log(`Bulk ${data.isActive ? 'activated' : 'deactivated'} ${data.ids.length} variants`);
    return {
      success: true,
      message: `${pluralize('variant', variants.length, true)} marked ${data.isActive ? 'active' : 'inactive'}.`,
    };
  }

  // The batch form of setTaxClass. Ownership is settled once on the parent offering and every id is
  // checked before anything is written, so the whole selection moves together or nothing does.
  async bulkSetTaxClass(data: BulkSetVariantsTaxClassDto): Promise<SuccessResponseDto> {
    const offering = await this.requireOwnedOffering(data.offeringId);

    const variants = await this.requireVariantsInOffering(offering, data.ids);

    await this.repository.bulkSetTaxClass(data.ids, data.taxClassId, true);
    this.logger.log(`Bulk overrode tax class on ${data.ids.length} variants of ${offering.code}`);
    return {
      success: true,
      message: `Tax class overridden on ${pluralize('variant', variants.length, true)}.`,
    };
  }

  // The batch form of clearTaxClassOverride — each selected variant resynchronises with the offering
  async bulkClearTaxClass(data: BulkClearVariantsTaxClassDto): Promise<SuccessResponseDto> {
    const offering = await this.requireOwnedOffering(data.offeringId);
    const variants = await this.requireVariantsInOffering(offering, data.ids);

    await this.repository.bulkSetTaxClass(data.ids, offering.taxClassId, false);
    this.logger.log(`Bulk cleared tax class override on ${data.ids.length} variants of ${offering.code}`);
    return {
      success: true,
      message: `${pluralize('variant', variants.length, true)} now follow "${offering.name}".`,
    };
  }

  // Pins this variant's own tax class, exempting it from the offering's cascade from here on
  async setTaxClass(id: string, data: SetVariantTaxClassDto): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);
    await this.repository.update(id, { taxClassId: data.taxClassId, isTaxClassOverridden: true });
    this.logger.log(`Overrode tax class on variant ${variant.sku} (${id})`);
    return { success: true, message: `Tax class overridden on "${variant.sku}".` };
  }

  // Drops the override and resynchronises with the parent offering
  async clearTaxClassOverride(id: string): Promise<SuccessResponseDto> {
    const { variant, offering } = await this.requireOwnedVariant(id);
    if (!variant.isTaxClassOverridden) {
      return { success: true, message: `"${variant.sku}" already follows its offering.` };
    }
    await this.repository.update(id, { taxClassId: offering.taxClassId, isTaxClassOverridden: false });
    this.logger.log(`Cleared tax class override on variant ${variant.sku} (${id})`);
    return { success: true, message: `"${variant.sku}" now follows "${offering.name}".` };
  }

  // Pins this variant's own fulfilment type, exempting it from the offering's cascade from here on.
  // Refused while the bill of materials it already holds would break the new type's rule — changing
  // the label must not leave a variant in a state its own rule forbids.
  async setFulfilment(id: string, data: Omit<SetVariantFulfilmentDto, 'id'>): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);
    const next = data.fulfilmentType as FulfilmentType;
    if (variant.fulfilmentType === next && variant.isFulfilmentOverridden) {
      return { success: true, message: `"${variant.sku}" already uses that fulfilment type.` };
    }

    await this.assertBomFits(variant, next);
    await this.repository.update(id, { fulfilmentType: next, isFulfilmentOverridden: true });
    this.logger.log(`Overrode fulfilment on variant ${variant.sku} (${id}) to ${next}`);
    return { success: true, message: `"${variant.sku}" is now ${next.toLowerCase()}.` };
  }

  // Drops the override and resynchronises with the parent offering
  async clearFulfilmentOverride(id: string): Promise<SuccessResponseDto> {
    const { variant, offering } = await this.requireOwnedVariant(id);
    if (!variant.isFulfilmentOverridden) {
      return { success: true, message: `"${variant.sku}" already follows its offering.` };
    }

    await this.assertBomFits(variant, offering.fulfilmentType);
    await this.repository.update(id, { fulfilmentType: offering.fulfilmentType, isFulfilmentOverridden: false });
    this.logger.log(`Cleared fulfilment override on variant ${variant.sku} (${id})`);
    return { success: true, message: `"${variant.sku}" now follows "${offering.name}".` };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);

    // Values and bill-of-materials lines cascade, but order lines do not — a sold variant is history
    const orderLines = await this.repository.countOrderLines(id);
    if (orderLines > 0) {
      throw new ConflictException({
        label: 'Variant Sold',
        detail: `"${variant.sku}" appears on ${pluralize('order line', orderLines, true)} and cannot be deleted. Unpublish it instead so it stops being sellable.`,
      });
    }

    await this.repository.transaction(async () => {
      // offering_bom and offering_variant_values both cascade on the variant, so only the values
      // need clearing here — they carry no cascade of their own
      await this.repository.deleteVariantValues(id);
      await this.repository.delete(id);
    });
    return { success: true, message: `"${variant.sku}" deleted.` };
  }

  // SKU = offering code + one value code per dimension, in dimension order
  private deriveSku(offeringCode: string, ordered: DimensionValueRow[]): string {
    return [offeringCode, ...ordered.map((row) => row.valueCode)].join('-');
  }

  private deriveName(base: string, ordered: DimensionValueRow[]): string {
    return [base, ...ordered.map((row) => row.value)].join(' · ').slice(0, 255);
  }

  private combinationKey(valueIds: string[]): string {
    return [...valueIds].sort().join('|');
  }

  private async existingCombinationKeys(offeringId: string): Promise<Set<string>> {
    return new Set(await this.repository.findCombinationKeys(offeringId));
  }

  // Two different combinations can derive the same SKU once a variant may skip a dimension — a value
  // coded "s" on Size and another on Colour both yield "<offering>-s". The SKU is unique org-wide, so
  // this reports the clash by name rather than letting the insert fail on the constraint.
  private async assertSkusFree(skus: string[]): Promise<void> {
    const seen = new Set<string>();
    const duplicated = skus.filter((sku) => {
      if (seen.has(sku)) return true;
      seen.add(sku);
      return false;
    });
    if (duplicated.length > 0) {
      throw new ConflictException({
        label: 'Duplicate SKU',
        detail: `${[...new Set(duplicated)].map((sku) => `"${sku}"`).join(', ')} would be produced by more than one combination in this batch. Give the clashing values distinct codes.`,
      });
    }

    const taken = await this.repository.findTakenSkus(skus);
    if (taken.length > 0) {
      throw new ConflictException({
        label: 'SKU Taken',
        detail: `${taken.map((sku) => `"${sku}"`).join(', ')} ${taken.length === 1 ? 'is' : 'are'} already in use. A SKU is unique across the organization.`,
      });
    }
  }

  // A combination names at most one value per dimension, and need not name them all — an offering's
  // dimensions are the axes available, not a set every variant has to fill. The rows come back in
  // dimension order, which is what gives the SKU its segment order.
  private requireValueOnDimension(
    valueId: string,
    dimensionId: string,
    byValueId: Map<string, DimensionValueRow>,
  ): DimensionValueRow {
    const row = byValueId.get(valueId);
    if (!row || row.dimensionId !== dimensionId) {
      throw new BadRequestException({
        label: 'Unknown Value',
        detail: 'One of the selected values does not belong to this offering.',
        errors: [{ field: 'axes', message: 'Unknown value' }],
      });
    }
    return row;
  }

  private resolveCombination(valueIds: string[], byValueId: Map<string, DimensionValueRow>): DimensionValueRow[] {
    const rows = valueIds.map((id) => {
      const row = byValueId.get(id);
      if (!row) {
        throw new BadRequestException({
          label: 'Unknown Value',
          detail: 'One of the selected values does not belong to this offering.',
          errors: [{ field: 'valueIds', message: 'Unknown value' }],
        });
      }
      return row;
    });
    const dimensions = new Set(rows.map((row) => row.dimensionId));
    if (dimensions.size !== rows.length) {
      throw new BadRequestException({
        label: 'Duplicate Dimension',
        detail: 'A combination may name only one value per dimension.',
        errors: [{ field: 'valueIds', message: 'Two values from one dimension' }],
      });
    }
    return rows.sort((a, b) => a.dimensionSortOrder - b.dimensionSortOrder);
  }

  // Whether the components a variant already holds are legal under a fulfilment type it is moving to
  private async assertBomFits(variant: OfferingVariant, next: FulfilmentType): Promise<void> {
    const rule = BOM_RULES[next];
    const lines = await this.repository.countBomLines(variant.id);
    if (lines > rule.max) {
      throw new ConflictException({
        label: 'Too Many Components',
        detail: `"${variant.sku}" holds ${pluralize('component', lines, true)}, but ${next.toLowerCase()} allows ${rule.max === 1 ? 'exactly one' : 'any number'}. Remove the extras first.`,
      });
    }
    if (variant.isActive && lines < rule.min) {
      throw new ConflictException({
        label: 'No Bill Of Materials',
        detail: `"${variant.sku}" is on sale with ${pluralize('component', lines, true)}, which ${next.toLowerCase()} does not allow. Deactivate it first, or add components.`,
      });
    }
  }

  // A variant may only go active once its fulfilment type's bill of materials rule is met
  private async assertBomSatisfied(variant: OfferingVariant): Promise<void> {
    const rule = BOM_RULES[variant.fulfilmentType];
    const lines = await this.repository.findBomLines([variant.id]);
    if (lines.length < rule.min) {
      throw new ConflictException({
        label: 'No Bill Of Materials',
        detail: `"${variant.sku}" needs at least ${pluralize('component', rule.min, true)} before it can be sold.`,
      });
    }
  }

  // A table row stops at what the list read selected — no inventory counterpart, because that join
  // only runs for the detail view
  private toTableRow(variant: OfferingVariantTableRow): OfferingVariantTableRowDto {
    return OfferingVariantDto.fromTableRow(variant, {
      values: variant.values,
      bomLineCount: variant.bomLineCount,
      salesUomName: variant.salesUomName,
      taxClassName: variant.taxClassName,
      canMarkActive: variant.canMarkActive,
      canDelete: variant.canDelete,
    });
  }

  // The rows arrive with their many-to-one names already joined; the one-to-many collections ride
  // along as aggregates, so this is a pure mapping
  private toDto(variant: OfferingVariantTableRow): OfferingVariantDto {
    return OfferingVariantDto.from(variant, {
      values: variant.values,
      bomLineCount: variant.bomLineCount,
      salesUomName: variant.salesUomName,
      canMarkActive: variant.canMarkActive,
      canDelete: variant.canDelete,
      taxClassName: variant.taxClassName,
    });
  }

  private async requireReachableOffering(offeringId: string): Promise<OfferingRef> {
    const offering = await this.repository.findOffering(offeringId);
    if (!offering) throw new NotFoundException('Offering not found.');
    return offering;
  }

  // Every id must still belong to this offering, so a stale selection cannot reach another's variants
  private async requireVariantsInOffering(offering: OfferingRef, ids: string[]): Promise<VariantWithBomCount[]> {
    const variants = await this.repository.findManyInOffering(offering.id, ids);
    if (variants.length !== ids.length) {
      throw new NotFoundException({
        label: 'Variants Not Found',
        detail: `Some of the selected variants no longer belong to "${offering.name}". Refresh and try again.`,
      });
    }
    return variants;
  }

  private async requireOwnedOffering(offeringId: string): Promise<OfferingRef> {
    const offering = await this.requireReachableOffering(offeringId);
    if (!offering.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Offering',
        detail: `"${offering.name}" belongs to a wider scope. Switch to the workspace that owns it to change its variants.`,
      });
    }
    return offering;
  }

  // Returns the parent alongside the variant: resolving it is how ownership is checked, so a caller
  // that needs the offering has it already rather than fetching the same row again.
  private async requireOwnedVariant(id: string): Promise<{ variant: OfferingVariant; offering: OfferingRef }> {
    const variant = await this.repository.findById(id);
    if (!variant) throw new NotFoundException('Variant not found.');
    const offering = await this.requireOwnedOffering(variant.offeringId);
    return { variant, offering };
  }
}
