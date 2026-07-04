import { UserDomainModule } from '@domain/user/user.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { CloudSignatureGuard } from '@/common/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/common/interceptors/org-scope.interceptor';
import { UserController } from './controllers/user.controller';
import { UserRoleController } from './controllers/user-role.controller';
import { UserResolver } from './resolvers/user.resolver';

@Module({
  imports: [UserDomainModule, UserRoleDomainModule],
  controllers: [UserController, UserRoleController],
  providers: [CloudSignatureGuard, OrgScopeInterceptor, UserResolver],
})
export class UserApiModule {}
