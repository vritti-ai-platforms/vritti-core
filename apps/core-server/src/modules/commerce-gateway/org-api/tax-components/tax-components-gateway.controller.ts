import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_TAX_COMPONENTS } from '@vritti/commerce-permissions/tax-components';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { CreateTaxComponentDto } from './dto/request/create-tax-component.dto';
import { UpdateTaxComponentDto } from './dto/request/update-tax-component.dto';
import type { TaxComponentResponseDto } from './dto/response/tax-component-response.dto';
import type { TaxComponentTableResponseDto } from './dto/response/tax-component-table-response.dto';
import { TaxComponentsGatewayService } from './services/tax-components-gateway.service';

@ApiTags('Commerce - Tax Components')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_TAX_COMPONENTS.featureCode)
@Controller('tax-components')
export class TaxComponentsGatewayController {
  private readonly logger = new Logger(TaxComponentsGatewayController.name);

  constructor(private readonly service: TaxComponentsGatewayService) {}

  // Returns paginated tax components for the data table
  @Get('table')
  @RequirePermission(ORG_TAX_COMPONENTS.view)
  getTable(@UserId() userId: string): Promise<TaxComponentTableResponseDto> {
    this.logger.log('GET /commerce-api/tax-components/table');
    return this.service.findForTable(userId);
  }

  // Creates a new tax component
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaxComponentDto): Promise<CreateResponseDto<TaxComponentResponseDto>> {
    this.logger.log('POST /commerce-api/tax-components');
    return this.service.create(dto);
  }

  // Returns a tax component by ID
  @Get(':id')
  @RequirePermission(ORG_TAX_COMPONENTS.view)
  findById(@Param('id') id: string): Promise<TaxComponentResponseDto> {
    this.logger.log(`GET /commerce-api/tax-components/${id}`);
    return this.service.findById(id);
  }

  // Updates a tax component by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaxComponentDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-components/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a tax component by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-components/${id}`);
    return this.service.delete(id);
  }
}
