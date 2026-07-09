import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateTaxGroup,
  ApiDeleteTaxGroup,
  ApiFindForTableTaxGroups,
  ApiGetTaxGroup,
  ApiUpdateTaxGroup,
} from './docs/tax-groups-gateway.docs';
import { CreateTaxGroupDto } from './dto/request/create-tax-group.dto';
import { UpdateTaxGroupDto } from './dto/request/update-tax-group.dto';
import type { TaxGroupResponseDto } from './dto/response/tax-group-response.dto';
import type { TaxGroupTableResponseDto } from './dto/response/tax-group-table-response.dto';
import { TaxGroupsGatewayService } from './services/tax-groups-gateway.service';

@ApiTags('Commerce - Tax Groups')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(TAX_GROUPS.featureCode)
@Controller('tax-groups')
export class TaxGroupsGatewayController {
  constructor(private readonly taxGroupsGatewayService: TaxGroupsGatewayService) {}

  // Returns a paginated page of tax groups for the data table
  @Get('table')
  @RequirePermission(TAX_GROUPS.view)
  @ApiFindForTableTaxGroups()
  findForTable(@UserId() userId: string): Promise<TaxGroupTableResponseDto> {
    return this.taxGroupsGatewayService.findForTable(userId);
  }

  // Creates a new tax group
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(TAX_GROUPS.add)
  @ApiCreateTaxGroup()
  async create(@Body() dto: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupResponseDto>> {
    return this.taxGroupsGatewayService.create(dto);
  }

  // Returns a single tax group by ID
  @Get(':id')
  @RequirePermission(TAX_GROUPS.view)
  @ApiGetTaxGroup()
  async findById(@Param('id') id: string): Promise<TaxGroupResponseDto> {
    return this.taxGroupsGatewayService.findById(id);
  }

  // Updates a tax group by ID
  @Patch(':id')
  @RequirePermission(TAX_GROUPS.edit)
  @ApiUpdateTaxGroup()
  async update(@Param('id') id: string, @Body() dto: UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    return this.taxGroupsGatewayService.update(id, dto);
  }

  // Deletes a tax group by ID
  @Delete(':id')
  @RequirePermission(TAX_GROUPS.delete)
  @ApiDeleteTaxGroup()
  async delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.taxGroupsGatewayService.delete(id);
  }
}
