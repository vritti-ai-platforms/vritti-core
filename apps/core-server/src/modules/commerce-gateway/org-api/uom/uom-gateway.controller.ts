import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { CreateUomDto } from './dto/request/create-uom.dto';
import { CreateUomDimensionDto } from './dto/request/create-uom-dimension.dto';
import { UomDimensionsQueryDto } from './dto/request/uom-dimensions-query.dto';
import { UpdateUomDto } from './dto/request/update-uom.dto';
import { UpdateUomDimensionDto } from './dto/request/update-uom-dimension.dto';
import type { UomDimensionCountResponseDto } from './dto/response/uom-dimension-count-response.dto';
import type { UomDimensionResponseDto } from './dto/response/uom-dimension-response.dto';
import type { UomResponseDto } from './dto/response/uom-response.dto';
import type { UomTableResponseDto } from './dto/response/uom-table-response.dto';
import { UomGatewayService } from './services/uom-gateway.service';

@ApiTags('Commerce - Units of Measure')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_UOM.featureCode)
@Controller('uom')
export class UomGatewayController {
  private readonly logger = new Logger(UomGatewayController.name);

  constructor(private readonly uomGatewayService: UomGatewayService) {}

  // Returns paginated UOMs for the data table, scoped to a dimension
  @Get('dimension/:dimensionId/table')
  @RequirePermission(ORG_UOM.view)
  findForTable(@Param('dimensionId') dimensionId: string, @UserId() userId: string): Promise<UomTableResponseDto> {
    this.logger.log(`GET /commerce-api/uom/dimension/${dimensionId}/table`);
    return this.uomGatewayService.findForTable(userId, dimensionId);
  }

  // Returns dimensions, optionally filtered by search
  @Get('dimensions')
  @RequirePermission(ORG_UOM.dim.view)
  listDimensions(@Query() query: UomDimensionsQueryDto): Promise<UomDimensionResponseDto[]> {
    this.logger.log('GET /commerce-api/uom/dimensions');
    return this.uomGatewayService.listDimensions(query.search);
  }

  // Returns total UOM dimension count
  @Get('dimensions/count')
  countDimensions(): Promise<UomDimensionCountResponseDto> {
    this.logger.log('GET /commerce-api/uom/dimensions/count');
    return this.uomGatewayService.countDimensions();
  }

  // Returns a dimension by ID
  @Get('dimensions/:id')
  @RequirePermission(ORG_UOM.dim.view)
  findDimensionById(@Param('id') id: string): Promise<UomDimensionResponseDto> {
    this.logger.log(`GET /commerce-api/uom/dimensions/${id}`);
    return this.uomGatewayService.findDimensionById(id);
  }

  // Creates a new dimension
  @Post('dimensions')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_UOM.dim.add)
  createDimension(@Body() dto: CreateUomDimensionDto): Promise<CreateResponseDto<UomDimensionResponseDto>> {
    this.logger.log('POST /commerce-api/uom/dimensions');
    return this.uomGatewayService.createDimension(dto);
  }

  // Updates a dimension by ID
  @Patch('dimensions/:id')
  @RequirePermission(ORG_UOM.dim.edit)
  updateDimension(@Param('id') id: string, @Body() dto: UpdateUomDimensionDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/uom/dimensions/${id}`);
    return this.uomGatewayService.updateDimension(id, dto);
  }

  // Deletes a dimension by ID
  @Delete('dimensions/:id')
  @RequirePermission(ORG_UOM.dim.delete)
  deleteDimension(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/uom/dimensions/${id}`);
    return this.uomGatewayService.deleteDimension(id);
  }

  // Creates a new UOM
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_UOM.add)
  async create(@Body() dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
    this.logger.log('POST /commerce-api/uom');
    return this.uomGatewayService.create(dto);
  }

  // Updates a UOM by ID
  @Patch(':id')
  @RequirePermission(ORG_UOM.edit)
  update(@Param('id') id: string, @Body() dto: UpdateUomDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/uom/${id}`);
    return this.uomGatewayService.update(id, dto);
  }

  // Deletes a UOM by ID
  @Delete(':id')
  @RequirePermission(ORG_UOM.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/uom/${id}`);
    return this.uomGatewayService.delete(id);
  }
}
