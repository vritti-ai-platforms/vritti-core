import { Field, InputType } from '@nestjs/graphql';
import type { FilterCondition, FilterOperator, SearchState, SortCondition } from '@vritti/api-sdk/database';
import { IsArray, IsIn, IsString } from 'class-validator';

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

@InputType()
export class FeedFilterInput implements FilterCondition {
  @Field(() => String)
  @IsString()
  field: string;

  @Field(() => String)
  @IsIn(FILTER_OPERATORS)
  operator: FilterOperator;

  @Field(() => [String])
  @IsArray()
  value: string[];
}

@InputType()
export class FeedSearchInput implements SearchState {
  @Field(() => String)
  @IsString()
  columnId: string;

  @Field(() => String)
  @IsString()
  value: string;
}

@InputType()
export class FeedSortInput implements SortCondition {
  @Field(() => String)
  @IsString()
  field: string;

  @Field(() => String)
  @IsIn(['asc', 'desc'])
  direction: 'asc' | 'desc';
}
