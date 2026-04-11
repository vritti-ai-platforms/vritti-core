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
import { CreateUomDto } from './dto/request/create-uom.dto';
import { UomBaseQueryDto } from './dto/request/uom-base-query.dto';
import { UpdateUomDto } from './dto/request/update-uom.dto';
import type { UomResponseDto } from './dto/response/uom-response.dto';
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

  // Returns paginated UOM options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/uom/select');
    return this.uomGatewayService.select(query);
  }

  // Creates a new UOM
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
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
