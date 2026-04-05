import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { ItemDto } from './dto/item.dto';
import type { ItemDetailDto, ItemVariantDto } from './dto/item-detail.dto';
import type { CreateItemDto } from './dto/create-item.dto';
import type { UpdateItemDto } from './dto/update-item.dto';
import type { SaveOptionsDto } from './dto/save-options.dto';
import type { UpdateVariantDto } from './dto/update-variant.dto';
import { ItemsService } from './services/items.service';

@Controller()
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(private readonly itemsService: ItemsService) {}

  // Lists all items for a business unit
  @MessagePattern({ cmd: 'items.list' })
  async list(data: { organizationId: string; businessUnitId: string }): Promise<ItemDto[]> {
    this.logger.log(`items.list — buId: ${data.businessUnitId}`);
    return this.itemsService.list(data.businessUnitId);
  }

  // Creates a new catalog item
  @MessagePattern({ cmd: 'items.create' })
  async create(data: CreateItemDto): Promise<ItemDto> {
    this.logger.log(`items.create — buId: ${data.businessUnitId}`);
    return this.itemsService.create(data);
  }

  // Finds an item by ID with full details
  @MessagePattern({ cmd: 'items.findById' })
  async findById(data: { id: string }): Promise<ItemDetailDto> {
    this.logger.log(`items.findById — id: ${data.id}`);
    return this.itemsService.findById(data.id);
  }

  // Updates an item's basic info
  @MessagePattern({ cmd: 'items.update' })
  async update(data: { id: string } & UpdateItemDto): Promise<ItemDto> {
    const { id, ...updateData } = data;
    this.logger.log(`items.update — id: ${id}`);
    return this.itemsService.update(id, updateData);
  }

  // Deletes an item by ID
  @MessagePattern({ cmd: 'items.delete' })
  async delete(data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`items.delete — id: ${data.id}`);
    return this.itemsService.delete(data.id);
  }

  // Replaces all options and values for an item
  @MessagePattern({ cmd: 'items.options.save' })
  async saveOptions(data: SaveOptionsDto): Promise<ItemDetailDto> {
    this.logger.log(`items.options.save — itemId: ${data.itemId}`);
    return this.itemsService.saveOptions(data);
  }

  // Generates variants from current options
  @MessagePattern({ cmd: 'items.variants.generate' })
  async generateVariants(data: { itemId: string }): Promise<ItemVariantDto[]> {
    this.logger.log(`items.variants.generate — itemId: ${data.itemId}`);
    return this.itemsService.generateVariants(data.itemId);
  }

  // Lists variants for an item
  @MessagePattern({ cmd: 'items.variants.list' })
  async listVariants(data: { itemId: string }): Promise<ItemVariantDto[]> {
    this.logger.log(`items.variants.list — itemId: ${data.itemId}`);
    return this.itemsService.listVariants(data.itemId);
  }

  // Deletes a single variant by ID
  @MessagePattern({ cmd: 'items.variants.delete' })
  async deleteVariant(data: { variantId: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`items.variants.delete — variantId: ${data.variantId}`);
    return this.itemsService.deleteVariant(data.variantId);
  }

  // Updates a single variant
  @MessagePattern({ cmd: 'items.variants.update' })
  async updateVariant(data: { itemId: string; variantId: string } & UpdateVariantDto): Promise<ItemVariantDto> {
    const { itemId: _itemId, variantId, ...updateData } = data;
    this.logger.log(`items.variants.update — variantId: ${variantId}`);
    return this.itemsService.updateVariant(variantId, updateData);
  }
}
