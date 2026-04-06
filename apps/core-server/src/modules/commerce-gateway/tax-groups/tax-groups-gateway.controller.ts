import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreateTaxGroup,
  ApiDeleteTaxGroup,
  ApiGetTaxGroup,
  ApiListTaxGroups,
  ApiUpdateTaxGroup,
} from './docs/tax-groups-gateway.docs';
import { CreateTaxGroupDto } from './dto/request/create-tax-group.dto';
import { UpdateTaxGroupDto } from './dto/request/update-tax-group.dto';
import type { TaxGroupResponseDto } from './dto/response/tax-group-response.dto';
import { TaxGroupsGatewayService } from './services/tax-groups-gateway.service';

@ApiTags('Commerce - Tax Groups')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('tax-groups')
export class TaxGroupsGatewayController {
  private readonly logger = new Logger(TaxGroupsGatewayController.name);

  constructor(private readonly taxGroupsGatewayService: TaxGroupsGatewayService) {}

  // Returns all tax groups for a business unit
  @Get()
  @ApiListTaxGroups()
  async list(@UserId() userId: string, @Query('buId') buId: string): Promise<TaxGroupResponseDto[]> {
    this.logger.log(`GET /commerce-api/tax-groups?buId=${buId} — user: ${userId}`);
    return this.taxGroupsGatewayService.list(userId, buId);
  }

  // Creates a new tax group
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateTaxGroup()
  async create(@UserId() userId: string, @Body() dto: CreateTaxGroupDto): Promise<TaxGroupResponseDto> {
    this.logger.log(`POST /commerce-api/tax-groups — user: ${userId}`);
    return this.taxGroupsGatewayService.create(userId, dto);
  }

  // Returns a single tax group by ID
  @Get(':id')
  @ApiGetTaxGroup()
  async findById(@UserId() userId: string, @Param('id') id: string): Promise<TaxGroupResponseDto> {
    this.logger.log(`GET /commerce-api/tax-groups/${id} — user: ${userId}`);
    return this.taxGroupsGatewayService.findById(id);
  }

  // Updates a tax group by ID
  @Patch(':id')
  @ApiUpdateTaxGroup()
  async update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaxGroupDto,
  ): Promise<TaxGroupResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-groups/${id} — user: ${userId}`);
    return this.taxGroupsGatewayService.update(userId, id, dto);
  }

  // Deletes a tax group by ID
  @Delete(':id')
  @ApiDeleteTaxGroup()
  async delete(@UserId() userId: string, @Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`DELETE /commerce-api/tax-groups/${id} — user: ${userId}`);
    return this.taxGroupsGatewayService.delete(id);
  }
}
