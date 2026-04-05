import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { ModifierGroupDto, ModifierGroupWithOptionsDto } from './dto/modifier-group.dto';
import type { ModifierOptionDto } from './dto/modifier-option.dto';
import type { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import type { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import type { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import type { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import type { SaveItemModifiersDto } from './dto/save-item-modifiers.dto';
import { ModifierGroupsService } from './services/modifier-groups.service';

@Controller()
export class ModifierGroupsController {
  private readonly logger = new Logger(ModifierGroupsController.name);

  constructor(private readonly modifierGroupsService: ModifierGroupsService) {}

  // Lists all modifier groups for a business unit
  @MessagePattern({ cmd: 'modifierGroups.list' })
  async list(data: { organizationId: string; businessUnitId: string }): Promise<ModifierGroupDto[]> {
    this.logger.log(`modifierGroups.list — buId: ${data.businessUnitId}`);
    return this.modifierGroupsService.list(data.businessUnitId);
  }

  // Returns a single modifier group with its options
  @MessagePattern({ cmd: 'modifierGroups.get' })
  async get(data: { id: string }): Promise<ModifierGroupWithOptionsDto> {
    this.logger.log(`modifierGroups.get — id: ${data.id}`);
    return this.modifierGroupsService.get(data.id);
  }

  // Creates a new modifier group
  @MessagePattern({ cmd: 'modifierGroups.create' })
  async create(data: CreateModifierGroupDto): Promise<ModifierGroupDto> {
    this.logger.log(`modifierGroups.create — buId: ${data.businessUnitId}`);
    return this.modifierGroupsService.create(data);
  }

  // Updates a modifier group by ID
  @MessagePattern({ cmd: 'modifierGroups.update' })
  async update(data: { id: string } & UpdateModifierGroupDto): Promise<ModifierGroupDto> {
    const { id, ...updateData } = data;
    this.logger.log(`modifierGroups.update — id: ${id}`);
    return this.modifierGroupsService.update(id, updateData);
  }

  // Deletes a modifier group by ID
  @MessagePattern({ cmd: 'modifierGroups.delete' })
  async delete(data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`modifierGroups.delete — id: ${data.id}`);
    return this.modifierGroupsService.delete(data.id);
  }

  // Adds an option to a modifier group
  @MessagePattern({ cmd: 'modifierGroups.options.create' })
  async createOption(data: CreateModifierOptionDto): Promise<ModifierOptionDto> {
    this.logger.log(`modifierGroups.options.create — groupId: ${data.groupId}`);
    return this.modifierGroupsService.createOption(data);
  }

  // Updates an option in a modifier group
  @MessagePattern({ cmd: 'modifierGroups.options.update' })
  async updateOption(data: { optionId: string } & UpdateModifierOptionDto): Promise<ModifierOptionDto> {
    const { optionId, ...updateData } = data;
    this.logger.log(`modifierGroups.options.update — optionId: ${optionId}`);
    return this.modifierGroupsService.updateOption(optionId, updateData);
  }

  // Removes an option from a modifier group
  @MessagePattern({ cmd: 'modifierGroups.options.delete' })
  async deleteOption(data: { optionId: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`modifierGroups.options.delete — optionId: ${data.optionId}`);
    return this.modifierGroupsService.deleteOption(data.optionId);
  }

  // Returns assigned modifier groups for an item with options
  @MessagePattern({ cmd: 'items.modifiers.list' })
  async listItemModifiers(data: { itemId: string }): Promise<ModifierGroupWithOptionsDto[]> {
    this.logger.log(`items.modifiers.list — itemId: ${data.itemId}`);
    return this.modifierGroupsService.listItemModifiers(data.itemId);
  }

  // Assigns modifier groups to an item (replaces all)
  @MessagePattern({ cmd: 'items.modifiers.save' })
  async saveItemModifiers(data: SaveItemModifiersDto): Promise<ModifierGroupWithOptionsDto[]> {
    this.logger.log(`items.modifiers.save — itemId: ${data.itemId}`);
    return this.modifierGroupsService.saveItemModifiers(data);
  }
}
