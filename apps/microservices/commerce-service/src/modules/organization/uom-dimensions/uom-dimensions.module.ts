import { UomDimensionsDomainModule } from '@domain/uom-dimensions/uom-dimensions.module';
import { Module } from '@nestjs/common';
import { UomDimensionsController } from './uom-dimensions.controller';

@Module({
  imports: [UomDimensionsDomainModule],
  controllers: [UomDimensionsController],
})
export class OrgUomDimensionsModule {}
