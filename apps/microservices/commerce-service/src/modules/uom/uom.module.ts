import { UomDimensionsDomainModule } from '@domain/uom-dimensions/uom-dimensions.module';
import { UomDomainModule } from '@domain/uom/uom.module';
import { Module } from '@nestjs/common';
import { UomController } from './uom.controller';

@Module({
  imports: [UomDomainModule, UomDimensionsDomainModule],
  controllers: [UomController],
})
export class UomModule {}
