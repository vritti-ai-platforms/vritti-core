import { CategoriesService } from '@domain/categories/services/categories.service';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateInventoryItemDto } from '../dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';

// Top-level service for inventory item create/update paths that require
// cross-domain validation: the assigned category must be a leaf.
@Injectable()
export class InventoryItemsRootService {
  private readonly logger = new Logger(InventoryItemsRootService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(dto: CreateInventoryItemDto, buCurrencyCode?: string): Promise<CreateResponseDto<InventoryItemDto>> {
    this.logger.log(`create — name=${dto.name}, code=${dto.code}, categoryId=${dto.categoryId}`);
    await this.categoriesService.assertIsLeaf(dto.categoryId);
    return this.inventoryItemsService.create(dto, buCurrencyCode);
  }

  async update(id: string, dto: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`update — id=${id}${dto.categoryId ? `, categoryId=${dto.categoryId}` : ''}`);
    if (dto.categoryId !== undefined) {
      await this.categoriesService.assertIsLeaf(dto.categoryId);
    }
    return this.inventoryItemsService.update(id, dto);
  }
}
