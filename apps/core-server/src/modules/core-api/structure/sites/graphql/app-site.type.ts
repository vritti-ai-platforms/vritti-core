import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SiteTypeValues } from '@/db/schema';

export enum AppSiteType {
  OUTLET = 'OUTLET',
  WAREHOUSE = 'WAREHOUSE',
  PRODUCTION = 'PRODUCTION',
}
registerEnumType(AppSiteType, { name: 'AppSiteType' });

// Kept beside the enum so a value added to the schema fails the build here rather than silently
// dropping out of a storefront's options.
export const APP_SITE_TYPES: Record<string, AppSiteType> = {
  [SiteTypeValues.OUTLET]: AppSiteType.OUTLET,
  [SiteTypeValues.WAREHOUSE]: AppSiteType.WAREHOUSE,
  [SiteTypeValues.PRODUCTION]: AppSiteType.PRODUCTION,
};

/**
 * A store a storefront may sell from.
 *
 * Carries its legal entity and that entity's currency, which is what lets one click set a whole
 * selling context: a site has no currency of its own, so without this a switcher would have to read
 * the entities as well to learn what it was switching into.
 */
@ObjectType()
export class AppSite {
  @Field(() => String)
  id: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => AppSiteType, {
    description: 'Only OUTLET sites sell to the public; a storefront switcher should offer those alone.',
  })
  type: AppSiteType;

  @Field(() => String, { description: "IANA zone, for rendering this store's own dates" })
  timezone: string;

  @Field(() => String, { description: 'The entity this store belongs to — picking a store picks this too' })
  legalEntityId: string;

  @Field(() => String, { description: "The legal entity's currency, resolved so one choice carries it" })
  currencyCode: string;

  @Field(() => Int)
  sortOrder: number;
}
