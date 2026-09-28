import { UserDomainService } from '@domain/user/services/user.service';
import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { SelectOptions, SelectOptionsInput } from '@vritti/api-sdk/select/graphql';
import { SessionTypeValues } from '@/db/schema';

@Resolver()
@Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
export class CoreSelectApiResolver {
  private readonly logger = new Logger(CoreSelectApiResolver.name);

  constructor(private readonly userService: UserDomainService) {}

  @Query(() => SelectOptions, { name: 'usersOptions' })
  usersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY usersOptions');
    return this.userService.findForSelect((input ?? {}) as SelectOptionsQueryDto);
  }
}
