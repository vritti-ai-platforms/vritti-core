import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateUomDto } from './dto/request/create-uom.dto';
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

  // Returns paginated UOMs for the data table with server-stored state
  @Get('table')
  getUomTable(@UserId() userId: string): Promise<UomTableResponseDto> {
    return this.uomGatewayService.findForTable(userId);
  }

  // Returns paginated UOM options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.uomGatewayService.select(query);
  }

  // Creates a new UOM
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUomDto): Promise<UomResponseDto> {
    return this.uomGatewayService.create(dto);
  }

  // Returns a single UOM by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<UomResponseDto> {
    return this.uomGatewayService.findById(id);
  }

  // Updates a UOM by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUomDto): Promise<UomResponseDto> {
    return this.uomGatewayService.update(id, dto);
  }

  // Deletes a UOM by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.uomGatewayService.delete(id);
  }
}
