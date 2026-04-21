import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import type { ModifierGroup } from '@/db/schema';
import type { CreateModifierGroupDto } from '@/modules/modifier-groups/dto/request/create-modifier-group.dto';
import type { CreateModifierOptionDto } from '@/modules/modifier-groups/dto/request/create-modifier-option.dto';
import type { SaveItemModifiersDto } from '@/modules/modifier-groups/dto/request/save-item-modifiers.dto';
import type { UpdateModifierGroupDto } from '@/modules/modifier-groups/dto/request/update-modifier-group.dto';
import type { UpdateModifierOptionDto } from '@/modules/modifier-groups/dto/request/update-modifier-option.dto';
import { ModifierGroupDto, ModifierGroupWithOptionsDto } from '../dto/entity/modifier-group.dto';
import { ModifierOptionDto } from '../dto/entity/modifier-option.dto';
import { ModifierGroupsRepository } from '../repositories/modifier-groups.repository';

@Injectable()
export class ModifierGroupsService {
  private readonly logger = new Logger(ModifierGroupsService.name);

  constructor(private readonly modifierGroupsRepository: ModifierGroupsRepository) {}

  // Returns all modifier groups (RLS scopes to org + BU ancestors)
  async list(): Promise<ModifierGroupDto[]> {
    const entities = await this.modifierGroupsRepository.findAll();
    return entities.map(ModifierGroupDto.from);
  }

  // Returns a single modifier group with its options
  async get(id: string): Promise<ModifierGroupWithOptionsDto> {
    const entity = await this.modifierGroupsRepository.findById(id);
    if (!entity) throw new NotFoundException('Modifier group not found.');
    const options = await this.modifierGroupsRepository.findOptionsByGroupId(id);
    return ModifierGroupWithOptionsDto.from(entity, options);
  }

  // Creates a new modifier group
  async create(data: CreateModifierGroupDto): Promise<ModifierGroupDto> {
    const entity = await this.modifierGroupsRepository.create({
      name: data.name,
      selectionType: data.selectionType,
      minSelections: data.minSelections ?? 0,
      maxSelections: data.maxSelections ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    });
    this.logger.log(`Created modifier group: ${entity.name} (${entity.id})`);
    return ModifierGroupDto.from(entity);
  }

  // Updates a modifier group by ID
  async update(id: string, data: UpdateModifierGroupDto): Promise<ModifierGroupDto> {
    const existing = await this.modifierGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Modifier group not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.selectionType !== undefined) updatePayload.selectionType = data.selectionType;
    if (data.minSelections !== undefined) updatePayload.minSelections = data.minSelections;
    if (data.maxSelections !== undefined) updatePayload.maxSelections = data.maxSelections;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const entity = await this.modifierGroupsRepository.update(id, updatePayload);
    this.logger.log(`Updated modifier group: ${entity.name} (${entity.id})`);
    return ModifierGroupDto.from(entity);
  }

  // Deletes a modifier group and its options and item links
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.modifierGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Modifier group not found.');

    await this.modifierGroupsRepository.deleteItemModifierGroupsByGroupId(id);
    await this.modifierGroupsRepository.deleteOptionsByGroupId(id);
    await this.modifierGroupsRepository.delete(id);
    this.logger.log(`Deleted modifier group: ${existing.name} (${id})`);
    return { success: true, message: `Modifier group "${existing.name}" deleted successfully.` };
  }

  // Creates a modifier option within a group
  async createOption(data: CreateModifierOptionDto): Promise<ModifierOptionDto> {
    const group = await this.modifierGroupsRepository.findById(data.groupId);
    if (!group) throw new NotFoundException('Modifier group not found.');

    const entity = await this.modifierGroupsRepository.createOption({
      groupId: data.groupId,
      name: data.name,
      additionalPrice: data.additionalPrice ?? 0,
      isDefault: data.isDefault ?? false,
      isAvailable: data.isAvailable ?? true,
      sortOrder: data.sortOrder ?? 0,
    });
    this.logger.log(`Created modifier option: ${entity.name} (${entity.id})`);
    return ModifierOptionDto.from(entity);
  }

  // Updates a modifier option by ID
  async updateOption(optionId: string, dto: UpdateModifierOptionDto): Promise<ModifierOptionDto> {
    const existing = await this.modifierGroupsRepository.findOptionById(optionId);
    if (!existing) throw new NotFoundException('Modifier option not found.');

    const updatePayload: Record<string, unknown> = {};
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.additionalPrice !== undefined) updatePayload.additionalPrice = dto.additionalPrice;
    if (dto.isDefault !== undefined) updatePayload.isDefault = dto.isDefault;
    if (dto.isAvailable !== undefined) updatePayload.isAvailable = dto.isAvailable;
    if (dto.sortOrder !== undefined) updatePayload.sortOrder = dto.sortOrder;

    const entity = await this.modifierGroupsRepository.updateOption(optionId, updatePayload);
    this.logger.log(`Updated modifier option: ${entity.name} (${entity.id})`);
    return ModifierOptionDto.from(entity);
  }

  // Deletes a modifier option by ID
  async deleteOption(optionId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.modifierGroupsRepository.findOptionById(optionId);
    if (!existing) throw new NotFoundException('Modifier option not found.');

    await this.modifierGroupsRepository.deleteOption(optionId);
    this.logger.log(`Deleted modifier option: ${existing.name} (${optionId})`);
    return { success: true, message: `Modifier option "${existing.name}" deleted successfully.` };
  }

  // Returns assigned modifier groups for an item with their options
  async listItemModifiers(itemId: string): Promise<ModifierGroupWithOptionsDto[]> {
    const links = await this.modifierGroupsRepository.findItemModifierGroups(itemId);
    const groupIds = links.map((l) => l.groupId);
    if (groupIds.length === 0) return [];

    const groups = await this.modifierGroupsRepository.findByIds(groupIds);
    return this.attachOptionsToGroups(groups);
  }

  // Replaces all modifier group assignments for an item
  async saveItemModifiers(data: SaveItemModifiersDto): Promise<ModifierGroupWithOptionsDto[]> {
    await this.modifierGroupsRepository.saveItemModifierGroups(data.itemId, data.groupIds);

    if (data.groupIds.length === 0) return [];
    const groups = await this.modifierGroupsRepository.findByIds(data.groupIds);
    this.logger.log(`Saved ${data.groupIds.length} modifier groups for item: ${data.itemId}`);
    return this.attachOptionsToGroups(groups);
  }

  // Attaches options to each modifier group
  private async attachOptionsToGroups(groups: ModifierGroup[]): Promise<ModifierGroupWithOptionsDto[]> {
    const result: ModifierGroupWithOptionsDto[] = [];
    for (const group of groups) {
      const options = await this.modifierGroupsRepository.findOptionsByGroupId(group.id);
      result.push(ModifierGroupWithOptionsDto.from(group, options));
    }
    return result;
  }
}
