import { CreateTaxRegistrationDto } from '@commerce/tax-registrations/dto/request/create-tax-registration.dto';
import { UpdateTaxRegistrationDto } from '@commerce/tax-registrations/dto/request/update-tax-registration.dto';
import type { TaxRegistrationResponseDto } from '@commerce/tax-registrations/dto/response/tax-registration-response.dto';
import type { TaxRegistrationTableResponseDto } from '@commerce/tax-registrations/dto/response/tax-registration-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { LE_TAX_REGISTRATIONS } from '@vritti/commerce-permissions/tax-registrations';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId } from '@/security/decorators';
import {
  ApiCreateTaxRegistration,
  ApiDeleteTaxRegistration,
  ApiFindForTableTaxRegistrations,
  ApiGetTaxRegistration,
  ApiListTaxRegistrations,
  ApiUpdateTaxRegistration,
} from './docs/tax-registrations-gateway.docs';
import { TaxRegistrationsGatewayService } from './services/tax-registrations-gateway.service';

@ApiTags('Commerce - Tax Registrations')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_TAX_REGISTRATIONS.featureCode)
@Controller('tax-registrations')
export class TaxRegistrationsGatewayController {
  constructor(private readonly service: TaxRegistrationsGatewayService) {}

  @Get('table')
  @RequirePermission(LE_TAX_REGISTRATIONS.view)
  @ApiFindForTableTaxRegistrations()
  findForTable(@UserId() userId: string): Promise<TaxRegistrationTableResponseDto> {
    return this.service.findForTable(userId);
  }

  @Get()
  @RequirePermission(LE_TAX_REGISTRATIONS.view)
  @ApiListTaxRegistrations()
  list(@LegalEntityId() legalEntityId: string | undefined): Promise<TaxRegistrationResponseDto[]> {
    return this.service.listByLegalEntity(legalEntityId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_TAX_REGISTRATIONS.add)
  @ApiCreateTaxRegistration()
  create(@Body() dto: CreateTaxRegistrationDto): Promise<CreateResponseDto<TaxRegistrationResponseDto>> {
    return this.service.create(dto);
  }

  @Get(':id')
  @RequirePermission(LE_TAX_REGISTRATIONS.view)
  @ApiGetTaxRegistration()
  findById(@Param('id') id: string): Promise<TaxRegistrationResponseDto> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @RequirePermission(LE_TAX_REGISTRATIONS.edit)
  @ApiUpdateTaxRegistration()
  update(@Param('id') id: string, @Body() dto: UpdateTaxRegistrationDto): Promise<SuccessResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(LE_TAX_REGISTRATIONS.delete)
  @ApiDeleteTaxRegistration()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.service.delete(id);
  }
}
