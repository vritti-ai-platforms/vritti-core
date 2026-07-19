import { Module } from '@nestjs/common';
import { VariantOptionsDomainRepository } from './repositories/variant-options.repository';
import { VariantOptionsDomainService } from './services/variant-options.service';

@Module({
  providers: [VariantOptionsDomainService, VariantOptionsDomainRepository],
  exports: [VariantOptionsDomainService, VariantOptionsDomainRepository],
})
export class VariantOptionsDomainModule {}
