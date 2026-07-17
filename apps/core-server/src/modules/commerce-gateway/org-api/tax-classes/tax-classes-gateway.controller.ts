import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { CreateTaxClassDto } from './dto/request/create-tax-class.dto';
import { UpdateTaxClassDto } from './dto/request/update-tax-class.dto';
import type { TaxClassResponseDto } from './dto/response/tax-class-response.dto';
import type { TaxClassTableResponseDto } from './dto/response/tax-class-table-response.dto';
import { TaxClassesGatewayService } from './services/tax-classes-gateway.service';

@ApiTags('Commerce - Tax Classes')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_TAX_CLASSES.featureCode)
@Controller('tax-classes')
export class TaxClassesGatewayController {
  private readonly logger = new Logger(TaxClassesGatewayController.name);

  constructor(private readonly service: TaxClassesGatewayService) {}

  // Returns paginated tax classes for the data table
  @Get('table')
  @RequirePermission(ORG_TAX_CLASSES.view)
  getTable(@UserId() userId: string): Promise<TaxClassTableResponseDto> {
    this.logger.log('GET /commerce-api/tax-classes/table');
    return this.service.findForTable(userId);
  }

  // Creates a new tax class
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaxClassDto): Promise<CreateResponseDto<TaxClassResponseDto>> {
    this.logger.log('POST /commerce-api/tax-classes');
    return this.service.create(dto);
  }

  // Returns a tax class by ID
  @Get(':id')
  @RequirePermission(ORG_TAX_CLASSES.view)
  findById(@Param('id') id: string): Promise<TaxClassResponseDto> {
    this.logger.log(`GET /commerce-api/tax-classes/${id}`);
    return this.service.findById(id);
  }

  // Updates a tax class by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-classes/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a tax class by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-classes/${id}`);
    return this.service.delete(id);
  }
}
