import { Module } from '@nestjs/common';
import { UomConversionsRepository } from './repositories/uom-conversions.repository';
import { UomConversionsService } from './services/uom-conversions.service';

@Module({
  providers: [UomConversionsService, UomConversionsRepository],
  exports: [UomConversionsService, UomConversionsRepository],
})
export class UomConversionsDomainModule {}
