import type { PayoutAccountDto } from '@domain/payout-account/dto/entity/payout-account.dto';
import { CreatePayoutAccountDto } from '@domain/payout-account/dto/request/create-payout-account.dto';
import { UpdatePayoutAccountDto } from '@domain/payout-account/dto/request/update-payout-account.dto';
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
import { OrgId } from '@/security/decorators';
import {
  ApiCreatePayoutAccountInternal,
  ApiDeletePayoutAccountInternal,
  ApiListPayoutAccountsInternal,
  ApiUpdatePayoutAccountInternal,
} from './docs/payout-account-internal.docs';
import { ListPayoutAccountsInternalQueryDto } from './dto/request/list-payout-accounts-internal-query.dto';
import { PayoutAccountService } from './services/payout-account-api.service';

// The cloud-facing surface for payout accounts
@ApiTags('Structure - Payout Accounts (internal)')
@Require(AuthType.Cloud)
@Controller('payout-accounts/internal')
export class PayoutAccountInternalController {
  private readonly logger = new Logger(PayoutAccountInternalController.name);

  constructor(private readonly payoutAccountService: PayoutAccountService) {}

  @Get()
  @ApiListPayoutAccountsInternal()
  list(@OrgId() orgId: string, @Query() query: ListPayoutAccountsInternalQueryDto): Promise<PayoutAccountDto[]> {
    this.logger.log(
      `GET /payout-accounts/internal — bank account ${query.bankAccountId ?? '-'} legal entity ${query.legalEntityId ?? '-'}`,
    );
    return this.payoutAccountService.list(orgId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePayoutAccountInternal()
  create(@OrgId() orgId: string, @Body() dto: CreatePayoutAccountDto): Promise<CreateResponseDto<PayoutAccountDto>> {
    this.logger.log(`POST /payout-accounts/internal — bank account ${dto.bankAccountId}`);
    return this.payoutAccountService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiUpdatePayoutAccountInternal()
  update(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayoutAccountDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payout-accounts/internal/${id}`);
    return this.payoutAccountService.update(orgId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePayoutAccountInternal()
  delete(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payout-accounts/internal/${id}`);
    return this.payoutAccountService.delete(orgId, id);
  }
}
