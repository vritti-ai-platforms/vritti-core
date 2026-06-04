import { Module } from '@nestjs/common';
import { ModifierGroupsRepository } from './repositories/modifier-groups.repository';
import { ModifierGroupsService } from './services/modifier-groups.service';

@Module({
  providers: [ModifierGroupsService, ModifierGroupsRepository],
  exports: [ModifierGroupsService, ModifierGroupsRepository],
})
export class ModifierGroupsDomainModule {}
