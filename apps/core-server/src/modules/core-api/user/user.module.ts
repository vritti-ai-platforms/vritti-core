import { Module } from '@nestjs/common';
import { UserDomainModule } from '@domain/user/user.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { WebhookSessionInterceptor } from '@/common/interceptors/webhook-session.interceptor';
import { UserRoleController } from './controllers/user-role.controller';
import { UserController } from './controllers/user.controller';
import { UserResolver } from './resolvers/user.resolver';

@Module({
  imports: [UserDomainModule, UserRoleDomainModule],
  controllers: [UserController, UserRoleController],
  providers: [WebhookSecretGuard, WebhookSessionInterceptor, UserResolver],
})
export class UserApiModule {}
