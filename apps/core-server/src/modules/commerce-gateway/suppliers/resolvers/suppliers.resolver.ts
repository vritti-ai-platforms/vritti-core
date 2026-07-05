import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { SuppliersGatewayService } from '../services/suppliers-gateway.service';

// GraphQL options query for the Supplier Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service). The gateway `.select()` takes a plain SelectOptionsQueryDto,
// so the shared input is forwarded as-is with a localized cast.
@Resolver()
export class SuppliersResolver {
  private readonly logger = new Logger(SuppliersResolver.name);

  constructor(private readonly suppliersGatewayService: SuppliersGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'suppliersOptions' })
  async suppliersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY suppliersOptions');
    return this.suppliersGatewayService.select((input ?? {}) as SelectOptionsQueryDto);
  }
}
