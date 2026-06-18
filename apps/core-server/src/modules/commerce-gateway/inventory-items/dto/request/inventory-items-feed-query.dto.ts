import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FilterCondition, FilterOperator, SearchState, SortCondition } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

const FILTER_OPERATORS: FilterOperator[] = [
  'equals',
  'notEquals',
  'contains',
  'notContains',
  'gt',
  'gte',
  'lt',
  'lte',
  'isAnyOf',
  'isNotAnyOf',
];

export class FeedFilterConditionDto implements FilterCondition {
  @ApiProperty({ description: 'Field to filter on', example: 'type' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Filter operator', enum: FILTER_OPERATORS, example: 'equals' })
  @IsIn(FILTER_OPERATORS)
  operator: FilterOperator;

  @ApiProperty({ description: 'Value to compare against', example: 'RAW_MATERIAL' })
  value: string | number | string[];
}

export class FeedSearchStateDto implements SearchState {
  @ApiProperty({ description: 'Column to search, or "all"', example: 'all' })
  @IsString()
  columnId: string;

  @ApiProperty({ description: 'Search term', example: 'widget' })
  @IsString()
  value: string;
}

export class FeedSortConditionDto implements SortCondition {
  @ApiProperty({ description: 'Field to sort by', example: 'name' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Sort direction', enum: ['asc', 'desc'], example: 'asc' })
  @IsIn(['asc', 'desc'])
  direction: 'asc' | 'desc';
}

export class InventoryItemsFeedQueryDto {
  @ApiPropertyOptional({ description: 'Filter conditions', type: [FeedFilterConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeedFilterConditionDto)
  filters?: FeedFilterConditionDto[];

  @ApiPropertyOptional({ description: 'Search state', type: FeedSearchStateDto, nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FeedSearchStateDto)
  search?: FeedSearchStateDto | null;

  @ApiPropertyOptional({ description: 'Sort conditions', type: [FeedSortConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeedSortConditionDto)
  sort?: FeedSortConditionDto[];

  @ApiPropertyOptional({ description: 'Page size', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Opaque cursor from a previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
