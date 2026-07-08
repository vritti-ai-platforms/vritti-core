import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { CostCategoriesGatewayService } from '../services/cost-categories-gateway.service';

@Resolver()
export class CostCategoriesResolver {
  private readonly logger = new Logger(CostCategoriesResolver.name);

  constructor(private readonly costCategoriesGatewayService: CostCategoriesGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'costCategoriesOptions' })
  async costCategoriesOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY costCategoriesOptions');
    return this.costCategoriesGatewayService.select((input ?? {}) as SelectOptionsQueryDto);
  }
}
