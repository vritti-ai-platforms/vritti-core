import { Module, forwardRef } from '@nestjs/common';
import { BusinessUnitModule } from '../business-unit/business-unit.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { UserPermissionsService } from './services/user-permissions.service';

@Module({
  imports: [forwardRef(() => UserModule), OrganizationModule, BusinessUnitModule],
  controllers: [UserPermissionsController],
  providers: [UserPermissionsService],
})
export class UserPermissionsModule {}
