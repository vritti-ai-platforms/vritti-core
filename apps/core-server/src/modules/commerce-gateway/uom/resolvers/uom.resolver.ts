import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { UomGatewayService } from '../services/uom-gateway.service';

// GraphQL options query for the UOM Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service). Entity params (dimensionId / baseOnly / derivedOnly) are
// merged into the same params object the service signature expects; buId flows via the NATS request context.
@Resolver()
export class UomResolver {
  private readonly logger = new Logger(UomResolver.name);

  constructor(private readonly uomGatewayService: UomGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'uomOptions' })
  async uomOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('dimensionId', { type: () => ID, nullable: true }) dimensionId?: string,
    @Args('baseOnly', { type: () => Boolean, nullable: true }) baseOnly?: boolean,
    @Args('derivedOnly', { type: () => Boolean, nullable: true }) derivedOnly?: boolean,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY uomOptions');
    return this.uomGatewayService.select({
      ...((input ?? {}) as SelectOptionsQueryDto),
      dimensionId,
      baseOnly,
      derivedOnly,
    });
  }
}
