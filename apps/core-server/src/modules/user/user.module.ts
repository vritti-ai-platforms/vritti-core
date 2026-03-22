import { forwardRef, Module } from '@nestjs/common';
import { WebhookSecretGuard } from '../../common/guards/webhook-secret.guard';
import { AuthModule } from '../auth/auth.module';
import { BusinessUnitModule } from '../business-unit/business-unit.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserRoleController } from './controllers/user-role.controller';
import { UserController } from './controllers/user.controller';
import { UserRoleAssignmentRepository } from './repositories/user-role-assignment.repository';
import { UserRepository } from './repositories/user.repository';
import { UserRoleService } from './services/user-role.service';
import { UserService } from './services/user.service';

@Module({
  imports: [forwardRef(() => AuthModule), OrganizationModule, BusinessUnitModule],
  controllers: [UserController, UserRoleController],
  providers: [
    UserService,
    UserRepository,
    UserRoleService,
    UserRoleAssignmentRepository,
    WebhookSecretGuard,
  ],
  exports: [UserService, UserRoleAssignmentRepository],
})
export class UserModule {}
