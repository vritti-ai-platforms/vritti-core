import type { BankAccountDto } from '@domain/bank-account/dto/entity/bank-account.dto';
import { CreateBankAccountDto } from '@domain/bank-account/dto/request/create-bank-account.dto';
import { UpdateBankAccountDto } from '@domain/bank-account/dto/request/update-bank-account.dto';
import type { BankAccountsPageResponseDto } from '@domain/bank-account/dto/response/bank-accounts-page-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OrgId } from '@/security/decorators';
import {
  ApiCreateBankAccountInternal,
  ApiDeleteBankAccountInternal,
  ApiFindForTableBankAccountsInternal,
  ApiGetBankAccountInternal,
  ApiListBankAccountsInternal,
  ApiUpdateBankAccountInternal,
} from './docs/bank-account-internal.docs';
import { GetBankAccountsInternalDto } from './dto/request/get-bank-accounts-internal.dto';
import { BankAccountService } from './services/bank-account-api.service';

// The cloud-facing surface. Signed cloud auth rather than a session, because cloud-server calls this
// on behalf of an operator setting up a legal entity — there is no RBAC context to gate on.
@ApiTags('Structure - Bank Accounts (internal)')
@Require(AuthType.Cloud)
@Controller('bank-accounts/internal')
export class BankAccountInternalController {
  private readonly logger = new Logger(BankAccountInternalController.name);

  constructor(private readonly bankAccountService: BankAccountService) {}

  // Resolves one table page from the view state cloud holds and sends serialized
  @Get('table')
  @ApiFindForTableBankAccountsInternal()
  findForTable(
    @OrgId() orgId: string,
    @Query() query: GetBankAccountsInternalDto,
  ): Promise<BankAccountsPageResponseDto> {
    this.logger.log(`GET /bank-accounts/internal/table — org ${orgId}`);
    return this.bankAccountService.findForTableWithQuery(orgId, query);
  }

  // Lists a legal entity's bank accounts
  @Get('legal-entity/:legalEntityId')
  @ApiListBankAccountsInternal()
  list(@OrgId() orgId: string, @Param('legalEntityId') legalEntityId: string): Promise<BankAccountDto[]> {
    this.logger.log(`GET /bank-accounts/internal/legal-entity/${legalEntityId} — org ${orgId}`);
    return this.bankAccountService.listByLegalEntity(orgId, legalEntityId);
  }

  // Creates a bank account for a legal entity of the organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateBankAccountInternal()
  create(@OrgId() orgId: string, @Body() dto: CreateBankAccountDto): Promise<CreateResponseDto<BankAccountDto>> {
    this.logger.log(`POST /bank-accounts/internal — legal entity ${dto.legalEntityId} for org ${orgId}`);
    return this.bankAccountService.create(orgId, dto);
  }

  // Returns a single bank account
  @Get(':id')
  @ApiGetBankAccountInternal()
  findById(@OrgId() orgId: string, @Param('id') id: string): Promise<BankAccountDto> {
    this.logger.log(`GET /bank-accounts/internal/${id}`);
    return this.bankAccountService.findById(orgId, id);
  }

  // Updates a bank account
  @Patch(':id')
  @ApiUpdateBankAccountInternal()
  update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /bank-accounts/internal/${id}`);
    return this.bankAccountService.update(orgId, id, dto);
  }

  // Deletes a bank account
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteBankAccountInternal()
  delete(@OrgId() orgId: string, @Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /bank-accounts/internal/${id}`);
    return this.bankAccountService.delete(orgId, id);
  }
}
