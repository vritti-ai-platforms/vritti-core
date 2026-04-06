import { ModifierGroupsDomainModule } from '@domain/modifier-groups/modifier-groups.module';
import { Module } from '@nestjs/common';
import { ModifierGroupsController } from './modifier-groups.controller';

@Module({
  imports: [ModifierGroupsDomainModule],
  controllers: [ModifierGroupsController],
})
export class ModifierGroupsModule {}
