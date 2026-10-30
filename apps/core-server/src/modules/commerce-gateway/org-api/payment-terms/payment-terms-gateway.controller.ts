import { CreatePaymentTermDto } from '@commerce/payment-terms/dto/request/create-payment-term.dto';
import { PaymentTermRuleDto } from '@commerce/payment-terms/dto/request/payment-term-rule.dto';
import { UpdatePaymentTermDto } from '@commerce/payment-terms/dto/request/update-payment-term.dto';
import type { PaymentTermResponseDto } from '@commerce/payment-terms/dto/response/payment-term-response.dto';
import type { PaymentTermTableResponseDto } from '@commerce/payment-terms/dto/response/payment-term-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { ORG_PAYMENT_TERMS } from '@vritti/commerce-permissions/payment-terms';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { PaymentTermsGatewayService } from './services/payment-terms-gateway.service';

@ApiTags('Commerce - Payment Terms')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_PAYMENT_TERMS.featureCode)
@Controller('payment-terms')
export class PaymentTermsGatewayController {
  private readonly logger = new Logger(PaymentTermsGatewayController.name);

  constructor(private readonly service: PaymentTermsGatewayService) {}

  // Returns paginated payment terms for the data table
  @Get('table')
  @RequirePermission(ORG_PAYMENT_TERMS.view)
  getTable(@UserId() userId: string): Promise<PaymentTermTableResponseDto> {
    this.logger.log('GET /commerce-api/payment-terms/table');
    return this.service.findForTable(userId);
  }

  // Creates a draft payment term
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PAYMENT_TERMS.add)
  create(@Body() dto: CreatePaymentTermDto): Promise<CreateResponseDto<PaymentTermResponseDto>> {
    this.logger.log('POST /commerce-api/payment-terms');
    return this.service.create(dto);
  }

  // Returns a payment term with its rules
  @Get(':id')
  @RequirePermission(ORG_PAYMENT_TERMS.view)
  findById(@Param('id') id: string): Promise<PaymentTermResponseDto> {
    this.logger.log(`GET /commerce-api/payment-terms/${id}`);
    return this.service.findById(id);
  }

  // Updates a payment term's name, description, and (while a draft) its baseline
  @Patch(':id')
  @RequirePermission(ORG_PAYMENT_TERMS.edit)
  update(@Param('id') id: string, @Body() dto: UpdatePaymentTermDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/payment-terms/${id}`);
    return this.service.update(id, dto);
  }

  // Activates a payment term whose rules total 100%
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_PAYMENT_TERMS.edit)
  activate(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/payment-terms/${id}/activate`);
    return this.service.activate(id);
  }

  // Deactivates an active payment term
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_PAYMENT_TERMS.edit)
  deactivate(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/payment-terms/${id}/deactivate`);
    return this.service.deactivate(id);
  }

  // Adds a rule to a draft payment term
  @Post(':id/rules')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PAYMENT_TERMS.edit)
  addRule(@Param('id') id: string, @Body() dto: PaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/payment-terms/${id}/rules`);
    return this.service.addRule(id, dto);
  }

  // Updates a rule of a draft payment term
  @Patch(':id/rules/:ruleId')
  @RequirePermission(ORG_PAYMENT_TERMS.edit)
  updateRule(
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: PaymentTermRuleDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/payment-terms/${id}/rules/${ruleId}`);
    return this.service.updateRule(id, ruleId, dto);
  }

  // Deletes a rule of a draft payment term
  @Delete(':id/rules/:ruleId')
  @RequirePermission(ORG_PAYMENT_TERMS.edit)
  deleteRule(@Param('id') id: string, @Param('ruleId') ruleId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/payment-terms/${id}/rules/${ruleId}`);
    return this.service.deleteRule(id, ruleId);
  }

  // Deletes a payment term no supplier or enrollment uses
  @Delete(':id')
  @RequirePermission(ORG_PAYMENT_TERMS.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/payment-terms/${id}`);
    return this.service.delete(id);
  }
}
