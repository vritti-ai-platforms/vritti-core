import type { PartyBankAccountDto } from '@domain/party-bank-accounts/dto/entity/party-bank-account.dto';
import { CreateCompanyBankAccountDto } from '@domain/party-bank-accounts/dto/request/create-company-bank-account.dto';
import { UpdateCompanyBankAccountDto } from '@domain/party-bank-accounts/dto/request/update-company-bank-account.dto';
import { PartyBankAccountsDomainService } from '@domain/party-bank-accounts/services/party-bank-accounts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class CompanyBankAccountsController {
  private readonly logger = new Logger(CompanyBankAccountsController.name);

  constructor(private readonly service: PartyBankAccountsDomainService) {}

  // Returns the paginated bank accounts of a company
  @MessagePattern({ cmd: 'org.companies.bankAccounts.table' })
  table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyBankAccountDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.bankAccounts.table — companyId: ${companyId}`);
    return this.service.findForTable(companyId, state);
  }

  // Creates a bank account for a company
  @MessagePattern({ cmd: 'org.companies.bankAccounts.create' })
  create(@Payload() dto: CreateCompanyBankAccountDto): Promise<CreateResponseDto<PartyBankAccountDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.bankAccounts.create — companyId: ${companyId}`);
    return this.service.create(companyId, payload);
  }

  // Updates a bank account by ID
  @MessagePattern({ cmd: 'org.companies.bankAccounts.update' })
  update(@Payload() dto: UpdateCompanyBankAccountDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`companies.bankAccounts.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a bank account by ID
  @MessagePattern({ cmd: 'org.companies.bankAccounts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.bankAccounts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
