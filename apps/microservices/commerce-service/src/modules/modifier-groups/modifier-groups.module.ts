import { Module } from '@nestjs/common';
import { ModifierGroupsController } from './modifier-groups.controller';
import { ModifierGroupsRepository } from './repositories/modifier-groups.repository';
import { ModifierGroupsService } from './services/modifier-groups.service';

@Module({
  controllers: [ModifierGroupsController],
  providers: [ModifierGroupsService, ModifierGroupsRepository],
})
export class ModifierGroupsModule {}
