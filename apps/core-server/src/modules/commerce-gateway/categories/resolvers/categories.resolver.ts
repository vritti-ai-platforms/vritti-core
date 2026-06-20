import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { CategoriesGatewayService } from '../services/categories-gateway.service';

// GraphQL options query for the Category Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service `findForSelect`). buId flows via the NATS request context — same
// as the inventory feed — so the gateway's `& { buId }` over-type is satisfied with a localized cast here.
@Resolver()
export class CategoriesResolver {
  private readonly logger = new Logger(CategoriesResolver.name);

  constructor(private readonly categoriesGatewayService: CategoriesGatewayService) {}

  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'categoriesOptions' })
  async categoriesOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY categoriesOptions');
    return this.categoriesGatewayService.select((input ?? {}) as SelectOptionsQueryDto & { buId: string });
  }
}
