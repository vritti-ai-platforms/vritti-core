import { Module, forwardRef } from '@nestjs/common';
import { WebhookSecretGuard } from '../../common/guards/webhook-secret.guard';
import { AuthModule } from '../auth/auth.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserController } from './controllers/user.controller';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    OrganizationModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, WebhookSecretGuard],
  exports: [UserService],
})
export class UserModule {}
