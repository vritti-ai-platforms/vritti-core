import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateBomDto } from './dto/request/create-bom.dto';
import { UpdateBomDto } from './dto/request/update-bom.dto';
import type { BomDetailResponseDto } from './dto/response/bom-response.dto';
import type { BomTableResponseDto } from './dto/response/bom-table-response.dto';
import { BomGatewayService } from './services/bom-gateway.service';

@ApiTags('Commerce - Bill of Materials')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('bom')
export class BomGatewayController {

  constructor(private readonly service: BomGatewayService) {}

  // Returns paginated BOMs for the data table
  @Get('table')
  getTable(@UserId() userId: string): Promise<BomTableResponseDto> {
    return this.service.findForTable(userId);
  }

  // Returns paginated BOM options for select dropdowns
  @Get('select')
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.service.select(query);
  }

  // Creates a new BOM with lines
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBomDto): Promise<BomDetailResponseDto> {
    return this.service.create(dto);
  }

  // Returns BOM detail with lines
  @Get(':id')
  findById(@Param('id') id: string): Promise<BomDetailResponseDto> {
    return this.service.findById(id);
  }

  // Updates a BOM and replaces lines if provided
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBomDto): Promise<BomDetailResponseDto> {
    return this.service.update(id, dto);
  }

  // Deletes a BOM (cascades to lines)
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.service.delete(id);
  }
}
