import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateUomDimensionDto } from './dto/request/create-uom-dimension.dto';
import { UomDimensionsQueryDto } from './dto/request/uom-dimensions-query.dto';
import { UpdateUomDimensionDto } from './dto/request/update-uom-dimension.dto';
import type { UomDimensionResponseDto } from './dto/response/uom-dimension-response.dto';
import { UomDimensionsGatewayService } from './services/uom-dimensions-gateway.service';

@ApiTags('Commerce › UOM Dimensions')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('uom-dimensions')
export class UomDimensionsGatewayController {
  private readonly logger = new Logger(UomDimensionsGatewayController.name);

  constructor(private readonly service: UomDimensionsGatewayService) {}

  // Returns dimensions, optionally filtered by search
  @Get()
  list(@Query() query: UomDimensionsQueryDto): Promise<UomDimensionResponseDto[]> {
    this.logger.log('GET /commerce-api/uom-dimensions');
    return this.service.list(query.search);
  }

  // Returns paginated dimension options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/uom-dimensions/select');
    return this.service.findForSelect(query);
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
  create(@Body() dto: CreateUomDimensionDto): Promise<CreateResponseDto<UomDimensionResponseDto>> {
    this.logger.log('POST /commerce-api/uom-dimensions');
    return this.service.create(dto);
  }

  // Updates a dimension by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUomDimensionDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/uom-dimensions/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a dimension by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/uom-dimensions/${id}`);
    return this.service.delete(id);
  }
}
