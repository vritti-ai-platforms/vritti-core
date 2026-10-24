import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OfferingVariantOptions } from './graphql/offering-variant-option.type';
import { OrgOfferingsGatewayService } from './services/offerings-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_OFFERINGS.featureCode)
export class OfferingsAppResolver {
  private readonly logger = new Logger(OfferingsAppResolver.name);

  constructor(private readonly service: OrgOfferingsGatewayService) {}

  // Variants a storefront can point one of its own product pages at. An app credential carries no site, so
  // this answers for the whole organization rather than one outlet.
  @Query(() => OfferingVariantOptions, { name: 'offeringVariants' })
  @RequirePermission(ORG_OFFERINGS.variantOptions)
  offeringVariants(
    @Args({ name: 'search', type: () => String, nullable: true }) search?: string,
    @Args({ name: 'excludeIds', type: () => [ID], nullable: true }) excludeIds?: string[],
    @Args({ name: 'limit', type: () => Int, nullable: true }) limit?: number,
    @Args({ name: 'offset', type: () => Int, nullable: true }) offset?: number,
  ): Promise<OfferingVariantOptions> {
    this.logger.log(`QUERY offeringVariants — search: ${search ?? ''}, exclude: ${excludeIds?.length ?? 0}`);
    return this.service.appVariantOptions({ search, excludeIds, limit, offset });
  }
}
