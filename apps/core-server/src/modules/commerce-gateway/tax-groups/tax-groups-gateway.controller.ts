import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  UserId,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreateTaxGroup,
  ApiDeleteTaxGroup,
  ApiFindForTableTaxGroups,
  ApiGetTaxGroup,
  ApiSelectTaxGroups,
  ApiUpdateTaxGroup,
} from './docs/tax-groups-gateway.docs';
import { CreateTaxGroupDto } from './dto/request/create-tax-group.dto';
import { UpdateTaxGroupDto } from './dto/request/update-tax-group.dto';
import type { TaxGroupResponseDto } from './dto/response/tax-group-response.dto';
import type { TaxGroupTableResponseDto } from './dto/response/tax-group-table-response.dto';
import { TaxGroupsGatewayService } from './services/tax-groups-gateway.service';

@ApiTags('Commerce - Tax Groups')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('tax-groups')
export class TaxGroupsGatewayController {
  constructor(private readonly taxGroupsGatewayService: TaxGroupsGatewayService) {}

  // Returns a paginated page of tax groups for the data table
  @Get('table')
  @ApiFindForTableTaxGroups()
  findForTable(@UserId() userId: string): Promise<TaxGroupTableResponseDto> {
    return this.taxGroupsGatewayService.findForTable(userId);
  }

  // Returns tax groups as dropdown options
  @Get('select')
  @ApiSelectTaxGroups()
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.taxGroupsGatewayService.select(query);
  }

  // Creates a new tax group
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateTaxGroup()
  async create(@Body() dto: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupResponseDto>> {
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
  async update(@Param('id') id: string, @Body() dto: UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    return this.taxGroupsGatewayService.update(id, dto);
  }

  // Deletes a tax group by ID
  @Delete(':id')
  @ApiDeleteTaxGroup()
  async delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.taxGroupsGatewayService.delete(id);
  }
}
