import type {
  ModifierGroupDto,
  ModifierGroupWithOptionsDto,
} from '@domain/modifier-groups/dto/entity/modifier-group.dto';
import type { ModifierOptionDto } from '@domain/modifier-groups/dto/entity/modifier-option.dto';
import { ModifierGroupsService } from '@domain/modifier-groups/services/modifier-groups.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateModifierGroupDto } from './dto/request/create-modifier-group.dto';
import type { CreateModifierOptionDto } from './dto/request/create-modifier-option.dto';
import type { SaveItemModifiersDto } from './dto/request/save-item-modifiers.dto';
import type { UpdateModifierGroupDto } from './dto/request/update-modifier-group.dto';
import type { UpdateModifierOptionDto } from './dto/request/update-modifier-option.dto';

@Controller()
export class ModifierGroupsController {
  private readonly logger = new Logger(ModifierGroupsController.name);

  constructor(private readonly modifierGroupsService: ModifierGroupsService) {}

  // Lists all modifier groups (RLS scopes to org + BU ancestors)
  @MessagePattern({ cmd: 'modifierGroups.list' })
  async list(): Promise<ModifierGroupDto[]> {
    this.logger.log('modifierGroups.list');
    return this.modifierGroupsService.list();
  }

  // Returns a single modifier group with its options (RLS scopes visibility)
  @MessagePattern({ cmd: 'modifierGroups.get' })
  async get(@Payload() data: { id: string }): Promise<ModifierGroupWithOptionsDto> {
    this.logger.log(`modifierGroups.get — id: ${data.id}`);
    return this.modifierGroupsService.get(data.id);
  }

  // Creates a new modifier group (org_id/bu_id auto-filled by DB defaults from session vars)
  @MessagePattern({ cmd: 'modifierGroups.create' })
  async create(@Payload() dto: CreateModifierGroupDto): Promise<ModifierGroupDto> {
    this.logger.log(`modifierGroups.create — name: ${dto.name}`);
    return this.modifierGroupsService.create(dto);
  }

  // Updates a modifier group by ID
  @MessagePattern({ cmd: 'modifierGroups.update' })
  async update(@Payload() data: { id: string } & UpdateModifierGroupDto): Promise<ModifierGroupDto> {
    const { id, ...updateData } = data;
    this.logger.log(`modifierGroups.update — id: ${id}`);
    return this.modifierGroupsService.update(id, updateData);
  }

  // Deletes a modifier group by ID
  @MessagePattern({ cmd: 'modifierGroups.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`modifierGroups.delete — id: ${data.id}`);
    return this.modifierGroupsService.delete(data.id);
  }

  // Adds an option to a modifier group
  @MessagePattern({ cmd: 'modifierGroups.options.create' })
  async createOption(@Payload() dto: CreateModifierOptionDto): Promise<ModifierOptionDto> {
    this.logger.log(`modifierGroups.options.create — groupId: ${dto.groupId}`);
    return this.modifierGroupsService.createOption(dto);
  }

  // Updates an option in a modifier group
  @MessagePattern({ cmd: 'modifierGroups.options.update' })
  async updateOption(@Payload() data: { optionId: string } & UpdateModifierOptionDto): Promise<ModifierOptionDto> {
    const { optionId, ...updateData } = data;
    this.logger.log(`modifierGroups.options.update — optionId: ${optionId}`);
    return this.modifierGroupsService.updateOption(optionId, updateData);
  }

  // Removes an option from a modifier group
  @MessagePattern({ cmd: 'modifierGroups.options.delete' })
  async deleteOption(@Payload() data: { optionId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`modifierGroups.options.delete — optionId: ${data.optionId}`);
    return this.modifierGroupsService.deleteOption(data.optionId);
  }

  // Returns assigned modifier groups for an item with options
  @MessagePattern({ cmd: 'items.modifiers.list' })
  async listItemModifiers(@Payload() data: { itemId: string }): Promise<ModifierGroupWithOptionsDto[]> {
    this.logger.log(`items.modifiers.list — itemId: ${data.itemId}`);
    return this.modifierGroupsService.listItemModifiers(data.itemId);
  }

  // Assigns modifier groups to an item (replaces all)
  @MessagePattern({ cmd: 'items.modifiers.save' })
  async saveItemModifiers(@Payload() dto: SaveItemModifiersDto): Promise<ModifierGroupWithOptionsDto[]> {
    this.logger.log(`items.modifiers.save — itemId: ${dto.itemId}`);
    return this.modifierGroupsService.saveItemModifiers(dto);
  }
}
