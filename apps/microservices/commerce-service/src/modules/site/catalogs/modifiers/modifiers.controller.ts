import type {
  ModifierGroupDto,
  ModifierGroupWithOptionsDto,
} from '@domain/modifier-groups/dto/entity/modifier-group.dto';
import type { ModifierOptionDto } from '@domain/modifier-groups/dto/entity/modifier-option.dto';
import { CreateModifierGroupDto } from '@domain/modifier-groups/dto/request/create-modifier-group.dto';
import { CreateModifierOptionDto } from '@domain/modifier-groups/dto/request/create-modifier-option.dto';
import { SelectModifiersDto } from '@domain/modifier-groups/dto/request/select-modifiers.dto';
import { UpdateModifierGroupPayloadDto } from '@domain/modifier-groups/dto/request/update-modifier-group.dto';
import { UpdateModifierOptionPayloadDto } from '@domain/modifier-groups/dto/request/update-modifier-option.dto';
import { ModifierGroupsDomainService } from '@domain/modifier-groups/services/modifier-groups.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class ModifiersController {
  private readonly logger = new Logger(ModifiersController.name);

  constructor(private readonly modifierGroupsService: ModifierGroupsDomainService) {}

  // Lists modifier groups within a catalog
  @MessagePattern({ cmd: 'site.catalogs.modifiers.list' })
  async modifiersList(@Payload() data: { catalogId: string }): Promise<ModifierGroupDto[]> {
    this.logger.log(`catalogs.modifiers.list — catalogId: ${data.catalogId}`);
    return this.modifierGroupsService.list(data.catalogId);
  }

  // Returns modifier group select results scoped to a catalog
  @MessagePattern({ cmd: 'site.catalogs.modifiers.select' })
  async modifiersSelect(@Payload() dto: SelectModifiersDto): Promise<SelectQueryResult> {
    const { catalogId, ...query } = dto;
    this.logger.log(`catalogs.modifiers.select — catalogId: ${catalogId}`);
    return this.modifierGroupsService.select(catalogId, query);
  }

  // Returns a single modifier group with its options
  @MessagePattern({ cmd: 'site.catalogs.modifiers.get' })
  async modifiersGet(@Payload() data: { groupId: string }): Promise<ModifierGroupWithOptionsDto> {
    this.logger.log(`catalogs.modifiers.get — groupId: ${data.groupId}`);
    return this.modifierGroupsService.get(data.groupId);
  }

  // Creates a modifier group within a catalog
  @MessagePattern({ cmd: 'site.catalogs.modifiers.create' })
  async modifiersCreate(@Payload() dto: CreateModifierGroupDto): Promise<ModifierGroupDto> {
    this.logger.log(`catalogs.modifiers.create — catalogId: ${dto.catalogId}, name: ${dto.name}`);
    return this.modifierGroupsService.create(dto);
  }

  // Updates a modifier group
  @MessagePattern({ cmd: 'site.catalogs.modifiers.update' })
  async modifiersUpdate(@Payload() data: UpdateModifierGroupPayloadDto): Promise<ModifierGroupDto> {
    const { groupId, ...updateData } = data;
    this.logger.log(`catalogs.modifiers.update — groupId: ${groupId}`);
    return this.modifierGroupsService.update(groupId, updateData);
  }

  // Deletes a modifier group
  @MessagePattern({ cmd: 'site.catalogs.modifiers.delete' })
  async modifiersDelete(@Payload() data: { groupId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.modifiers.delete — groupId: ${data.groupId}`);
    return this.modifierGroupsService.delete(data.groupId);
  }

  // Creates a modifier option within a group
  @MessagePattern({ cmd: 'site.catalogs.modifiers.options.create' })
  async modifiersOptionsCreate(@Payload() dto: CreateModifierOptionDto): Promise<ModifierOptionDto> {
    this.logger.log(`catalogs.modifiers.options.create — groupId: ${dto.groupId}`);
    return this.modifierGroupsService.createOption(dto);
  }

  // Updates a modifier option
  @MessagePattern({ cmd: 'site.catalogs.modifiers.options.update' })
  async modifiersOptionsUpdate(@Payload() data: UpdateModifierOptionPayloadDto): Promise<ModifierOptionDto> {
    const { optionId, ...updateData } = data;
    this.logger.log(`catalogs.modifiers.options.update — optionId: ${optionId}`);
    return this.modifierGroupsService.updateOption(optionId, updateData);
  }

  // Deletes a modifier option
  @MessagePattern({ cmd: 'site.catalogs.modifiers.options.delete' })
  async modifiersOptionsDelete(@Payload() data: { optionId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.modifiers.options.delete — optionId: ${data.optionId}`);
    return this.modifierGroupsService.deleteOption(data.optionId);
  }
}
