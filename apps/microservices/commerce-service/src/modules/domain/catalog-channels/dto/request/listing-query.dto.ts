import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export const ListingSortValues = {
  FEATURED: 'FEATURED',
  PRICE_ASC: 'PRICE_ASC',
  PRICE_DESC: 'PRICE_DESC',
  NEWEST: 'NEWEST',
} as const;
export type ListingSort = (typeof ListingSortValues)[keyof typeof ListingSortValues];

export const LISTINGS_PER_PAGE = 12;
export const LISTINGS_PER_PAGE_MAX = 60;

export class ListingFilterSelectionDto {
  @IsString()
  code: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  values: string[];
}

export class ListingQueryDto {
  // Group code → value codes. OR within a group, AND across groups; a group may name a dimension or
  // an attribute, and which one it is is resolved by the query rather than declared by the caller.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingFilterSelectionDto)
  filters?: ListingFilterSelectionDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(LISTINGS_PER_PAGE_MAX)
  perPage?: number;

  @IsOptional()
  @IsEnum(ListingSortValues)
  sort?: ListingSort;
}
