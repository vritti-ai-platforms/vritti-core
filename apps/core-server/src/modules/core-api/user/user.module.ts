import { UserDomainModule } from '@domain/user/user.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserRoleController } from './controllers/user-role.controller';

@Module({
  imports: [UserDomainModule, UserRoleDomainModule],
  controllers: [UserController, UserRoleController],
})
export class UserApiModule {}
