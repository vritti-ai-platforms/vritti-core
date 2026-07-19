import { Module } from '@nestjs/common';
import { ModifierGroupsDomainRepository } from './repositories/modifier-groups.repository';
import { ModifierGroupsDomainService } from './services/modifier-groups.service';

@Module({
  providers: [ModifierGroupsDomainService, ModifierGroupsDomainRepository],
  exports: [ModifierGroupsDomainService, ModifierGroupsDomainRepository],
})
export class ModifierGroupsDomainModule {}
