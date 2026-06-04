import { Module } from '@nestjs/common';
import { VariantOptionsRepository } from './repositories/variant-options.repository';
import { VariantOptionsService } from './services/variant-options.service';

@Module({
  providers: [VariantOptionsService, VariantOptionsRepository],
  exports: [VariantOptionsService, VariantOptionsRepository],
})
export class VariantOptionsDomainModule {}
