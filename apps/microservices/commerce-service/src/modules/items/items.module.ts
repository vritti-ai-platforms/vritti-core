import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsRepository } from './repositories/items.repository';
import { ItemsService } from './services/items.service';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, ItemsRepository],
})
export class ItemsModule {}
