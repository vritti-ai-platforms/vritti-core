import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { CatalogListing } from './catalog-listing.type';

export enum FilterKind {
  DIMENSION = 'DIMENSION',
  ATTRIBUTE = 'ATTRIBUTE',
}
registerEnumType(FilterKind, { name: 'FilterKind' });

export enum ListingSort {
  FEATURED = 'FEATURED',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  NEWEST = 'NEWEST',
}
registerEnumType(ListingSort, { name: 'ListingSort' });

@InputType()
export class FilterInput {
  // A group code, which may name a dimension or an attribute — the storefront URL carries only codes
  // and core discovers which junction the code lives in
  @Field(() => String)
  @IsString()
  code: string;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  values: string[];
}

@ObjectType()
export class ListingFilterValue {
  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => Int, { description: 'Listings carrying this value. Zero renders disabled rather than hidden.' })
  count: number;
}

@ObjectType()
export class ListingFilter {
  @Field(() => FilterKind, { description: 'Ordering and presentation only — both kinds filter identically' })
  kind: FilterKind;

  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => [ListingFilterValue])
  values: ListingFilterValue[];
}

@ObjectType()
export class CatalogListings {
  @Field(() => [CatalogListing])
  items: CatalogListing[];

  @Field(() => Int, { description: 'Matching listings across every page' })
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  perPage: number;

  // Resolved as a field rather than returned with the page: a caller that only wants prices never
  // pays for the facet aggregates. The resolver carries appId down so the channel is resolved once.
  @Field(() => [ListingFilter])
  filters: ListingFilter[];

  // Not exposed — what the lazy `filters` resolver needs to answer without a second resolution
  appId: string;
  selected: { code: string; values: string[] }[];
  scope: ListingScope;
}

export type ListingScope = 'org' | 'le' | 'site';

export interface ListingQuery {
  filters?: FilterInput[];
  page?: number;
  perPage?: number;
  sort?: ListingSort;
}
