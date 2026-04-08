import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk';
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
  async list(): Promise<TaxGroupResponseDto[]> {
    return this.taxGroupsGatewayService.list();
  }

  // Creates a new tax group
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateTaxGroup()
  async create(@Body() dto: CreateTaxGroupDto): Promise<TaxGroupResponseDto> {
    return this.taxGroupsGatewayService.create(dto);
  }

  // Returns a single tax group by ID
  @Get(':id')
  @ApiGetTaxGroup()
  async findById(@Param('id') id: string): Promise<TaxGroupResponseDto> {
    return this.taxGroupsGatewayService.findById(id);
  }

  // Updates a tax group by ID
  @Patch(':id')
  @ApiUpdateTaxGroup()
  async update(@Param('id') id: string, @Body() dto: UpdateTaxGroupDto): Promise<TaxGroupResponseDto> {
    return this.taxGroupsGatewayService.update(id, dto);
  }

  // Deletes a tax group by ID
  @Delete(':id')
  @ApiDeleteTaxGroup()
  async delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.taxGroupsGatewayService.delete(id);
  }
}
