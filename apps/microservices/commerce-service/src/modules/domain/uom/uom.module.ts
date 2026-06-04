import { Module } from '@nestjs/common';
import { UomRepository } from './repositories/uom.repository';
import { UomService } from './services/uom.service';

@Module({
  providers: [UomService, UomRepository],
  exports: [UomService, UomRepository],
})
export class UomDomainModule {}
