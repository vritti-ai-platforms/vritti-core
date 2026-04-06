import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UserService } from '@domain/user/services/user.service';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { CreateModifierGroupDto } from '../dto/request/create-modifier-group.dto';
import type { CreateModifierOptionDto } from '../dto/request/create-modifier-option.dto';
import type { UpdateModifierGroupDto } from '../dto/request/update-modifier-group.dto';
import type { UpdateModifierOptionDto } from '../dto/request/update-modifier-option.dto';
import type { ModifierGroupResponseDto, ModifierOptionResponseDto } from '../dto/response/modifier-group-response.dto';

@Injectable()
export class ModifierGroupsGatewayService {
  private readonly logger = new Logger(ModifierGroupsGatewayService.name);

  constructor(
    @Inject(COMMERCE_SERVICE) private readonly client: ClientProxy,
    private readonly userService: UserService,
  ) {}

  // Returns all modifier groups for the user's org + given BU
  async list(userId: string, buId: string): Promise<ModifierGroupResponseDto[]> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ModifierGroupResponseDto[]>({ cmd: 'modifierGroups.list' }, { organizationId: user.organizationId, businessUnitId: buId })
      .toPromise() as Promise<ModifierGroupResponseDto[]>;
  }

  // Returns a single modifier group with its options
  async get(id: string): Promise<ModifierGroupResponseDto> {
    return this.client
      .send<ModifierGroupResponseDto>({ cmd: 'modifierGroups.get' }, { id })
      .toPromise() as Promise<ModifierGroupResponseDto>;
  }

  // Creates a new modifier group, resolving organizationId from the authenticated user
  async create(userId: string, dto: CreateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ModifierGroupResponseDto>({ cmd: 'modifierGroups.create' }, { organizationId: user.organizationId, ...dto })
      .toPromise() as Promise<ModifierGroupResponseDto>;
  }

  // Updates a modifier group by ID
  async update(userId: string, id: string, dto: UpdateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ModifierGroupResponseDto>({ cmd: 'modifierGroups.update' }, { id, ...dto })
      .toPromise() as Promise<ModifierGroupResponseDto>;
  }

  // Deletes a modifier group by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return this.client
      .send<{ success: boolean; message: string }>({ cmd: 'modifierGroups.delete' }, { id })
      .toPromise() as Promise<{ success: boolean; message: string }>;
  }

  // Creates a new option in a modifier group
  async createOption(userId: string, groupId: string, dto: CreateModifierOptionDto): Promise<ModifierOptionResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ModifierOptionResponseDto>({ cmd: 'modifierGroups.options.create' }, { groupId, ...dto })
      .toPromise() as Promise<ModifierOptionResponseDto>;
  }

  // Updates an option in a modifier group
  async updateOption(userId: string, groupId: string, optionId: string, dto: UpdateModifierOptionDto): Promise<ModifierOptionResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ModifierOptionResponseDto>({ cmd: 'modifierGroups.options.update' }, { groupId, optionId, ...dto })
      .toPromise() as Promise<ModifierOptionResponseDto>;
  }

  // Deletes an option from a modifier group
  async deleteOption(groupId: string, optionId: string): Promise<{ success: boolean; message: string }> {
    return this.client
      .send<{ success: boolean; message: string }>({ cmd: 'modifierGroups.options.delete' }, { groupId, optionId })
      .toPromise() as Promise<{ success: boolean; message: string }>;
  }
}
