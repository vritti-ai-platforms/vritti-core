import { UserService } from '@domain/user/services/user.service';
import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../../commerce-gateway/_shared/graphql/select.input';
import { SelectOptions } from '../../../commerce-gateway/_shared/graphql/select.type';

// GraphQL options query for the User Select dropdown. Thin forward to the existing `UserService.findForSelect`
// (which backs GET /users/select). No entity params — just the shared SelectOptionsInput. Reuses the shared
// SelectOptions/SelectOptionsInput GraphQL types defined under commerce-gateway/_shared/graphql.
@Resolver()
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(private readonly userService: UserService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'usersOptions' })
  async usersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY usersOptions');
    return this.userService.findForSelect((input ?? {}) as SelectOptionsQueryDto);
  }
}
