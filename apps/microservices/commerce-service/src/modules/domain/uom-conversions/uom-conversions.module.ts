import { Module } from '@nestjs/common';
import { UomConversionsDomainRepository } from './repositories/uom-conversions.repository';
import { UomConversionsDomainService } from './services/uom-conversions.service';

@Module({
  providers: [UomConversionsDomainService, UomConversionsDomainRepository],
  exports: [UomConversionsDomainService, UomConversionsDomainRepository],
})
export class UomConversionsDomainModule {}
