import { Module } from '@nestjs/common';
import { UserRoleAssignmentRepository } from '../user/repositories/user-role-assignment.repository';
import { BusinessUnitController } from './controllers/business-unit.controller';
import { BusinessUnitRepository } from './repositories/business-unit.repository';
import { BusinessUnitService } from './services/business-unit.service';

@Module({
  controllers: [BusinessUnitController],
  providers: [BusinessUnitService, BusinessUnitRepository, UserRoleAssignmentRepository],
  exports: [BusinessUnitService, BusinessUnitRepository],
})
export class BusinessUnitModule {}
