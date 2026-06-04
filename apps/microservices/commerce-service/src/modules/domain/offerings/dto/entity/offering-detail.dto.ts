import { CurrencyAmountDto } from '@vritti/api-sdk';
import type { FulfilmentType, Offering, OfferingVariant, VariantOption, VariantOptionValue } from '@/db/schema';

export class OfferingOptionValueDto {
  id: string;
  value: string;
  sortOrder: number;

  // Maps a VariantOptionValue entity to a DTO
  static from(entity: VariantOptionValue): OfferingOptionValueDto {
    const dto = new OfferingOptionValueDto();
    dto.id = entity.id;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

export class OfferingOptionDto {
  id: string;
  name: string;
  sortOrder: number;
  values: OfferingOptionValueDto[];

  // Maps an offering axis (variant option) with its values to a DTO
  static from(option: VariantOption, sortOrder: number, values: VariantOptionValue[]): OfferingOptionDto {
    const dto = new OfferingOptionDto();
    dto.id = option.id;
    dto.name = option.name;
    dto.sortOrder = sortOrder;
    dto.values = values.map(OfferingOptionValueDto.from);
    return dto;
  }
}

export interface VariantComponentDto {
  inventoryItemId: string;
  inventoryItemName: string | null;
  quantity: number;
}

export class OfferingVariantDto {
  id: string;
  sku: string;
  name: string;
  price: CurrencyAmountDto;
  isAvailable: boolean;
  components: VariantComponentDto[];
  sortOrder: number;
  optionValueIds: string[];
  createdAt: string;
  updatedAt: string;

  // Maps an OfferingVariant entity with option value IDs and components to a DTO; price is
  // serialized to {currency, value} (major units) from the catalog's currency
  static from(
    entity: OfferingVariant,
    currencyCode: string,
    optionValueIds: string[],
    components: VariantComponentDto[],
  ): OfferingVariantDto {
    const dto = new OfferingVariantDto();
    dto.id = entity.id;
    dto.sku = entity.sku;
    dto.name = entity.name;
    dto.price = CurrencyAmountDto.from(entity.price, currencyCode);
    dto.isAvailable = entity.isAvailable;
    dto.components = components;
    dto.sortOrder = entity.sortOrder;
    dto.optionValueIds = optionValueIds;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class OfferingDetailDto {
  id: string;
  businessUnitId: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryPath: string | null;
  fulfilmentType: FulfilmentType;
  name: string;
  description: string | null;
  salesTaxGroupId: string | null;
  currencyCode: string;
  isAvailable: boolean;
  sortOrder: number;
  attributes: unknown;
  metadata: unknown;
  options: OfferingOptionDto[];
  variants: OfferingVariantDto[];
  createdAt: string;
  updatedAt: string;

  // Maps an Offering entity with related data to a full detail DTO
  static from(
    entity: Offering,
    currencyCode: string,
    categoryName: string | null,
    categoryPath: string | null,
    options: OfferingOptionDto[],
    variants: OfferingVariantDto[],
  ): OfferingDetailDto {
    const dto = new OfferingDetailDto();
    dto.id = entity.id;
    dto.businessUnitId = entity.businessUnitId;
    dto.currencyCode = currencyCode;
    dto.categoryId = entity.categoryId ?? null;
    dto.categoryName = categoryName ?? null;
    dto.categoryPath = categoryPath ?? null;
    dto.fulfilmentType = entity.fulfilmentType;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.salesTaxGroupId = entity.salesTaxGroupId ?? null;
    dto.isAvailable = entity.isAvailable;
    dto.sortOrder = entity.sortOrder;
    dto.attributes = entity.attributes;
    dto.metadata = entity.metadata;
    dto.options = options;
    dto.variants = variants;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
