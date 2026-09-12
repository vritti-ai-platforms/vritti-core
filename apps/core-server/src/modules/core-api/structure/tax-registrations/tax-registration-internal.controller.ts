import { CreateTaxRegistrationDto } from '@commerce/tax-registrations/dto/request/create-tax-registration.dto';
import { UpdateTaxRegistrationDto } from '@commerce/tax-registrations/dto/request/update-tax-registration.dto';
import type { TaxRegistrationResponseDto } from '@commerce/tax-registrations/dto/response/tax-registration-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { GetTaxRegistrationsInternalDto } from './dto/get-tax-registrations-internal.dto';
import { TaxRegistrationsGatewayService } from '@/modules/commerce-gateway/le-api/tax-registrations/services/tax-registrations-gateway.service';

// The cloud-facing surface. Signed cloud auth rather than a session, because cloud-server calls this
// on behalf of an operator setting up a legal entity — there is no RBAC context to gate on.
@ApiTags('Internal - Tax Registrations')
@Require(AuthType.Cloud)
@Controller('tax-registrations/internal')
export class TaxRegistrationInternalController {
  private readonly logger = new Logger(TaxRegistrationInternalController.name);

  constructor(private readonly service: TaxRegistrationsGatewayService) {}

  // Cloud's data table: it holds the view state and sends it serialized, core resolves the page
  @Get('table')
  table(
    @Query() query: GetTaxRegistrationsInternalDto,
  ): Promise<{ result: TaxRegistrationResponseDto[]; count: number }> {
    this.logger.log('GET /tax-registrations/internal/table');
    return this.service.findForTableWithState({
      filters: query.filters ? JSON.parse(query.filters) : [],
      search: query.search ? JSON.parse(query.search) : null,
      sort: query.sort ? JSON.parse(query.sort) : [],
      pagination: { limit: query.limit ?? 20, offset: query.offset ?? 0 },
    } as TableViewState);
  }

  @Get('legal-entity/:legalEntityId')
  list(@Param('legalEntityId') legalEntityId: string): Promise<TaxRegistrationResponseDto[]> {
    this.logger.log(`GET /tax-registrations/internal/legal-entity/${legalEntityId}`);
    return this.service.listByLegalEntity(legalEntityId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaxRegistrationDto): Promise<CreateResponseDto<TaxRegistrationResponseDto>> {
    this.logger.log(`POST /tax-registrations/internal — ${dto.registrationNumber}`);
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaxRegistrationDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /tax-registrations/internal/${id}`);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /tax-registrations/internal/${id}`);
    return this.service.delete(id);
  }
}
