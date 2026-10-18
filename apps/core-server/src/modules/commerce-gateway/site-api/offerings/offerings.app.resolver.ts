import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OfferingVariantOptions } from './graphql/offering-variant-option.type';
import { SiteOfferingsGatewayService } from './services/offerings-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_OFFERINGS.featureCode)
export class SiteOfferingsAppResolver {
  private readonly logger = new Logger(SiteOfferingsAppResolver.name);

  constructor(private readonly service: SiteOfferingsGatewayService) {}

  // Variants a storefront can point one of its own product pages at.
  @Query(() => OfferingVariantOptions, { name: 'siteOfferingVariants' })
  @RequirePermission(SITE_OFFERINGS.variantOptions)
  siteOfferingVariants(
    @Args({ name: 'search', type: () => String, nullable: true }) search?: string,
    @Args({ name: 'excludeIds', type: () => [ID], nullable: true }) excludeIds?: string[],
    @Args({ name: 'limit', type: () => Int, nullable: true }) limit?: number,
    @Args({ name: 'offset', type: () => Int, nullable: true }) offset?: number,
  ): Promise<OfferingVariantOptions> {
    this.logger.log(`QUERY siteOfferingVariants — search: ${search ?? ''}, exclude: ${excludeIds?.length ?? 0}`);
    return this.service.appVariantOptions({ search, excludeIds, limit, offset });
  }
}
