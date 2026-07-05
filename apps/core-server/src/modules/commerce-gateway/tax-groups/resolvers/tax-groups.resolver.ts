import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { TaxGroupsGatewayService } from '../services/tax-groups-gateway.service';

// GraphQL options query for the Tax Group Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service). The gateway `.select()` takes a plain SelectOptionsQueryDto,
// so the shared input is forwarded as-is with a localized cast.
@Resolver()
export class TaxGroupsResolver {
  private readonly logger = new Logger(TaxGroupsResolver.name);

  constructor(private readonly taxGroupsGatewayService: TaxGroupsGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'taxGroupsOptions' })
  async taxGroupsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY taxGroupsOptions');
    return this.taxGroupsGatewayService.select((input ?? {}) as SelectOptionsQueryDto);
  }
}
