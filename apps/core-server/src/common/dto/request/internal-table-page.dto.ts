import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  type FilterCondition,
  type FilterOperator,
  FilterOperators,
  type SearchState,
  type SortCondition,
} from '@vritti/api-sdk/conditions';
import { type TableFilters, type TablePageRequest } from '@vritti/api-sdk/data-table';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  registerDecorator,
  ValidateNested,
  type ValidationOptions,
} from 'class-validator';

// Validates a filter condition's value: a string, a finite number, or a list of strings
function IsFilterValue(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isFilterValue',
      target: target.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value === 'string') return true;
          if (typeof value === 'number') return Number.isFinite(value);
          return Array.isArray(value) && value.every((item) => typeof item === 'string');
        },
        defaultMessage(): string {
          return 'value must be a string, a number, or a list of strings';
        },
      },
    });
  };
}

export class FilterConditionDto implements FilterCondition {
  @ApiProperty({ description: 'Field name from the table', example: 'status' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: Object.values(FilterOperators), example: FilterOperators.IS_ANY_OF })
  @IsIn(Object.values(FilterOperators))
  operator: FilterOperator;

  @ApiProperty({
    description: 'A string, a number, or a list of strings',
    oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'array', items: { type: 'string' } }],
    example: ['ACTIVE'],
  })
  @IsFilterValue()
  value: string | number | string[];
}

export class SortConditionDto implements SortCondition {
  @ApiProperty({ description: 'Field name from the table', example: 'createdAt' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc' })
  @IsIn(['asc', 'desc'])
  direction: 'asc' | 'desc';
}

export class TableSearchDto implements SearchState {
  @ApiProperty({ description: 'Column searched, or the table-wide search key', example: 'name' })
  @IsString()
  @IsNotEmpty()
  columnId: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  value: string;
}

export class TablePaginationDto {
  @ApiProperty({ minimum: 1, maximum: 200, example: 20 })
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number;

  @ApiProperty({ minimum: 0, example: 0 })
  @IsInt()
  @Min(0)
  offset: number;
}

export class TableFiltersDto implements TableFilters {
  @ApiProperty({ type: [FilterConditionDto], description: "The filter panel's conditions" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  panel: FilterConditionDto[];

  @ApiProperty({ type: [FilterConditionDto], description: "The context bar's conditions" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  context: FilterConditionDto[];
}

export class InternalTablePageDto implements TablePageRequest {
  @ApiProperty({ type: TableFiltersDto, description: "The user's filter conditions, both halves ANDed" })
  @ValidateNested()
  @Type(() => TableFiltersDto)
  filters: TableFiltersDto;

  @ApiPropertyOptional({ type: TableSearchDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => TableSearchDto)
  search: TableSearchDto | null = null;

  @ApiProperty({ type: [SortConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortConditionDto)
  sort: SortConditionDto[];

  @ApiProperty({ type: TablePaginationDto })
  @ValidateNested()
  @Type(() => TablePaginationDto)
  pagination: TablePaginationDto;
}
