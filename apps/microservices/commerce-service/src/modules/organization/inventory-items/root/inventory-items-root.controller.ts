import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  FilterCondition,
  SearchState,
  SortCondition,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import type { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';
import { InventoryItemsRootService } from './services/inventory-items-root.service';

@Controller()
export class InventoryItemsRootController {
  private readonly logger = new Logger(InventoryItemsRootController.name);

  constructor(
    private readonly service: InventoryItemsService,
    private readonly rootService: InventoryItemsRootService,
  ) {}

  // Org-wide master list of inventory items
  @MessagePattern({ cmd: 'org.inventoryItems.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log('inventoryItems.table');
    return this.service.findForOrgTable(state);
  }

  // Keyset master feed for the mobile infinite list
  @MessagePattern({ cmd: 'org.inventoryItems.feed' })
  async feed(
    @Payload()
    query: {
      filters?: FilterCondition[];
      search?: SearchState | null;
      sort?: SortCondition[];
      limit?: number;
      cursor?: string;
    },
  ): Promise<{
    edges: { cursor: string; node: InventoryItemDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log('inventoryItems.feed');
    return this.service.findForFeed(query);
  }

  // Creates a master inventory item (asserts the category is a leaf)
  @MessagePattern({ cmd: 'org.inventoryItems.create' })
  async create(@Payload() dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    this.logger.log(`inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.rootService.create(dto);
  }

  // Returns a single master inventory item by ID
  @MessagePattern({ cmd: 'org.inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a master inventory item
  @MessagePattern({ cmd: 'org.inventoryItems.update' })
  async update(@Payload() data: { id: string } & UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`inventoryItems.update — id: ${id}`);
    return this.rootService.update(id, updateData);
  }

  // Deletes a master inventory item
  @MessagePattern({ cmd: 'org.inventoryItems.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
