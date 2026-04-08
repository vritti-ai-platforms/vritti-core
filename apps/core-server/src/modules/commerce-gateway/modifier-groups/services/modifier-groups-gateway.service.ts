import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk';
import type { CreateModifierGroupDto } from '../dto/request/create-modifier-group.dto';
import type { CreateModifierOptionDto } from '../dto/request/create-modifier-option.dto';
import type { UpdateModifierGroupDto } from '../dto/request/update-modifier-group.dto';
import type { UpdateModifierOptionDto } from '../dto/request/update-modifier-option.dto';
import type { ModifierGroupResponseDto, ModifierOptionResponseDto } from '../dto/response/modifier-group-response.dto';

@Injectable()
export class ModifierGroupsGatewayService {
  private readonly logger = new Logger(ModifierGroupsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns all modifier groups for the given BU
  async list(): Promise<ModifierGroupResponseDto[]> {
    this.logger.log('modifierGroups.list');
    return this.nats.send('commerce', 'modifierGroups.list');
  }

  // Returns a single modifier group with its options
  async get(id: string): Promise<ModifierGroupResponseDto> {
    this.logger.log(`modifierGroups.get — id: ${id}`);
    return this.nats.send('commerce', 'modifierGroups.get', { id });
  }

  // Creates a new modifier group
  async create(dto: CreateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    this.logger.log(`modifierGroups.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'modifierGroups.create', dto);
  }

  // Updates a modifier group by ID
  async update(id: string, dto: UpdateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    this.logger.log(`modifierGroups.update — id: ${id}`);
    return this.nats.send('commerce', 'modifierGroups.update', { id, ...dto });
  }

  // Deletes a modifier group by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`modifierGroups.delete — id: ${id}`);
    return this.nats.send('commerce', 'modifierGroups.delete', { id });
  }

  // Creates a new option in a modifier group
  async createOption(groupId: string, dto: CreateModifierOptionDto): Promise<ModifierOptionResponseDto> {
    this.logger.log(`modifierGroups.options.create — groupId: ${groupId}`);
    return this.nats.send('commerce', 'modifierGroups.options.create', { groupId, ...dto });
  }

  // Updates an option in a modifier group
  async updateOption(groupId: string, optionId: string, dto: UpdateModifierOptionDto): Promise<ModifierOptionResponseDto> {
    this.logger.log(`modifierGroups.options.update — optionId: ${optionId}`);
    return this.nats.send('commerce', 'modifierGroups.options.update', { groupId, optionId, ...dto });
  }

  // Deletes an option from a modifier group
  async deleteOption(groupId: string, optionId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`modifierGroups.options.delete — optionId: ${optionId}`);
    return this.nats.send('commerce', 'modifierGroups.options.delete', { groupId, optionId });
  }
}
