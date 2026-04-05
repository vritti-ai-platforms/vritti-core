import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreateModifierGroup,
  ApiCreateModifierOption,
  ApiDeleteModifierGroup,
  ApiDeleteModifierOption,
  ApiGetModifierGroup,
  ApiListModifierGroups,
  ApiUpdateModifierGroup,
  ApiUpdateModifierOption,
} from './docs/modifier-groups-gateway.docs';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import type { ModifierGroupResponseDto, ModifierOptionResponseDto } from './dto/modifier-group-response.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { ModifierGroupsGatewayService } from './services/modifier-groups-gateway.service';

@ApiTags('Commerce - Modifier Groups')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('modifier-groups')
export class ModifierGroupsGatewayController {
  private readonly logger = new Logger(ModifierGroupsGatewayController.name);

  constructor(private readonly modifierGroupsGatewayService: ModifierGroupsGatewayService) {}

  // Returns all modifier groups for a business unit
  @Get()
  @ApiListModifierGroups()
  async list(@UserId() userId: string, @Query('buId') buId: string): Promise<ModifierGroupResponseDto[]> {
    this.logger.log(`GET /commerce-api/modifier-groups?buId=${buId} — user: ${userId}`);
    return this.modifierGroupsGatewayService.list(userId, buId);
  }

  // Returns a single modifier group with options
  @Get(':id')
  @ApiGetModifierGroup()
  async get(@UserId() userId: string, @Param('id') id: string): Promise<ModifierGroupResponseDto> {
    this.logger.log(`GET /commerce-api/modifier-groups/${id} — user: ${userId}`);
    return this.modifierGroupsGatewayService.get(id);
  }

  // Creates a new modifier group
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateModifierGroup()
  async create(@UserId() userId: string, @Body() dto: CreateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    this.logger.log(`POST /commerce-api/modifier-groups — user: ${userId}`);
    return this.modifierGroupsGatewayService.create(userId, dto);
  }

  // Updates a modifier group by ID
  @Patch(':id')
  @ApiUpdateModifierGroup()
  async update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateModifierGroupDto,
  ): Promise<ModifierGroupResponseDto> {
    this.logger.log(`PATCH /commerce-api/modifier-groups/${id} — user: ${userId}`);
    return this.modifierGroupsGatewayService.update(userId, id, dto);
  }

  // Deletes a modifier group by ID
  @Delete(':id')
  @ApiDeleteModifierGroup()
  async delete(@UserId() userId: string, @Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`DELETE /commerce-api/modifier-groups/${id} — user: ${userId}`);
    return this.modifierGroupsGatewayService.delete(id);
  }

  // Creates a new option in a modifier group
  @Post(':id/options')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateModifierOption()
  async createOption(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: CreateModifierOptionDto,
  ): Promise<ModifierOptionResponseDto> {
    this.logger.log(`POST /commerce-api/modifier-groups/${id}/options — user: ${userId}`);
    return this.modifierGroupsGatewayService.createOption(userId, id, dto);
  }

  // Updates an option in a modifier group
  @Patch(':id/options/:optionId')
  @ApiUpdateModifierOption()
  async updateOption(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateModifierOptionDto,
  ): Promise<ModifierOptionResponseDto> {
    this.logger.log(`PATCH /commerce-api/modifier-groups/${id}/options/${optionId} — user: ${userId}`);
    return this.modifierGroupsGatewayService.updateOption(userId, id, optionId, dto);
  }

  // Deletes an option from a modifier group
  @Delete(':id/options/:optionId')
  @ApiDeleteModifierOption()
  async deleteOption(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('optionId') optionId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`DELETE /commerce-api/modifier-groups/${id}/options/${optionId} — user: ${userId}`);
    return this.modifierGroupsGatewayService.deleteOption(id, optionId);
  }
}
