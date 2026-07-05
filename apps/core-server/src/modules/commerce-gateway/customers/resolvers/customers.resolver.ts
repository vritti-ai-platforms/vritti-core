import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { CustomersGatewayService } from '../services/customers-gateway.service';

// GraphQL options query for the Customer Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service). The gateway `.select()` takes a plain SelectOptionsQueryDto,
// so the shared input is forwarded as-is with a localized cast.
@Resolver()
export class CustomersResolver {
  private readonly logger = new Logger(CustomersResolver.name);

  constructor(private readonly customersGatewayService: CustomersGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'customersOptions' })
  async customersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY customersOptions');
    return this.customersGatewayService.select((input ?? {}) as SelectOptionsQueryDto);
  }
}
