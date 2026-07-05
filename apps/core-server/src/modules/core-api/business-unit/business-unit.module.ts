import { BusinessUnitDomainModule } from '@domain/business-unit/business-unit.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { BusinessUnitController } from './controllers/business-unit.controller';
import { BusinessUnitApiService } from './services/business-unit-api.service';

@Module({
  imports: [BusinessUnitDomainModule, UserRoleDomainModule],
  controllers: [BusinessUnitController],
  providers: [BusinessUnitApiService],
})
export class BusinessUnitApiModule {}
