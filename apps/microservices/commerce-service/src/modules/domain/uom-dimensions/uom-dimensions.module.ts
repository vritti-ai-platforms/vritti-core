import { Module } from '@nestjs/common';
import { UomDimensionsRepository } from './repositories/uom-dimensions.repository';
import { UomDimensionsService } from './services/uom-dimensions.service';

@Module({
  providers: [UomDimensionsService, UomDimensionsRepository],
  exports: [UomDimensionsService, UomDimensionsRepository],
})
export class UomDimensionsDomainModule {}
