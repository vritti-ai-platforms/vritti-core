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
import { and, asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { type FulfilmentType, FulfilmentTypeValues, type OfferingVariant, offeringVariants } from '@/db/schema';
import { type OfferingBomLineDto, OfferingVariantDto } from '../dto/entity/offering-variant.dto';
import type { VariantCombinationsDto } from '../dto/entity/variant-combination.dto';
import type { AddBomLineDto, UpdateBomLineDto } from '../dto/request/bom-line.dto';
import type { BulkSetVariantsStatusDto } from '../dto/request/bulk-set-variants-status.dto';
import type { CreateVariantDto } from '../dto/request/create-variant.dto';
import type { GenerateVariantsDto } from '../dto/request/generate-variants.dto';
import type { PreviewCombinationsDto } from '../dto/request/preview-combinations.dto';
import type { SetVariantFulfilmentDto } from '../dto/request/set-variant-fulfilment.dto';
import type { SetVariantTaxClassDto } from '../dto/request/set-variant-tax-class.dto';
import type { UpdateVariantDto } from '../dto/request/update-variant.dto';
import type { UpsertBomDto } from '../dto/request/upsert-bom.dto';
import {
  type DimensionValueRow,
  type OfferingRef,
  OfferingVariantsDomainRepository,
  type OfferingVariantWithNames,
} from '../repositories/offering-variants.repository';

const BOM_RULES = {
  [FulfilmentTypeValues.STOCK]: { min: 1, max: 1 },
  [FulfilmentTypeValues.ASSEMBLY]: { min: 1, max: Number.POSITIVE_INFINITY },
  [FulfilmentTypeValues.COMPOSITE]: { min: 1, max: Number.POSITIVE_INFINITY },
  [FulfilmentTypeValues.SERVICE]: { min: 0, max: Number.POSITIVE_INFINITY },
} as const;

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
  ): Promise<{ result: OfferingVariantDto[]; count: number }> {
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
      orderBy: orderBy.length > 0 ? orderBy : [asc(offeringVariants.sortOrder), asc(offeringVariants.sku)],
      limit,
      offset,
    });

    return { result: rows.map((row) => this.toDto(row)), count };
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

  async findById(id: string): Promise<OfferingVariantDto> {
    const variant = await this.repository.findByIdWithNames(id);
    if (!variant) throw new NotFoundException('Variant not found.');
    await this.requireReachableOffering(variant.offeringId);
    const lines = (await this.repository.findBomLines([variant.id])) as OfferingBomLineDto[];
    return this.toDto(variant, lines);
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

    const planned: { valueIds: string[]; ordered: DimensionValueRow[]; sku: string }[] = [];
    const seen = new Set<string>();

    for (const combination of data.combinations) {
      const ordered = this.resolveCombination(combination.valueIds, byValueId);
      const key = this.combinationKey(ordered.map((row) => row.valueId));
      if (existing.has(key) || seen.has(key)) continue;
      seen.add(key);
      planned.push({ valueIds: combination.valueIds, ordered, sku: this.deriveSku(offering.code, ordered) });
    }

    if (planned.length === 0) {
      return { created: [], message: 'Nothing to create — every selected combination already exists.' };
    }

    await this.assertSkusFree(planned.map((plan) => plan.sku));

    const created = await this.repository.transaction(async () => {
      const inserted = await this.repository.insertVariants(
        planned.map((plan, index) => ({
          offeringId: data.offeringId,
          sku: plan.sku,
          name: this.deriveName(data.namePrefix ?? offering.name, plan.ordered),
          salesUomId: data.salesUomId,
          sortOrder: index,
          taxClassId: offering.taxClassId,
          fulfilmentType: offering.fulfilmentType,
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
      message: `${pluralize('variant', variants.length, true)} marked ${data.isActive ? 'active' : 'draft'}.`,
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
      await this.repository.deleteVariantValues(id);
      await this.repository.replaceBom(id, []);
      await this.repository.delete(id);
    });
    return { success: true, message: `"${variant.sku}" deleted.` };
  }

  // Links the inventory item already carrying this variant's SKU, at quantity 1 in that item's own
  // stocking unit. The suggestion is resolved server-side, so the caller names no item and cannot
  // pass this off as a way to link something arbitrary under a narrower grant.
  async addSuggestedComponent(variantId: string): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(variantId);

    const suggestion = await this.repository.findInventoryItemBySku(variant.sku);
    if (!suggestion) {
      throw new ConflictException({
        label: 'No Suggestion',
        detail: `No inventory item carries the SKU "${variant.sku}", so there is nothing to link.`,
      });
    }

    const lines = await this.repository.findBomLines([variantId]);
    if (lines.some((line) => line.inventoryItemId === suggestion.id)) {
      throw new ConflictException({
        label: 'Already Linked',
        detail: `"${suggestion.name}" is already a component of "${variant.sku}".`,
      });
    }

    return this.upsertBom({
      variantId,
      lines: [
        ...lines.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          quantity: line.quantity,
          uomId: line.uomId,
        })),
        { inventoryItemId: suggestion.id, quantity: 1, uomId: suggestion.uomId },
      ],
    });
  }

  // Adds one component. The type's maximum is checked against what is already there rather than
  // against a submitted list, so two people adding at once cannot both slip past it.
  async addBomLine(data: AddBomLineDto): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(data.variantId);
    const rule = BOM_RULES[variant.fulfilmentType];

    if ((await this.repository.countBomLines(data.variantId)) >= rule.max) {
      throw new ConflictException({
        label: 'Too Many Components',
        detail: `"${variant.sku}" already holds ${pluralize('component', rule.max, true)}, which is all its fulfilment type allows. Edit or remove one instead.`,
      });
    }

    await this.insertLineOrConflict(data, variant.sku);
    return { success: true, message: `Component added to "${variant.sku}".` };
  }

  // Re-quantifies a line, or moves it to a different unit of the same item
  async updateBomLine(data: UpdateBomLineDto): Promise<SuccessResponseDto> {
    const { line, variant } = await this.requireOwnedBomLine(data.id);
    await this.repository.updateBomLine(line.id, { quantity: data.quantity, uomId: data.uomId });
    return { success: true, message: `Component updated on "${variant.sku}".` };
  }

  // Removes one component, deactivating the variant if that drops it below its type's minimum
  async deleteBomLine(lineId: string): Promise<SuccessResponseDto> {
    const { line, variant } = await this.requireOwnedBomLine(lineId);
    const rule = BOM_RULES[variant.fulfilmentType];
    const remaining = (await this.repository.countBomLines(variant.id)) - 1;
    const deactivate = variant.isActive && remaining < rule.min;

    await this.repository.transaction(async () => {
      await this.repository.deleteBomLine(line.id);
      if (deactivate) await this.repository.update(variant.id, { isActive: false });
    });

    return {
      success: true,
      message: `Component removed from "${variant.sku}".${deactivate ? ' It was deactivated because it no longer has enough to sell.' : ''}`,
    };
  }

  // A line is addressed by its own id, so the variant it belongs to is what ownership is checked on
  private async requireOwnedBomLine(lineId: string) {
    const line = await this.repository.findBomLine(lineId);
    if (!line) throw new NotFoundException('Component not found.');
    const { variant, offering } = await this.requireOwnedVariant(line.variantId);
    return { line, variant, offering };
  }

  // (item, uom) is unique per variant, so the same item may appear twice only in different units
  private async insertLineOrConflict(data: AddBomLineDto, sku: string): Promise<void> {
    try {
      await this.repository.insertBomLine({
        variantId: data.variantId,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        uomId: data.uomId,
        sortOrder: await this.repository.nextBomSortOrder(data.variantId),
      });
    } catch (error) {
      const candidate = error as { code?: string };
      if (candidate?.code === '23505') {
        throw new ConflictException({
          label: 'Already A Component',
          detail: `"${sku}" already draws on that item in that unit. Edit the existing line instead.`,
        });
      }
      throw error;
    }
  }

  // Replaces a variant's bill of materials, then reconciles whether it can still be sold
  async upsertBom(data: UpsertBomDto): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(data.variantId);
    const rule = BOM_RULES[variant.fulfilmentType];

    if (data.lines.length > rule.max) {
      throw new BadRequestException({
        label: 'Too Many Components',
        detail: `A ${variant.fulfilmentType.toLowerCase()} variant takes ${rule.max === 1 ? 'exactly one component' : 'any number of components'}. Remove the extras, or change its fulfilment type.`,
      });
    }

    const deduped = new Map(data.lines.map((line) => [`${line.inventoryItemId}:${line.uomId}`, line]));

    await this.repository.transaction(async () => {
      await this.repository.replaceBom(
        data.variantId,
        [...deduped.values()].map((line, index) => ({
          variantId: data.variantId,
          inventoryItemId: line.inventoryItemId,
          quantity: line.quantity,
          uomId: line.uomId,
          sortOrder: index,
        })),
      );
      // A variant that no longer meets its type's rule cannot stay sellable
      if (variant.isActive && deduped.size < rule.min) {
        await this.repository.update(data.variantId, { isActive: false });
      }
    });

    const deactivated = variant.isActive && deduped.size < rule.min;
    return {
      success: true,
      message: `"${variant.sku}" now has ${pluralize('component', deduped.size, true)}.${deactivated ? ' It was deactivated because it no longer has enough to sell.' : ''}`,
    };
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
    const rows = await this.repository.findVariantValueIds(offeringId);
    const byVariant = new Map<string, string[]>();
    for (const row of rows) byVariant.set(row.variantId, [...(byVariant.get(row.variantId) ?? []), row.valueId]);
    return new Set([...byVariant.values()].map((ids) => this.combinationKey(ids)));
  }

  // Two different combinations can derive the same SKU once a variant may skip a dimension — a value
  // coded "s" on Size and another on Colour both yield "<offering>-s". The SKU is unique org-wide, so
  // this reports the clash by name rather than letting the insert fail on the constraint.
  private async assertSkusFree(skus: string[]): Promise<void> {
    const seen = new Set<string>();
    const duplicated = skus.filter((sku) => !seen.add(sku));
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

  // The rows arrive with their many-to-one names already joined; only the one-to-many collections and
  // the SKU-matched item need their own round trip, because joining those would multiply rows.
  // Every field the DTO needs now rides along in the page query, so this is a pure mapping
  private toDto(variant: OfferingVariantWithNames, bom: OfferingBomLineDto[] = []): OfferingVariantDto {
    return OfferingVariantDto.from(variant, {
      values: variant.values,
      bom,
      bomLineCount: variant.bomLineCount,
      salesUomName: variant.salesUomName,
      canMarkActive: variant.canMarkActive,
      canDelete: variant.canDelete,
      inventoryItem: variant.inventoryItemId
        ? {
            id: variant.inventoryItemId,
            name: variant.inventoryItemName ?? '',
            uomId: variant.inventoryItemUomId ?? '',
          }
        : null,
      taxClassName: variant.taxClassName,
    });
  }

  private async requireReachableOffering(offeringId: string): Promise<OfferingRef> {
    const offering = await this.repository.findOffering(offeringId);
    if (!offering) throw new NotFoundException('Offering not found.');
    return offering;
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
