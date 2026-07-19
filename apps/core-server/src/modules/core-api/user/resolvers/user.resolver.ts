import { UserDomainService } from '@domain/user/services/user.service';
import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import type { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../../commerce-gateway/_shared/graphql/select.input';
import { SelectOptions } from '../../../commerce-gateway/_shared/graphql/select.type';

@Resolver()
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(private readonly userService: UserDomainService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'usersOptions' })
  async usersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY usersOptions');
    return this.userService.findForSelect((input ?? {}) as SelectOptionsQueryDto);
  }
}
