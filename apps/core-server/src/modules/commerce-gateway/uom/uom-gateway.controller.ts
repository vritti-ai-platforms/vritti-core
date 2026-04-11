import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type CreateResponseDto, RequireSession, SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateUomDto } from './dto/request/create-uom.dto';
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
  findBaseUnits(@Query('search') search?: string): Promise<UomResponseDto[]> {
    return this.uomGatewayService.findBaseUnits(search);
  }

  // Returns derived units for a given base unit
  @Get(':id/derived')
  findDerivedUnits(@Param('id') id: string): Promise<UomResponseDto[]> {
    return this.uomGatewayService.findDerivedUnits(id);
  }

  // Returns paginated UOM options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.uomGatewayService.select(query);
  }

  // Creates a new UOM
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
    return this.uomGatewayService.create(dto);
  }

  // Updates a UOM by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUomDto): Promise<SuccessResponseDto> {
    return this.uomGatewayService.update(id, dto);
  }

  // Deletes a UOM by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.uomGatewayService.delete(id);
  }
}
