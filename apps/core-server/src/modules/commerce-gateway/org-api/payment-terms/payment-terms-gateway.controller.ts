import { ChangePaymentTermBaselineDto } from '@commerce/payment-terms/dto/request/change-payment-term-baseline.dto';
import { CreatePaymentTermDto } from '@commerce/payment-terms/dto/request/create-payment-term.dto';
import { PaymentScheduleQueryDto } from '@commerce/payment-terms/dto/request/payment-schedule-query.dto';
import { PaymentTermRuleDto } from '@commerce/payment-terms/dto/request/payment-term-rule.dto';
import { UpdatePaymentTermDto } from '@commerce/payment-terms/dto/request/update-payment-term.dto';
import type { PaymentScheduleResponseDto } from '@commerce/payment-terms/dto/response/payment-schedule-response.dto';
import type {
  PaymentTermDetailResponseDto,
  PaymentTermResponseDto,
  PaymentTermRulesResponseDto,
} from '@commerce/payment-terms/dto/response/payment-term-response.dto';
import type { PaymentTermTableResponseDto } from '@commerce/payment-terms/dto/response/payment-term-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
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
@Controller('org/payment-terms')
export class PaymentTermsGatewayController {
  private readonly logger = new Logger(PaymentTermsGatewayController.name);

  constructor(private readonly service: PaymentTermsGatewayService) {}

  // Returns paginated payment terms for the data table
  @Get('table')
  @RequirePermission(ORG_PAYMENT_TERMS.view)
  getTable(@UserId() userId: string): Promise<PaymentTermTableResponseDto> {
    this.logger.log('GET /commerce-api/org/payment-terms/table');
    return this.service.findForTable(userId);
  }

  // Creates a draft payment term
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PAYMENT_TERMS.add)
  create(@Body() dto: CreatePaymentTermDto): Promise<CreateResponseDto<PaymentTermResponseDto>> {
    this.logger.log('POST /commerce-api/org/payment-terms');
    return this.service.create(dto);
  }

  // Returns a payment term with its rule count
  @Get(':id')
  @RequirePermission(ORG_PAYMENT_TERMS.view)
  findById(@Param('id') id: string): Promise<PaymentTermDetailResponseDto> {
    this.logger.log(`GET /commerce-api/org/payment-terms/${id}`);
    return this.service.findById(id);
  }

  // Updates a draft payment term
  @Patch(':id')
  @RequirePermission(ORG_PAYMENT_TERMS.edit)
  update(@Param('id') id: string, @Body() dto: UpdatePaymentTermDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/payment-terms/${id}`);
    return this.service.update(id, dto);
  }

  // Moves when a draft's due days start counting
  @Patch(':id/baseline')
  @RequirePermission(ORG_PAYMENT_TERMS.baseline.edit)
  changeBaseline(@Param('id') id: string, @Body() dto: ChangePaymentTermBaselineDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/payment-terms/${id}/baseline`);
    return this.service.changeBaseline(id, dto);
  }

  // Publishes a draft whose rules total 100%, making it selectable
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_PAYMENT_TERMS.publish)
  publish(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/org/payment-terms/${id}/publish`);
    return this.service.publish(id);
  }

  // Returns a published term no supplier uses to draft so it can be edited
  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_PAYMENT_TERMS.publish)
  unpublish(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/org/payment-terms/${id}/unpublish`);
    return this.service.unpublish(id);
  }

  // Returns a payment term's rules in due order with their total
  @Get(':id/rules')
  @RequirePermission(ORG_PAYMENT_TERMS.rules.view)
  findRules(@Param('id') id: string): Promise<PaymentTermRulesResponseDto> {
    this.logger.log(`GET /commerce-api/org/payment-terms/${id}/rules`);
    return this.service.findRules(id);
  }

  // Applies the term to a sample invoice and returns each instalment's amount, due date and discount
  @Get(':id/schedule')
  @RequirePermission(ORG_PAYMENT_TERMS.rules.view)
  previewSchedule(
    @Param('id') id: string,
    @Query() query: PaymentScheduleQueryDto,
  ): Promise<PaymentScheduleResponseDto> {
    this.logger.log(`GET /commerce-api/org/payment-terms/${id}/schedule`);
    return this.service.previewSchedule(id, query);
  }

  // Adds a rule to a draft payment term
  @Post(':id/rules')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PAYMENT_TERMS.rules.add)
  addRule(@Param('id') id: string, @Body() dto: PaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/org/payment-terms/${id}/rules`);
    return this.service.addRule(id, dto);
  }

  // Updates a rule of a draft payment term
  @Patch(':id/rules/:ruleId')
  @RequirePermission(ORG_PAYMENT_TERMS.rules.edit)
  updateRule(
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: PaymentTermRuleDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/payment-terms/${id}/rules/${ruleId}`);
    return this.service.updateRule(id, ruleId, dto);
  }

  // Deletes a rule of a draft payment term
  @Delete(':id/rules/:ruleId')
  @RequirePermission(ORG_PAYMENT_TERMS.rules.delete)
  deleteRule(@Param('id') id: string, @Param('ruleId') ruleId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/payment-terms/${id}/rules/${ruleId}`);
    return this.service.deleteRule(id, ruleId);
  }

  // Deletes a payment term no supplier uses
  @Delete(':id')
  @RequirePermission(ORG_PAYMENT_TERMS.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/payment-terms/${id}`);
    return this.service.delete(id);
  }
}
