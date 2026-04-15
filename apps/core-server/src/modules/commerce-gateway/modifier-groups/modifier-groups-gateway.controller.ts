import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SuccessResponseDto } from '@vritti/api-sdk';
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
import { CreateModifierGroupDto } from './dto/request/create-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/request/create-modifier-option.dto';
import { UpdateModifierGroupDto } from './dto/request/update-modifier-group.dto';
import { UpdateModifierOptionDto } from './dto/request/update-modifier-option.dto';
import type { ModifierGroupResponseDto, ModifierOptionResponseDto } from './dto/response/modifier-group-response.dto';
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
  async list(): Promise<ModifierGroupResponseDto[]> {
    return this.modifierGroupsGatewayService.list();
  }

  // Returns a single modifier group with options
  @Get(':id')
  @ApiGetModifierGroup()
  async get(@Param('id') id: string): Promise<ModifierGroupResponseDto> {
    return this.modifierGroupsGatewayService.get(id);
  }

  // Creates a new modifier group
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateModifierGroup()
  async create(@Body() dto: CreateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    return this.modifierGroupsGatewayService.create(dto);
  }

  // Updates a modifier group by ID
  @Patch(':id')
  @ApiUpdateModifierGroup()
  async update(@Param('id') id: string, @Body() dto: UpdateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    return this.modifierGroupsGatewayService.update(id, dto);
  }

  // Deletes a modifier group by ID
  @Delete(':id')
  @ApiDeleteModifierGroup()
  async delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.modifierGroupsGatewayService.delete(id);
  }

  // Creates a new option in a modifier group
  @Post(':id/options')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateModifierOption()
  async createOption(@Param('id') id: string, @Body() dto: CreateModifierOptionDto): Promise<ModifierOptionResponseDto> {
    return this.modifierGroupsGatewayService.createOption(id, dto);
  }

  // Updates an option in a modifier group
  @Patch(':id/options/:optionId')
  @ApiUpdateModifierOption()
  async updateOption(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateModifierOptionDto,
  ): Promise<ModifierOptionResponseDto> {
    return this.modifierGroupsGatewayService.updateOption(id, optionId, dto);
  }

  // Deletes an option from a modifier group
  @Delete(':id/options/:optionId')
  @ApiDeleteModifierOption()
  async deleteOption(@Param('id') id: string, @Param('optionId') optionId: string): Promise<SuccessResponseDto> {
    return this.modifierGroupsGatewayService.deleteOption(id, optionId);
  }
}
