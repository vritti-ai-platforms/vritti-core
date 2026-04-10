import { Module } from '@nestjs/common';
import { ConversionsRepository } from './repositories/conversions.repository';
import { ConversionsService } from './services/conversions.service';

@Module({
  providers: [ConversionsService, ConversionsRepository],
  exports: [ConversionsService, ConversionsRepository],
})
export class ConversionsDomainModule {}
