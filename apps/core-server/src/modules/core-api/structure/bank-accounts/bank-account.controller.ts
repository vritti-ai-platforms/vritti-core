import type { BankAccountDto } from '@domain/bank-account/dto/entity/bank-account.dto';
import { UpdateBankAccountDto } from '@domain/bank-account/dto/request/update-bank-account.dto';
import type { BankAccountsTableResponseDto } from '@domain/bank-account/dto/response/bank-accounts-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_BANK_ACCOUNTS } from '@vritti/commerce-permissions/bank-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId, OrgId } from '@/security/decorators';
import {
  ApiCreateBankAccount,
  ApiDeleteBankAccount,
  ApiFindForTableBankAccounts,
  ApiGetBankAccount,
  ApiListBankAccounts,
  ApiUpdateBankAccount,
} from './docs/bank-account.docs';
import { CreateLeBankAccountDto } from './dto/request/create-le-bank-account.dto';
import { BankAccountService } from './services/bank-account-api.service';

@ApiTags('Structure - Bank Accounts')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_BANK_ACCOUNTS.featureCode)
@Controller('bank-accounts')
export class BankAccountController {
  private readonly logger = new Logger(BankAccountController.name);

  constructor(private readonly bankAccountService: BankAccountService) {}

  // Returns the user's saved table view, scoped to the legal entity in context
  @Get('table')
  @RequirePermission(LE_BANK_ACCOUNTS.view)
  @ApiFindForTableBankAccounts()
  findForTable(
    @UserId() userId: string,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<BankAccountsTableResponseDto> {
    this.logger.log('GET /bank-accounts/table');
    return this.bankAccountService.findForTable(userId, orgId, legalEntityId);
  }

  // Lists the bank accounts of the legal entity in context
  @Get()
  @RequirePermission(LE_BANK_ACCOUNTS.view)
  @ApiListBankAccounts()
  list(@OrgId() orgId: string, @LegalEntityId() legalEntityId: string | undefined): Promise<BankAccountDto[]> {
    this.logger.log('GET /bank-accounts');
    return this.bankAccountService.listByLegalEntity(orgId, legalEntityId);
  }

  // Adds a bank account to the legal entity in context
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_BANK_ACCOUNTS.add)
  @ApiCreateBankAccount()
  create(
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
    @Body() dto: CreateLeBankAccountDto,
  ): Promise<CreateResponseDto<BankAccountDto>> {
    this.logger.log('POST /bank-accounts');
    return this.bankAccountService.createForContext(orgId, legalEntityId, dto);
  }

  // Returns a single bank account
  @Get(':id')
  @RequirePermission(LE_BANK_ACCOUNTS.view)
  @ApiGetBankAccount()
  findById(@OrgId() orgId: string, @Param('id') id: string): Promise<BankAccountDto> {
    this.logger.log(`GET /bank-accounts/${id}`);
    return this.bankAccountService.findById(orgId, id);
  }

  // Updates a bank account
  @Patch(':id')
  @RequirePermission(LE_BANK_ACCOUNTS.edit)
  @ApiUpdateBankAccount()
  update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /bank-accounts/${id}`);
    return this.bankAccountService.update(orgId, id, dto);
  }

  // Deletes a bank account
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(LE_BANK_ACCOUNTS.delete)
  @ApiDeleteBankAccount()
  delete(@OrgId() orgId: string, @Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /bank-accounts/${id}`);
    return this.bankAccountService.delete(orgId, id);
  }
}
