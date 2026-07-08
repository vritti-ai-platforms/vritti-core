import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type CreateResponseDto, RequireSession, type SuccessResponseDto } from '@vritti/api-sdk';
import { UOM } from '@vritti/commerce-permissions/uom';
import { SessionTypeValues } from '@/db/schema';
import { RequirePermission } from '@/rbac/decorators';
import { CreateUomDimensionDto } from './dto/request/create-uom-dimension.dto';
import { UomDimensionsQueryDto } from './dto/request/uom-dimensions-query.dto';
import { UpdateUomDimensionDto } from './dto/request/update-uom-dimension.dto';
import type { UomDimensionCountResponseDto } from './dto/response/uom-dimension-count-response.dto';
import type { UomDimensionResponseDto } from './dto/response/uom-dimension-response.dto';
import { UomDimensionsGatewayService } from './services/uom-dimensions-gateway.service';

@ApiTags('Commerce › UOM Dimensions')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('uom-dimensions')
export class UomDimensionsGatewayController {
  private readonly logger = new Logger(UomDimensionsGatewayController.name);

  constructor(private readonly service: UomDimensionsGatewayService) {}

  // Returns dimensions, optionally filtered by search
  @Get()
  @RequirePermission(UOM.dim.view)
  list(@Query() query: UomDimensionsQueryDto): Promise<UomDimensionResponseDto[]> {
    this.logger.log('GET /commerce-api/uom-dimensions');
    return this.service.list(query.search);
  }

  // Returns total UOM dimension count
  @Get('count')
  count(): Promise<UomDimensionCountResponseDto> {
    this.logger.log('GET /commerce-api/uom-dimensions/count');
    return this.service.count();
  }

  // Returns a dimension by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<UomDimensionResponseDto> {
    this.logger.log(`GET /commerce-api/uom-dimensions/${id}`);
    return this.service.findById(id);
  }

  // Creates a new dimension
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(UOM.dim.add)
  create(@Body() dto: CreateUomDimensionDto): Promise<CreateResponseDto<UomDimensionResponseDto>> {
    this.logger.log('POST /commerce-api/uom-dimensions');
    return this.service.create(dto);
  }

  // Updates a dimension by ID
  @Patch(':id')
  @RequirePermission(UOM.dim.edit)
  update(@Param('id') id: string, @Body() dto: UpdateUomDimensionDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/uom-dimensions/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a dimension by ID
  @Delete(':id')
  @RequirePermission(UOM.dim.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/uom-dimensions/${id}`);
    return this.service.delete(id);
  }
}
