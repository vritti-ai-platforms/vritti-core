import { CategoriesDomainService } from '@domain/categories/services/categories.service';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import type { CreateInventoryItemDto } from '@domain/inventory-items/dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '@domain/inventory-items/dto/request/update-inventory-item.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

// Top-level service for inventory item create/update paths that require
// cross-domain validation: the assigned category must be a leaf.
@Injectable()
export class OrgInventoryItemsService {
  private readonly logger = new Logger(OrgInventoryItemsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly categoriesService: CategoriesDomainService,
  ) {}

  async create(dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    this.logger.log(`create — name=${dto.name}, code=${dto.code}, categoryId=${dto.categoryId}`);
    await this.categoriesService.assertIsLeaf(dto.categoryId);
    return this.inventoryItemsService.create(dto);
  }

  async update(id: string, dto: Omit<UpdateInventoryItemDto, 'id'>): Promise<SuccessResponseDto> {
    this.logger.log(`update — id=${id}${dto.categoryId ? `, categoryId=${dto.categoryId}` : ''}`);
    if (dto.categoryId !== undefined) {
      await this.categoriesService.assertIsLeaf(dto.categoryId);
    }
    return this.inventoryItemsService.update(id, dto);
  }
}
