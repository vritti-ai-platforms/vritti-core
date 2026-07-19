import { Module } from '@nestjs/common';
import { UomDomainRepository } from './repositories/uom.repository';
import { UomDomainService } from './services/uom.service';

@Module({
  providers: [UomDomainService, UomDomainRepository],
  exports: [UomDomainService, UomDomainRepository],
})
export class UomDomainModule {}
