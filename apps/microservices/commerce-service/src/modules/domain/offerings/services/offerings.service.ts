import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type SuccessResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyAmountDto, type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { type FulfilmentType, FulfilmentTypeValues, offerings, type VariantOptionValue } from '@/db/schema';
import type {
  CreateOfferingDto,
  DefaultVariantInput,
} from '@/modules/site/catalogs/dto/request/create-offering.dto';
import type {
  CreateVariantDto,
  VariantComponentInput,
} from '@/modules/site/catalogs/dto/request/create-variant.dto';
import type { UpdateOfferingDto } from '@/modules/site/catalogs/dto/request/update-offering.dto';
import type { UpdateVariantDto } from '@/modules/site/catalogs/dto/request/update-variant.dto';
import { OfferingDto } from '../dto/entity/offering.dto';
import {
  OfferingDetailDto,
  OfferingOptionDto,
  OfferingVariantDto,
  type VariantComponentDto,
} from '../dto/entity/offering-detail.dto';
import { type OfferingAxis, OfferingsRepository, type VariantComponentRow } from '../repositories/offerings.repository';

@Injectable()
export class OfferingsService {
  private readonly logger = new Logger(OfferingsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: offerings.name, type: 'string' },
    fulfilmentType: { column: offerings.fulfilmentType, type: 'string' },
    isAvailable: { column: offerings.isAvailable, type: 'boolean' },
    categoryId: { column: offerings.categoryId, type: 'string' },
  };

  constructor(private readonly offeringsRepository: OfferingsRepository) {}

  // Returns paginated, filtered, and sorted offerings for a catalog (RLS scopes to org + site ancestors)
  async findForTable(catalogId: string, state: TableViewState): Promise<{ result: OfferingDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, OfferingsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, OfferingsService.FIELD_MAP);
    const where = and(eq(offerings.catalogId, catalogId), filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, OfferingsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.offeringsRepository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(offerings.createdAt)],
      limit,
      offset,
    });

    const modifierGroupCounts = await this.offeringsRepository.findModifierGroupCountsByOfferingIds(
      result.map((row) => row.id),
    );

    return {
      result: result.map((row) =>
        OfferingDto.from(row, row.currencyCode, row.categoryName, modifierGroupCounts.get(row.id) ?? 0),
      ),
      count,
    };
  }

  // Creates a new offering, its axes, and (for single-variant types) one default variant
  async create(data: CreateOfferingDto): Promise<OfferingDto> {
    const currencyCode = await this.resolveCatalogCurrency(data.catalogId);
    const entity = await this.offeringsRepository.transaction(async () => {
      const offering = await this.offeringsRepository.create({
        catalogId: data.catalogId,
        categoryId: data.categoryId ?? null,
        fulfilmentType: data.fulfilmentType,
        name: data.name,
        description: data.description ?? null,
        salesTaxGroupId: data.salesTaxGroupId ?? null,
        isAvailable: data.isAvailable ?? true,
        sortOrder: data.sortOrder ?? 0,
      });

      if (data.variantOptionIds && data.variantOptionIds.length > 0) {
        await this.assertOptionsBelongToCatalog(data.variantOptionIds, offering.catalogId);
        await this.offeringsRepository.setAxes(offering.id, data.variantOptionIds);
      }

      if (data.defaultVariant) {
        await this.createDefaultVariant(
          offering.id,
          offering.name,
          offering.fulfilmentType,
          currencyCode,
          data.defaultVariant,
        );
      }

      return offering;
    });

    const categoryName = await this.offeringsRepository.findCategoryName(entity.categoryId);
    this.logger.log(`Created offering: ${entity.name} (${entity.id})`);
    return OfferingDto.from(entity, currencyCode, categoryName);
  }

  // Creates the single default variant (no option values) for a non-variant offering
  private async createDefaultVariant(
    offeringId: string,
    offeringName: string,
    fulfilmentType: FulfilmentType,
    currencyCode: string,
    data: DefaultVariantInput,
  ): Promise<void> {
    const components = data.components ?? [];
    this.assertComponentsMatchType(fulfilmentType, components);

    const name = offeringName || 'Default';
    const sku = data.sku ?? (await this.deriveUniqueSku(offeringId, offeringName, []));
    const price = this.toMinorPrice(data.price, currencyCode);

    const variant = await this.offeringsRepository.createVariant({
      offeringId,
      sku,
      name,
      price,
      isAvailable: data.isAvailable ?? true,
      sortOrder: 0,
    });

    await this.offeringsRepository.replaceComponents(variant.id, components);
  }

  // Returns an offering by ID with full details including axes and variants
  async findById(id: string): Promise<OfferingDetailDto> {
    const entity = await this.offeringsRepository.findById(id);
    if (!entity) throw new NotFoundException('Offering not found.');

    const currencyCode = await this.resolveCatalogCurrency(entity.catalogId);
    const categoryName = await this.offeringsRepository.findCategoryName(entity.categoryId);
    const categoryPath = await this.offeringsRepository.findCategoryPath(entity.categoryId);
    const optionDtos = await this.buildAxisDtos(id);

    const variantEntities = await this.offeringsRepository.findVariantsByOfferingId(id);
    const variantIds = variantEntities.map((v) => v.id);
    const variantOptionValues = await this.offeringsRepository.findVariantOptionValues(variantIds);
    const componentRows = await this.offeringsRepository.findComponentsByVariantIds(variantIds);
    const variantDtos = variantEntities.map((v) => {
      const valueIds = variantOptionValues
        .filter((vov) => vov.offeringVariantId === v.id)
        .map((vov) => vov.variantOptionValueId);
      return OfferingVariantDto.from(v, currencyCode, valueIds, this.groupComponents(componentRows, v.id));
    });

    return OfferingDetailDto.from(entity, currencyCode, categoryName, categoryPath, optionDtos, variantDtos);
  }

  // Updates an offering's basic info and (optionally) its axes. App-layer validates leaf category.
  async update(id: string, data: UpdateOfferingDto): Promise<OfferingDto> {
    const existing = await this.offeringsRepository.findById(id);
    if (!existing) throw new NotFoundException('Offering not found.');

    const { variantOptionIds, ...fields } = data;

    if (variantOptionIds !== undefined) {
      const currentAxes = await this.offeringsRepository.findAxesByOfferingId(id);
      const currentIds = new Set(currentAxes.map((a) => a.id));
      const changed =
        currentIds.size !== variantOptionIds.length || variantOptionIds.some((vid) => !currentIds.has(vid));
      if (changed) {
        const variantCount = await this.offeringsRepository.countVariantsByOfferingId(id);
        if (variantCount > 0) {
          throw new BadRequestException('Variant options cannot be changed once the offering has variants.');
        }
        if (variantOptionIds.length > 0) {
          await this.assertOptionsBelongToCatalog(variantOptionIds, existing.catalogId);
        }
        await this.offeringsRepository.setAxes(id, variantOptionIds);
      }
    }

    const entity = Object.keys(fields).length > 0 ? await this.offeringsRepository.update(id, fields) : existing;
    const currencyCode = await this.resolveCatalogCurrency(entity.catalogId);
    const categoryName = await this.offeringsRepository.findCategoryName(entity.categoryId);
    this.logger.log(`Updated offering: ${entity.name} (${entity.id})`);
    return OfferingDto.from(entity, currencyCode, categoryName);
  }

  // Deletes an offering by ID (cascades to axes, variants)
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.offeringsRepository.findById(id);
    if (!existing) throw new NotFoundException('Offering not found.');

    await this.offeringsRepository.deleteVariantsByOfferingId(id);
    await this.offeringsRepository.deleteAxesByOfferingId(id);
    await this.offeringsRepository.delete(id);
    this.logger.log(`Deleted offering: ${existing.name} (${id})`);
    return { success: true, message: `Offering "${existing.name}" deleted successfully.` };
  }

  // Creates a single variant from an explicit option-value combination across the offering's axes
  async createVariant(data: CreateVariantDto): Promise<OfferingVariantDto> {
    const offering = await this.offeringsRepository.findById(data.offeringId);
    if (!offering) throw new NotFoundException('Offering not found.');

    const currencyCode = await this.resolveCatalogCurrency(offering.catalogId);
    const axes = await this.offeringsRepository.findAxesByOfferingId(data.offeringId);
    const optionIds = axes.map((a) => a.id);
    const values = await this.offeringsRepository.findValuesByOptionIds(optionIds);
    const selected = this.resolveSelectedValues(axes, values, data.optionValueIds);

    const components = data.components ?? [];
    this.assertComponentsMatchType(offering.fulfilmentType, components);

    await this.assertNoDuplicateCombo(data.offeringId, data.optionValueIds);

    const name = this.deriveVariantName(selected, offering.name);
    const sku = data.sku ?? (await this.deriveUniqueSku(data.offeringId, offering.name, selected));
    const price = this.toMinorPrice(data.price, currencyCode);

    const existingVariants = await this.offeringsRepository.findVariantsByOfferingId(data.offeringId);

    const variant = await this.offeringsRepository.createVariant({
      offeringId: data.offeringId,
      sku,
      name,
      price,
      isAvailable: data.isAvailable ?? true,
      sortOrder: existingVariants.length,
    });

    await this.offeringsRepository.createVariantOptionValues(
      data.optionValueIds.map((variantOptionValueId) => ({ offeringVariantId: variant.id, variantOptionValueId })),
    );
    await this.offeringsRepository.replaceComponents(variant.id, components);

    const componentRows = await this.offeringsRepository.findComponentsByVariantIds([variant.id]);
    this.logger.log(`Created variant: ${variant.sku} (${variant.id})`);
    return OfferingVariantDto.from(
      variant,
      currencyCode,
      data.optionValueIds,
      this.groupComponents(componentRows, variant.id),
    );
  }

  // Returns all variants for an offering with their option value links
  async listVariants(offeringId: string): Promise<OfferingVariantDto[]> {
    const existing = await this.offeringsRepository.findById(offeringId);
    if (!existing) throw new NotFoundException('Offering not found.');

    const currencyCode = await this.resolveCatalogCurrency(existing.catalogId);
    const variantEntities = await this.offeringsRepository.findVariantsByOfferingId(offeringId);
    const variantIds = variantEntities.map((v) => v.id);
    const variantOptionValues = await this.offeringsRepository.findVariantOptionValues(variantIds);
    const componentRows = await this.offeringsRepository.findComponentsByVariantIds(variantIds);

    return variantEntities.map((v) => {
      const valueIds = variantOptionValues
        .filter((vov) => vov.offeringVariantId === v.id)
        .map((vov) => vov.variantOptionValueId);
      return OfferingVariantDto.from(v, currencyCode, valueIds, this.groupComponents(componentRows, v.id));
    });
  }

  // Updates a single variant's fields and (optionally) replaces its components
  async updateVariant(variantId: string, data: UpdateVariantDto): Promise<OfferingVariantDto> {
    const existing = await this.offeringsRepository.findVariantById(variantId);
    if (!existing) throw new NotFoundException('Variant not found.');

    const offering = await this.offeringsRepository.findById(existing.offeringId);
    if (!offering) throw new NotFoundException('Offering not found.');

    const currencyCode = await this.resolveCatalogCurrency(offering.catalogId);

    if (data.components !== undefined) {
      this.assertComponentsMatchType(offering.fulfilmentType, data.components);
    }

    const { price, components: _components, ...rest } = data;
    if (Object.keys(rest).length > 0 || price != null) {
      await this.offeringsRepository.updateVariant(variantId, {
        ...rest,
        ...(price != null && { price: this.toMinorPrice(price, currencyCode) }),
      });
    }

    if (data.components !== undefined) {
      await this.offeringsRepository.replaceComponents(variantId, data.components);
    }

    const updated = await this.offeringsRepository.findVariantById(variantId);
    if (!updated) throw new NotFoundException('Variant not found.');

    const variantOptionValues = await this.offeringsRepository.findVariantOptionValues([variantId]);
    const valueIds = variantOptionValues.map((vov) => vov.variantOptionValueId);
    const componentRows = await this.offeringsRepository.findComponentsByVariantIds([variantId]);

    this.logger.log(`Updated variant: ${updated.sku} (${updated.id})`);
    return OfferingVariantDto.from(updated, currencyCode, valueIds, this.groupComponents(componentRows, variantId));
  }

  // Deletes a single variant and its option-value links
  async deleteVariant(variantId: string): Promise<SuccessResponseDto> {
    const existing = await this.offeringsRepository.findVariantById(variantId);
    if (!existing) throw new NotFoundException('Variant not found.');

    await this.offeringsRepository.deleteVariant(variantId);
    this.logger.log(`Deleted variant: ${existing.name} (${variantId})`);
    return { success: true, message: `Variant "${existing.name}" deleted successfully.` };
  }

  // Builds the offering's axis DTOs from its variant options and their values
  private async buildAxisDtos(offeringId: string): Promise<OfferingOptionDto[]> {
    const axes = await this.offeringsRepository.findAxesByOfferingId(offeringId);
    const values = await this.offeringsRepository.findValuesByOptionIds(axes.map((a) => a.id));
    return axes.map((axis) =>
      OfferingOptionDto.from(
        axis,
        axis.axisSortOrder,
        values.filter((v) => v.variantOptionId === axis.id),
      ),
    );
  }

  // Enforces the per-type component rule: STOCK/COMPOSITE need >=1 component, SERVICE needs none
  private assertComponentsMatchType(fulfilmentType: FulfilmentType, components: VariantComponentInput[]): void {
    if (fulfilmentType === FulfilmentTypeValues.SERVICE) {
      if (components.length > 0) {
        throw new BadRequestException('A service variant cannot have inventory components.');
      }
      return;
    }
    if (components.length === 0) {
      throw new BadRequestException('A stocked or composite variant requires at least one inventory component.');
    }
  }

  // Groups component rows for a variant into DTO shape
  private groupComponents(rows: VariantComponentRow[], variantId: string): VariantComponentDto[] {
    return rows
      .filter((r) => r.offeringVariantId === variantId)
      .map((r) => ({
        inventoryItemId: r.inventoryItemId,
        inventoryItemName: r.inventoryItemName,
        quantity: r.quantity,
      }));
  }

  // Resolves the catalog's currency code, used to serialize/parse variant prices
  private async resolveCatalogCurrency(catalogId: string): Promise<string> {
    const currencyCode = await this.offeringsRepository.findCatalogCurrency(catalogId);
    if (!currencyCode) throw new NotFoundException('Catalog not found.');
    return currencyCode;
  }

  // Converts a {currency, value} price to stored minor units, rejecting a currency mismatch
  private toMinorPrice(price: CurrencyAmountDto, currencyCode: string): bigint {
    if (price.currency !== currencyCode) {
      throw new BadRequestException({
        label: 'Currency Mismatch',
        detail: `Price currency must match the catalog currency (${currencyCode}).`,
        errors: [{ field: 'price', message: 'Wrong currency' }],
      });
    }
    return majorToMinor(price.value, currencyCode as CurrencyCode, 'price');
  }

  // Validates that all variant option IDs belong to the given catalog
  private async assertOptionsBelongToCatalog(variantOptionIds: string[], catalogId: string): Promise<void> {
    const options = await this.offeringsRepository.findVariantOptionsByIds(variantOptionIds);
    if (options.length !== variantOptionIds.length || options.some((o) => o.catalogId !== catalogId)) {
      throw new BadRequestException('A variant option does not belong to this catalog.');
    }
  }

  // Validates the requested option values map to distinct axes of this offering and returns them ordered
  private resolveSelectedValues(
    axes: OfferingAxis[],
    values: VariantOptionValue[],
    optionValueIds: string[],
  ): { axis: OfferingAxis; value: VariantOptionValue }[] {
    if (axes.length === 0) {
      if (optionValueIds.length > 0) {
        throw new BadRequestException('This offering has no options; no option values may be selected.');
      }
      return [];
    }

    if (optionValueIds.length === 0) {
      throw new BadRequestException('Select at least one option value.');
    }

    const axisById = new Map(axes.map((axis) => [axis.id, axis]));
    const valueLookup = new Map<string, { axis: OfferingAxis; value: VariantOptionValue }>();
    for (const value of values) {
      const axis = axisById.get(value.variantOptionId);
      if (axis) valueLookup.set(value.id, { axis, value });
    }

    const seenAxisIds = new Set<string>();
    const selected: { axis: OfferingAxis; value: VariantOptionValue }[] = [];
    for (const id of optionValueIds) {
      const match = valueLookup.get(id);
      if (!match) throw new BadRequestException('An option value does not belong to this offering.');
      if (seenAxisIds.has(match.axis.id)) {
        throw new BadRequestException('Only one value per option may be selected.');
      }
      seenAxisIds.add(match.axis.id);
      selected.push(match);
    }

    selected.sort((a, b) => a.axis.axisSortOrder - b.axis.axisSortOrder);
    return selected;
  }

  // Rejects creating a variant whose option-value set already exists on the offering
  private async assertNoDuplicateCombo(offeringId: string, optionValueIds: string[]): Promise<void> {
    const variants = await this.offeringsRepository.findVariantsByOfferingId(offeringId);
    const variantIds = variants.map((v) => v.id);
    const links = await this.offeringsRepository.findVariantOptionValues(variantIds);

    const target = [...optionValueIds].sort().join('|');
    for (const variant of variants) {
      const combo = links
        .filter((l) => l.offeringVariantId === variant.id)
        .map((l) => l.variantOptionValueId)
        .sort()
        .join('|');
      if (combo === target) {
        throw new ConflictException('A variant with this combination already exists.');
      }
    }
  }

  // Derives the variant name from selected values, falling back to the offering name
  private deriveVariantName(
    selected: { axis: OfferingAxis; value: VariantOptionValue }[],
    fallbackName: string,
  ): string {
    if (selected.length === 0) return fallbackName || 'Default';
    return selected.map((s) => s.value.value).join(' / ');
  }

  // Builds a SKU from offering name initials + value initials, suffixing on per-offering collisions
  private async deriveUniqueSku(
    offeringId: string,
    name: string,
    selected: { axis: OfferingAxis; value: VariantOptionValue }[],
  ): Promise<string> {
    const base =
      name
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'VAR';
    const initials = selected.map((s) => s.value.value.slice(0, 3).toUpperCase()).join('-');
    const candidate = initials ? `${base}-${initials}` : base;

    const variants = await this.offeringsRepository.findVariantsByOfferingId(offeringId);
    const used = new Set(variants.map((v) => v.sku));

    if (!used.has(candidate)) return candidate;
    let suffix = 2;
    while (used.has(`${candidate}-${suffix}`)) suffix++;
    return `${candidate}-${suffix}`;
  }
}
