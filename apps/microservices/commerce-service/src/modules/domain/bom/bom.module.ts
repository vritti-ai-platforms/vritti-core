import { Module } from '@nestjs/common';
import { BomRepository } from './repositories/bom.repository';
import { BomService } from './services/bom.service';

@Module({
  providers: [BomService, BomRepository],
  exports: [BomService, BomRepository],
})
export class BomDomainModule {}
