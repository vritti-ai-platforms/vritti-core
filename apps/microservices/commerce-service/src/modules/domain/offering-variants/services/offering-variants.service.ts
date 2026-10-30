import { Injectable, Logger } from '@nestjs/common';
import { compareCount, type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
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
  type CatalogChannelType,
  CatalogChannelTypeValues,
  type FulfilmentType,
  FulfilmentTypeValues,
  type OfferingVariant,
  offeringAttributes,
  offeringBom,
  offeringDimensions,
  offeringVariantAttributeValues,
  offeringVariants,
  offeringVariantValues,
} from '@/db/schema';
import { OfferingVariantDto, type OfferingVariantTableRowDto } from '../dto/entity/offering-variant.dto';
import type { VariantCombinationsDto } from '../dto/entity/variant-combination.dto';
import type { BulkClearVariantsTaxClassDto } from '../dto/request/bulk-clear-variants-tax-class.dto';
import type { BulkSetVariantsAttributeDto } from '../dto/request/bulk-set-variants-attribute.dto';
import type { BulkSetVariantsStatusDto } from '../dto/request/bulk-set-variants-status.dto';
import type { BulkSetVariantsTaxClassDto } from '../dto/request/bulk-set-variants-tax-class.dto';
import type { CreateVariantDto } from '../dto/request/create-variant.dto';
import type { GenerateVariantsDto } from '../dto/request/generate-variants.dto';
import type { PreviewCombinationsDto } from '../dto/request/preview-combinations.dto';
import type { SetVariantFulfilmentDto } from '../dto/request/set-variant-fulfilment.dto';
import type { SetVariantTaxClassDto } from '../dto/request/set-variant-tax-class.dto';
import type { UpdateVariantDto } from '../dto/request/update-variant.dto';
import {
  type ChannelExclusionTarget,
  type DimensionValueRow,
  type OfferingRef,
  OfferingVariantsDomainRepository,
  type OfferingVariantTableRow,
  type VariantOptionRow,
  type VariantWithBomCount,
} from '../repositories/offering-variants.repository';

@Injectable()
export class OfferingVariantsDomainService {
  private readonly logger = new Logger(OfferingVariantsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    code: { column: offeringVariants.code, type: 'string' },
    externalSku: { column: offeringVariants.externalSku, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    isActive: { column: offeringVariants.isActive, type: 'boolean' },
    salesUomId: { column: offeringVariants.salesUomId, type: 'string' },
    taxClassId: { column: offeringVariants.taxClassId, type: 'string' },
    isTaxClassOverridden: { column: offeringVariants.isTaxClassOverridden, type: 'boolean' },
    fulfilmentType: { column: offeringVariants.fulfilmentType, type: 'string' },
    isFulfilmentOverridden: { column: offeringVariants.isFulfilmentOverridden, type: 'boolean' },
    bomLineCount: {
      expression: compareCount(
        sql`(select count(*) from ${offeringBom} where ${offeringBom.variantId} = ${offeringVariants.id})`,
      ),
      type: 'number',
    },
    'dimension:*': {
      wildcardExpression: ({ key: dimensionId, values: valueIds, operator }) => {
        const carriesValue = sql`exists (
          select 1 from ${offeringVariantValues}
          where ${offeringVariantValues.variantId} = ${offeringVariants.id}
            and ${offeringVariantValues.dimensionId} = ${dimensionId}
            and ${inArray(offeringVariantValues.valueId, valueIds)}
        )`;
        return sql`(not exists (
          select 1 from ${offeringDimensions}
          where ${offeringDimensions.id} = ${dimensionId}
            and ${offeringDimensions.offeringId} = ${offeringVariants.offeringId}
        ) or ${operator === 'isNotAnyOf' ? sql`not ${carriesValue}` : carriesValue})`;
      },
      keyFormat: 'uuid',
      valueFormat: 'uuid',
      type: 'string',
    },
    'attribute:*': {
      wildcardExpression: ({ key: attributeId, values: valueIds, operator }) => {
        const carriesValue = sql`exists (
          select 1 from ${offeringVariantAttributeValues}
          where ${offeringVariantAttributeValues.variantId} = ${offeringVariants.id}
            and ${offeringVariantAttributeValues.attributeId} = ${attributeId}
            and ${inArray(offeringVariantAttributeValues.valueId, valueIds)}
        )`;
        return sql`(not exists (
          select 1 from ${offeringAttributes}
          where ${offeringAttributes.id} = ${attributeId}
            and ${offeringAttributes.offeringId} = ${offeringVariants.offeringId}
        ) or ${operator === 'isNotAnyOf' ? sql`not ${carriesValue}` : carriesValue})`;
      },
      keyFormat: 'uuid',
      valueFormat: 'uuid',
      type: 'string',
    },
  };

  constructor(private readonly repository: OfferingVariantsDomainRepository) {}

  // A POS channel's targets are tills; every other type's are apps. So the kind never has to be sent — the
  // channel already says it, and a caller cannot get it wrong.
  private static targetKindOf(type: CatalogChannelType): ChannelExclusionTarget['kind'] {
    return type === CatalogChannelTypeValues.POS ? 'TERMINAL' : 'APP';
  }

  // Returns paginated, filtered, sorted variants of one offering for the data table.
  // `channelId` with its `target` asks for each row's state on that target as part of the same page read, and
  // answers with the channel facts a caller would otherwise have to resolve again: the catalog these rows are
  // listed in, and whether the calling workspace set the channel and so may change what it offers.
  async findForTable(
    offeringId: string,
    state: TableViewState,
    channelType?: CatalogChannelType,
    targetId?: string,
  ): Promise<{ result: OfferingVariantTableRowDto[]; count: number; catalogName: string; isOwn: boolean }> {
    await this.requireReachableOffering(offeringId);

    const filterWhere = FilterProcessor.buildWhere(state.filters, OfferingVariantsDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, OfferingVariantsDomainService.SEARCH_FIELD_MAP);
    const where = and(eq(offeringVariants.offeringId, offeringId), filterWhere, searchWhere) as SQL;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...OfferingVariantsDomainService.SEARCH_FIELD_MAP,
      ...OfferingVariantsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const channel =
      channelType && targetId ? await this.repository.findChannelForTarget(channelType, targetId) : undefined;
    const target =
      channel && targetId
        ? { id: targetId, kind: OfferingVariantsDomainService.targetKindOf(channel.type) }
        : undefined;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(offeringVariants.code)],
      limit,
      offset,
      channelId: channel?.id,
      target,
    });

    return {
      result: rows.map((row) => this.toTableRow(row)),
      count,
      catalogName: channel?.catalogName ?? '',
      isOwn: channel?.isOwn ?? false,
    };
  }

  // Sets whether one variant is available on one target — one app, one till. The exclusion names that target,
  // so a sibling inheriting the same channel is untouched. A channel this workspace does not own is refused:
  // its exclusions belong to the workspace that set it, which is what the row's own policies enforce too.
  async setTargetAvailability(
    channelType: CatalogChannelType,
    targetId: string,
    targetName: string,
    variantId: string,
    availableHere: boolean,
  ): Promise<SuccessResponseDto> {
    const channel = await this.repository.findChannelForTarget(channelType, targetId);
    if (!channel) throw new NotFoundException('This target resolves to no channel.');

    if (!channel.isOwn) {
      throw new ConflictException({
        label: 'Inherited Channel',
        detail: 'This channel is set by a wider scope. Change what it carries where it was set.',
      });
    }

    const listings = await this.repository.findListingsForVariant(channel.catalogId, variantId);
    if (listings.length === 0) {
      throw new NotFoundException('That variant is not listed in this channel’s catalog.');
    }

    const kind = OfferingVariantsDomainService.targetKindOf(channel.type);
    await this.repository.setTargetAvailability(
      channel.id,
      { id: targetId, kind },
      listings.map((listing) => listing.id),
      availableHere,
    );

    // Core names an app; a till is commerce's, so it is named here
    const name = kind === 'TERMINAL' ? ((await this.repository.findTerminalName(targetId)) ?? targetName) : targetName;
    const code = listings[0].code;
    return {
      success: true,
      message: availableHere ? `"${code}" is now available on "${name}".` : `"${code}" is now excluded from "${name}".`,
    };
  }

  // The subset of these codes that name a variant of this offering
  async findCodesInOffering(offeringId: string, codes: string[]): Promise<string[]> {
    await this.requireReachableOffering(offeringId);
    return this.repository.findCodesInOffering(offeringId, codes);
  }

  // Variant options for a storefront's own picker — which variant a product page is about
  findOptions(query: {
    search?: string;
    excludeIds?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ items: VariantOptionRow[]; total: number }> {
    return this.repository.findOptions({
      search: query.search,
      excludeIds: query.excludeIds,
      limit: Math.min(query.limit ?? 50, 200),
      offset: query.offset ?? 0,
    });
  }

  // Returns paginated active variant options for the select component — one offering's when offeringId is given
  async findForSelect(
    query: SelectOptionsQueryDto & { offeringId?: string; catalogId?: string },
  ): Promise<SelectQueryResult> {
    if (query.offeringId) await this.requireReachableOffering(query.offeringId);
    return this.repository.findVariantsForSelect(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'name',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        // Read off the cached column rather than re-joining the junctions, which is what that column is for
        additionalExpressions: {
          facets: sql`(
            select string_agg(entry->>'value', ' \u00b7 ')
            from jsonb_array_elements(${offeringVariants.dimensions}) facet,
                 jsonb_array_elements(facet->'values') entry
          )`,
        },
        search: query.search,
        limit: query.limit,
        offset: query.offset,
        values: query.values,
        excludeIds: query.excludeIds,
        orderByKey: query.orderByKey || 'code',
        orderDirection: query.orderDirection || 'asc',
      },
      { offeringId: query.offeringId, catalogId: query.catalogId },
    );
  }

  // Flat rows for the file export, scoped to one offering.
  async findForExport(offeringId: string, page: { limit: number; offset: number }): Promise<Record<string, unknown>[]> {
    await this.requireReachableOffering(offeringId);
    const rows = await this.repository.findForExport(offeringId, page);
    return rows.map((row) => ({
      Code: row.code,
      'External Code': row.externalSku ?? '',
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
      code: this.deriveCode(offering.code, ordered),
      labels: ordered.map((row) => row.value).join(' \u00b7 '),
      exists: existing.has(this.combinationKey(ordered.map((row) => row.valueId))),
    }));

    return {
      combinations,
      total: combinations.length,
      existingCount: combinations.filter((combination) => combination.exists).length,
    };
  }

  // Creates every selected combination that does not exist yet.
  async generate(data: GenerateVariantsDto): Promise<SuccessResponseDto> {
    const { message } = await this.runGenerate(data);
    return { success: true, message };
  }

  // The one variant an offering without dimensions sells as: it names no values, so its Code is the offering's own
  async createStandalone(offeringId: string, salesUomId: string): Promise<OfferingVariant> {
    const { created } = await this.runGenerate(
      { offeringId, salesUomId, combinations: [{ valueIds: [] }] },
      { standalone: true },
    );
    if (created.length === 0) {
      throw new ConflictException({
        label: 'Variant Exists',
        detail: 'This offering already has its variant.',
      });
    }
    return created[0];
  }

  // Shared by generate(), create() and createStandalone(): returns the rows it inserted, so a single-variant create can
  // report the variant it actually made rather than guessing at the end of a sorted list.
  private async runGenerate(
    data: GenerateVariantsDto,
    options: { standalone?: boolean } = {},
  ): Promise<{ created: OfferingVariant[]; message: string }> {
    const offering = await this.requireOwnedOffering(data.offeringId);
    const dimensionCount = await this.repository.countDimensions(data.offeringId);
    if (dimensionCount === 0 && !options.standalone) {
      throw new ConflictException({
        label: 'No Dimensions',
        detail: `"${offering.name}" has no dimensions yet. Add at least one before generating variants.`,
      });
    }
    if (dimensionCount > 0 && options.standalone) {
      throw new ConflictException({
        label: 'Has Dimensions',
        detail: `"${offering.name}" has dimensions, so its variants are generated from them.`,
      });
    }

    const valueRows = await this.repository.findDimensionValues(data.offeringId);
    const byValueId = new Map(valueRows.map((row) => [row.valueId, row]));
    const existing = await this.existingCombinationKeys(data.offeringId);

    const planned: { valueIds: string[]; ordered: DimensionValueRow[]; code: string; key: string }[] = [];
    const seen = new Set<string>();

    for (const combination of data.combinations) {
      const ordered = this.resolveCombination(combination.valueIds, byValueId);
      const key = this.combinationKey(ordered.map((row) => row.valueId));
      if (existing.has(key) || seen.has(key)) continue;
      seen.add(key);
      planned.push({ valueIds: combination.valueIds, ordered, code: this.deriveCode(offering.code, ordered), key });
    }

    if (planned.length === 0) {
      return { created: [], message: 'Nothing to create — every selected combination already exists.' };
    }

    await this.assertCodesFree(planned.map((plan) => plan.code));

    const created = await this.repository.transaction(async () => {
      const inserted = await this.repository.insertVariants(
        planned.map((plan) => ({
          offeringId: data.offeringId,
          code: plan.code,
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

      await this.repository.refreshFacets(inserted.map((variant) => variant.id));
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
    return { success: true, message: `"${created[0].code}" created.`, data: await this.findById(created[0].id) };
  }

  async update(id: string, data: Omit<UpdateVariantDto, 'id'>): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);
    if (data.isActive) await this.assertBomSatisfied(variant);
    await this.repository.update(id, data);
    return { success: true, message: `"${variant.code}" updated.` };
  }

  // The batch form of the isActive flip.
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
          detail: `${pluralize('variant', missing.length, true)} in this selection still need components before they can be sold: ${missing.map((variant) => `"${variant.code}"`).join(', ')}.`,
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

  // The batch form of setTaxClass.
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

  // Replaces every attribute value this variant carries.
  async setAttributes(id: string, valueIds: string[]): Promise<SuccessResponseDto> {
    const { variant, offering } = await this.requireOwnedVariant(id);

    const available = await this.repository.findAttributeValues(offering.id);
    const byValueId = new Map(available.map((row) => [row.valueId, row.attributeId]));
    const rows = [...new Set(valueIds)].map((valueId) => {
      const attributeId = byValueId.get(valueId);
      if (!attributeId) {
        throw new BadRequestException({
          label: 'Unknown Value',
          detail: 'One of the selected values does not belong to this offering.',
          errors: [{ field: 'valueIds', message: 'Unknown value' }],
        });
      }
      return { variantId: id, attributeId, valueId };
    });

    await this.repository.transaction(async () => {
      await this.repository.deleteVariantAttributeValues(id);
      await this.repository.insertVariantAttributeValues(rows);
    });

    this.logger.log(`Set ${rows.length} attribute values on variant ${variant.code} (${id})`);
    return {
      success: true,
      message:
        rows.length === 0
          ? `"${variant.code}" no longer carries any attributes.`
          : `"${variant.code}" now carries ${pluralize('attribute value', rows.length, true)}.`,
    };
  }

  // The batch form of setAttributes, narrowed to ONE attribute.
  async bulkSetAttribute(data: BulkSetVariantsAttributeDto): Promise<SuccessResponseDto> {
    const offering = await this.requireOwnedOffering(data.offeringId);
    const variants = await this.requireVariantsInOffering(offering, data.ids);

    const attribute = await this.repository.findAttributeInOffering(data.attributeId, offering.id);
    if (!attribute) {
      throw new NotFoundException({
        label: 'Attribute Not Found',
        detail: `That attribute does not belong to "${offering.name}".`,
      });
    }

    const available = await this.repository.findAttributeValues(offering.id);
    const onAttribute = new Set(
      available.filter((row) => row.attributeId === data.attributeId).map((row) => row.valueId),
    );
    const valueIds = [...new Set(data.valueIds)];
    if (valueIds.some((valueId) => !onAttribute.has(valueId))) {
      throw new BadRequestException({
        label: 'Unknown Value',
        detail: `One of the selected values does not belong to "${attribute.name}".`,
        errors: [{ field: 'valueIds', message: 'Unknown value' }],
      });
    }

    await this.repository.transaction(async () => {
      await this.repository.deleteVariantAttributeValuesForAttribute(data.ids, data.attributeId);
      await this.repository.insertVariantAttributeValues(
        data.ids.flatMap((variantId) => valueIds.map((valueId) => ({ variantId, attributeId: attribute.id, valueId }))),
      );
      await this.repository.refreshFacets(data.ids);
    });

    this.logger.log(
      `Bulk set ${valueIds.length} "${attribute.name}" values on ${data.ids.length} variants of ${offering.code}`,
    );
    return {
      success: true,
      message:
        valueIds.length === 0
          ? `"${attribute.name}" cleared on ${pluralize('variant', variants.length, true)}.`
          : `"${attribute.name}" set to ${pluralize('value', valueIds.length, true)} on ${pluralize('variant', variants.length, true)}.`,
    };
  }

  // Pins this variant's own tax class, exempting it from the offering's cascade from here on
  async setTaxClass(id: string, data: SetVariantTaxClassDto): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);
    await this.repository.update(id, { taxClassId: data.taxClassId, isTaxClassOverridden: true });
    this.logger.log(`Overrode tax class on variant ${variant.code} (${id})`);
    return { success: true, message: `Tax class overridden on "${variant.code}".` };
  }

  // Drops the override and resynchronises with the parent offering
  async clearTaxClassOverride(id: string): Promise<SuccessResponseDto> {
    const { variant, offering } = await this.requireOwnedVariant(id);
    if (!variant.isTaxClassOverridden) {
      return { success: true, message: `"${variant.code}" already follows its offering.` };
    }
    await this.repository.update(id, { taxClassId: offering.taxClassId, isTaxClassOverridden: false });
    this.logger.log(`Cleared tax class override on variant ${variant.code} (${id})`);
    return { success: true, message: `"${variant.code}" now follows "${offering.name}".` };
  }

  // Pins this variant's own fulfilment type, exempting it from the offering's cascade from here on.
  async setFulfilment(id: string, data: Omit<SetVariantFulfilmentDto, 'id'>): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);
    const next = data.fulfilmentType as FulfilmentType;
    if (variant.fulfilmentType === next && variant.isFulfilmentOverridden) {
      return { success: true, message: `"${variant.code}" already uses that fulfilment type.` };
    }

    await this.assertBomFits(variant, next);
    await this.repository.update(id, { fulfilmentType: next, isFulfilmentOverridden: true });
    this.logger.log(`Overrode fulfilment on variant ${variant.code} (${id}) to ${next}`);
    return { success: true, message: `"${variant.code}" is now ${next.toLowerCase()}.` };
  }

  // Drops the override and resynchronises with the parent offering
  async clearFulfilmentOverride(id: string): Promise<SuccessResponseDto> {
    const { variant, offering } = await this.requireOwnedVariant(id);
    if (!variant.isFulfilmentOverridden) {
      return { success: true, message: `"${variant.code}" already follows its offering.` };
    }

    await this.assertBomFits(variant, offering.fulfilmentType);
    await this.repository.update(id, { fulfilmentType: offering.fulfilmentType, isFulfilmentOverridden: false });
    this.logger.log(`Cleared fulfilment override on variant ${variant.code} (${id})`);
    return { success: true, message: `"${variant.code}" now follows "${offering.name}".` };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const { variant } = await this.requireOwnedVariant(id);

    // Values and bill-of-materials lines cascade, but order lines do not — a sold variant is history
    const orderLines = await this.repository.countOrderLines(id);
    if (orderLines > 0) {
      throw new ConflictException({
        label: 'Variant Sold',
        detail: `"${variant.code}" appears on ${pluralize('order line', orderLines, true)} and cannot be deleted. Unpublish it instead so it stops being available.`,
      });
    }

    await this.repository.transaction(async () => {
      // offering_bom and offering_variant_values both cascade on the variant, so only the values need clearing here —
      // they carry no cascade of their own
      await this.repository.deleteVariantValues(id);
      await this.repository.delete(id);
    });
    return { success: true, message: `"${variant.code}" deleted.` };
  }

  // Code = offering code + one value code per dimension, in dimension order
  private deriveCode(offeringCode: string, ordered: DimensionValueRow[]): string {
    return [offeringCode, ...ordered.map((row) => row.valueCode)].join('-');
  }

  private combinationKey(valueIds: string[]): string {
    return [...valueIds].sort().join('|');
  }

  private async existingCombinationKeys(offeringId: string): Promise<Set<string>> {
    return new Set(await this.repository.findCombinationKeys(offeringId));
  }

  // Two different combinations can derive the same Code once a variant may skip a dimension — a value coded "s" on Size
  // and another on Colour both yield "<offering>-s".
  private async assertCodesFree(codes: string[]): Promise<void> {
    const seen = new Set<string>();
    const duplicated = codes.filter((code) => {
      if (seen.has(code)) return true;
      seen.add(code);
      return false;
    });
    if (duplicated.length > 0) {
      throw new ConflictException({
        label: 'Duplicate Code',
        detail: `${[...new Set(duplicated)].map((code) => `"${code}"`).join(', ')} would be produced by more than one combination in this batch. Give the clashing values distinct codes.`,
      });
    }

    const taken = await this.repository.findTakenCodes(codes);
    if (taken.length > 0) {
      throw new ConflictException({
        label: 'Code Taken',
        detail: `${taken.map((code) => `"${code}"`).join(', ')} ${taken.length === 1 ? 'is' : 'are'} already in use. A Code is unique across the organization.`,
      });
    }
  }

  // A combination names at most one value per dimension, and need not name them all — an offering's dimensions are the
  // axes available, not a set every variant has to fill.
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
        detail: `"${variant.code}" holds ${pluralize('component', lines, true)}, but ${next.toLowerCase()} allows ${rule.max === 1 ? 'exactly one' : 'any number'}. Remove the extras first.`,
      });
    }
    if (variant.isActive && lines < rule.min) {
      throw new ConflictException({
        label: 'No Bill Of Materials',
        detail: `"${variant.code}" is on sale with ${pluralize('component', lines, true)}, which ${next.toLowerCase()} does not allow. Deactivate it first, or add components.`,
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
        detail: `"${variant.code}" needs at least ${pluralize('component', rule.min, true)} before it can be sold.`,
      });
    }
  }

  // A table row stops at what the list read selected — no inventory counterpart, because that join only runs for the
  // detail view
  private toTableRow(variant: OfferingVariantTableRow): OfferingVariantTableRowDto {
    return OfferingVariantDto.fromTableRow(variant, {
      listed: variant.listed,
      availableHere: variant.availableHere,
      values: variant.values,
      attributeValues: variant.attributeValues,
      bomLineCount: variant.bomLineCount,
      salesUomName: variant.salesUomName,
      taxClassName: variant.taxClassName,
      canMarkActive: variant.canMarkActive,
      canDelete: variant.canDelete,
    });
  }

  // The rows arrive with their many-to-one names already joined; the one-to-many collections ride along as aggregates,
  // so this is a pure mapping
  private toDto(variant: OfferingVariantTableRow): OfferingVariantDto {
    return OfferingVariantDto.from(variant, {
      values: variant.values,
      attributeValues: variant.attributeValues,
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

  // Returns the parent alongside the variant: resolving it is how ownership is checked, so a caller that needs the
  // offering has it already rather than fetching the same row again.
  private async requireOwnedVariant(id: string): Promise<{ variant: OfferingVariant; offering: OfferingRef }> {
    const variant = await this.repository.findById(id);
    if (!variant) throw new NotFoundException('Variant not found.');
    const offering = await this.requireOwnedOffering(variant.offeringId);
    return { variant, offering };
  }
}
