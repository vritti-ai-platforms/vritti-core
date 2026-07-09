import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { UOM } from '@vritti/commerce-permissions/uom';
import { SessionTypeValues } from '@/db/schema';
import { RequirePermission } from '@/rbac/decorators';
import { CreateUomDto } from './dto/request/create-uom.dto';
import { UpdateUomDto } from './dto/request/update-uom.dto';
import type { UomResponseDto } from './dto/response/uom-response.dto';
import type { UomTableResponseDto } from './dto/response/uom-table-response.dto';
import { UomGatewayService } from './services/uom-gateway.service';

@ApiTags('Commerce - Units of Measure')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('uom')
export class UomGatewayController {
  private readonly logger = new Logger(UomGatewayController.name);

  constructor(private readonly uomGatewayService: UomGatewayService) {}

  // Returns paginated UOMs for the data table, scoped to a dimension
  @Get('dimension/:dimensionId/table')
  @RequirePermission(UOM.view)
  findForTable(@Param('dimensionId') dimensionId: string, @UserId() userId: string): Promise<UomTableResponseDto> {
    this.logger.log(`GET /commerce-api/uom/dimension/${dimensionId}/table`);
    return this.uomGatewayService.findForTable(userId, dimensionId);
  }

  // Creates a new UOM
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(UOM.add)
  async create(@Body() dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
    this.logger.log('POST /commerce-api/uom');
    return this.uomGatewayService.create(dto);
  }

  // Updates a UOM by ID
  @Patch(':id')
  @RequirePermission(UOM.edit)
  update(@Param('id') id: string, @Body() dto: UpdateUomDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/uom/${id}`);
    return this.uomGatewayService.update(id, dto);
  }

  // Deletes a UOM by ID
  @Delete(':id')
  @RequirePermission(UOM.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/uom/${id}`);
    return this.uomGatewayService.delete(id);
  }
}
