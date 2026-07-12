import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import { CategoriesItemsService } from './services/categories-items.service';

@Controller()
export class CategoriesItemsController {
  private readonly logger = new Logger(CategoriesItemsController.name);

  constructor(private readonly service: CategoriesItemsService) {}

  // Returns paginated inventory items linked to a leaf category
  @MessagePattern({ cmd: 'org.categories.itemsTable' })
  itemsTable(
    @Payload() data: { categoryId: string } & TableViewState,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log(`categories.itemsTable — categoryId: ${data.categoryId}`);
    const { categoryId, ...state } = data;
    return this.service.findItemsForTable(categoryId, state, siteCurrencyCode);
  }
}
