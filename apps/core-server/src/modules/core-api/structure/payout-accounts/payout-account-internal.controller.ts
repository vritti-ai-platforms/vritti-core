import type { PayoutAccountDto } from '@domain/payout-account/dto/entity/payout-account.dto';
import { CreatePayoutAccountDto } from '@domain/payout-account/dto/request/create-payout-account.dto';
import { UpdatePayoutAccountDto } from '@domain/payout-account/dto/request/update-payout-account.dto';
import type { PayoutAccountsPageResponseDto } from '@domain/payout-account/dto/response/payout-accounts-page-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InternalTablePageDto } from '@/common/dto/request/internal-table-page.dto';
import { OrgId } from '@/security/decorators';
import {
  ApiCreatePayoutAccountInternal,
  ApiDeletePayoutAccountInternal,
  ApiFindForTablePayoutAccountsInternal,
  ApiListPayoutAccountsInternal,
  ApiUpdatePayoutAccountInternal,
} from './docs/payout-account-internal.docs';
import { ListPayoutAccountsInternalQueryDto } from './dto/request/list-payout-accounts-internal-query.dto';
import { PayoutAccountService } from './services/payout-account-api.service';

@ApiTags('Structure - Payout Accounts (internal)')
@Require(AuthType.Cloud)
@Controller('payout-accounts/internal')
export class PayoutAccountInternalController {
  private readonly logger = new Logger(PayoutAccountInternalController.name);

  constructor(private readonly payoutAccountService: PayoutAccountService) {}

  // Resolves one table page of a bank account's payout accounts from the page request cloud sends
  @Post('bank-account/:bankAccountId/table')
  @HttpCode(HttpStatus.OK)
  @ApiFindForTablePayoutAccountsInternal()
  findForTable(
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
    @Body() page: InternalTablePageDto,
  ): Promise<PayoutAccountsPageResponseDto> {
    this.logger.log(`POST /payout-accounts/internal/bank-account/${bankAccountId}/table`);
    return this.payoutAccountService.findForTablePage(bankAccountId, page);
  }

  // Every payout account of a legal entity, for the payout channel picker
  @Get()
  @ApiListPayoutAccountsInternal()
  list(@Query() query: ListPayoutAccountsInternalQueryDto): Promise<PayoutAccountDto[]> {
    this.logger.log(`GET /payout-accounts/internal — legal entity ${query.legalEntityId}`);
    return this.payoutAccountService.list(query.legalEntityId);
  }

  // Adds a payout account to a bank account
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePayoutAccountInternal()
  create(@OrgId() orgId: string, @Body() dto: CreatePayoutAccountDto): Promise<CreateResponseDto<PayoutAccountDto>> {
    this.logger.log(`POST /payout-accounts/internal — bank account ${dto.bankAccountId}`);
    return this.payoutAccountService.create(orgId, dto);
  }

  // Changes a payout account's gateway account id
  @Patch(':id')
  @ApiUpdatePayoutAccountInternal()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePayoutAccountDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payout-accounts/internal/${id}`);
    return this.payoutAccountService.update(id, dto);
  }

  // Removes a payout account no payout channel uses
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePayoutAccountInternal()
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payout-accounts/internal/${id}`);
    return this.payoutAccountService.delete(id);
  }
}
