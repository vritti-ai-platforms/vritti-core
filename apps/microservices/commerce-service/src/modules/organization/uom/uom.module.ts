import { UomDomainModule } from '@domain/uom/uom.module';
import { UomDimensionsDomainModule } from '@domain/uom-dimensions/uom-dimensions.module';
import { Module } from '@nestjs/common';
import { UomDimensionsController } from './dimensions/uom-dimensions.controller';
import { UomController } from './root/uom.controller';

@Module({
  imports: [UomDomainModule, UomDimensionsDomainModule],
  controllers: [UomController, UomDimensionsController],
})
export class OrgUomModule {}
