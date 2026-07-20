import type { PartyBankAccountDto } from '@domain/party-bank-accounts/dto/entity/party-bank-account.dto';
import { CreatePersonBankAccountDto } from '@domain/party-bank-accounts/dto/request/create-person-bank-account.dto';
import { UpdateCompanyBankAccountDto } from '@domain/party-bank-accounts/dto/request/update-company-bank-account.dto';
import { PartyBankAccountsDomainService } from '@domain/party-bank-accounts/services/party-bank-accounts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleBankAccountsController {
  private readonly logger = new Logger(PeopleBankAccountsController.name);

  constructor(private readonly service: PartyBankAccountsDomainService) {}

  // Returns the paginated bank accounts of a person
  @MessagePattern({ cmd: 'org.people.bankAccounts.table' })
  table(
    @Payload() data: { personId: string } & TableViewState,
  ): Promise<{ result: PartyBankAccountDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.bankAccounts.table — personId: ${personId}`);
    return this.service.findForTable(personId, state);
  }

  // Creates a bank account for a person
  @MessagePattern({ cmd: 'org.people.bankAccounts.create' })
  create(@Payload() dto: CreatePersonBankAccountDto): Promise<CreateResponseDto<PartyBankAccountDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.bankAccounts.create — personId: ${personId}`);
    return this.service.create(personId, payload);
  }

  // Updates a bank account by ID
  @MessagePattern({ cmd: 'org.people.bankAccounts.update' })
  update(@Payload() dto: UpdateCompanyBankAccountDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`people.bankAccounts.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a bank account by ID
  @MessagePattern({ cmd: 'org.people.bankAccounts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.bankAccounts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
