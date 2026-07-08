import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  type SelectQueryResult,
  type SuccessResponseDto,
  UserId,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateUomDto } from './dto/request/create-uom.dto';
import { UomBaseQueryDto } from './dto/request/uom-base-query.dto';
import { UomSelectQueryDto } from './dto/request/uom-select-query.dto';
import { UpdateUomDto } from './dto/request/update-uom.dto';
import type { UomResponseDto } from './dto/response/uom-response.dto';
import type { UomTableResponseDto } from './dto/response/uom-table-response.dto';
import { UomGatewayService } from './services/uom-gateway.service';

@ApiTags('Commerce - Units of Measure')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('uom')
export class UomGatewayController {
  private readonly logger = new Logger(UomGatewayController.name);

  constructor(private readonly uomGatewayService: UomGatewayService) {}

  // Returns base units, optionally filtered by search
  @Get('base')
  findBaseUnits(@Query() query: UomBaseQueryDto): Promise<UomResponseDto[]> {
    this.logger.log('GET /commerce-api/uom/base');
    return this.uomGatewayService.findBaseUnits(query.search);
  }

  // Returns derived units for a given base unit
  @Get(':id/derived')
  findDerivedUnits(@Param('id') id: string): Promise<UomResponseDto[]> {
    this.logger.log(`GET /commerce-api/uom/${id}/derived`);
    return this.uomGatewayService.findDerivedUnits(id);
  }

  // Returns paginated UOM options for select dropdowns; pass derivedOnly=true to filter to derived units only
  @Get('select')
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  select(@Query() query: UomSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/uom/select');
    return this.uomGatewayService.select(query);
  }

  // Returns paginated UOMs for the data table, scoped to a dimension
  @Get('dimension/:dimensionId/table')
  findForTable(@Param('dimensionId') dimensionId: string, @UserId() userId: string): Promise<UomTableResponseDto> {
    this.logger.log(`GET /commerce-api/uom/dimension/${dimensionId}/table`);
    return this.uomGatewayService.findForTable(userId, dimensionId);
  }

  // Creates a new UOM
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
    this.logger.log('POST /commerce-api/uom');
    return this.uomGatewayService.create(dto);
  }

  // Updates a UOM by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUomDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/uom/${id}`);
    return this.uomGatewayService.update(id, dto);
  }

  // Deletes a UOM by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/uom/${id}`);
    return this.uomGatewayService.delete(id);
  }
}
