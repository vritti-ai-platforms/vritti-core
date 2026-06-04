import { Module } from '@nestjs/common';
import { BusinessUnitDomainModule } from '../business-unit/business-unit.module';
import { UserRoleDomainModule } from '../user-role/user-role.module';
import { UserPermissionsService } from './services/user-permissions.service';

@Module({
  imports: [UserRoleDomainModule, BusinessUnitDomainModule],
  providers: [UserPermissionsService],
  exports: [UserPermissionsService],
})
export class UserPermissionsDomainModule {}
