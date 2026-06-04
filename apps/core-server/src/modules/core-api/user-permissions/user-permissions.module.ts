import { Module } from '@nestjs/common';
import { UserDomainModule } from '@domain/user/user.module';
import { UserPermissionsDomainModule } from '@domain/user-permissions/user-permissions.module';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { UserPermissionsApiService } from './services/user-permissions-api.service';

@Module({
  imports: [UserDomainModule, UserPermissionsDomainModule],
  controllers: [UserPermissionsController],
  providers: [UserPermissionsApiService],
})
export class UserPermissionsApiModule {}
