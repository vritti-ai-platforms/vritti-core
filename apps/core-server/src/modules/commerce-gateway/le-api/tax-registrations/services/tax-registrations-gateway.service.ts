import type { CreateTaxRegistrationDto } from '@commerce/tax-registrations/dto/request/create-tax-registration.dto';
import type { UpdateTaxRegistrationDto } from '@commerce/tax-registrations/dto/request/update-tax-registration.dto';
import type { TaxRegistrationResponseDto } from '@commerce/tax-registrations/dto/response/tax-registration-response.dto';
import type { TaxRegistrationTableResponseDto } from '@commerce/tax-registrations/dto/response/tax-registration-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { SiteDomainRepository } from '@/modules/domain/site/repositories/site.repository';

@Injectable()
export class TaxRegistrationsGatewayService {
  private readonly logger = new Logger(TaxRegistrationsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

  async findForTable(userId: string): Promise<TaxRegistrationTableResponseDto> {
    this.logger.log('le.taxRegistrations.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-le-tax-registrations',
    );
    const { result, count } = await this.nats.send<{ result: TaxRegistrationResponseDto[]; count: number }>(
      'commerce',
      'le.taxRegistrations.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  // The workspace's own entity on the VAP path; cloud names one explicitly on the internal path
  async listByLegalEntity(legalEntityId?: string): Promise<TaxRegistrationResponseDto[]> {
    this.logger.log(`le.taxRegistrations.list — legalEntityId: ${legalEntityId ?? 'workspace'}`);
    return this.nats.send('commerce', 'le.taxRegistrations.list', { legalEntityId });
  }

  // Cloud owns its own view state, so it passes one in rather than this reading Redis for a user
  async findForTableWithState(state: TableViewState): Promise<{ result: TaxRegistrationResponseDto[]; count: number }> {
    this.logger.log('le.taxRegistrations.table — cloud state');
    return this.nats.send('commerce', 'le.taxRegistrations.table', state);
  }

  // The whole organization's registrations, for the cloud structure aggregate
  async listAll(): Promise<TaxRegistrationResponseDto[]> {
    this.logger.log('le.taxRegistrations.listAll');
    return this.nats.send('commerce', 'le.taxRegistrations.listAll', {});
  }

  async findById(id: string): Promise<TaxRegistrationResponseDto> {
    this.logger.log(`le.taxRegistrations.get — id: ${id}`);
    return this.nats.send('commerce', 'le.taxRegistrations.findById', { id });
  }

  async create(dto: CreateTaxRegistrationDto): Promise<CreateResponseDto<TaxRegistrationResponseDto>> {
    this.logger.log(`le.taxRegistrations.create — number: ${dto.registrationNumber}`);
    return this.nats.send('commerce', 'le.taxRegistrations.create', dto);
  }

  async update(id: string, dto: UpdateTaxRegistrationDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.taxRegistrations.update — id: ${id}`);
    return this.nats.send('commerce', 'le.taxRegistrations.update', { id, ...dto });
  }

  // Sites hold a loose reference to the registration they trade under, so the check that the dropped
  // foreign key used to make lives here — core owns sites, commerce cannot see them
  async delete(id: string): Promise<SuccessResponseDto> {
    const siteCount = await this.siteRepository.countByRegistration(id);
    if (siteCount > 0) {
      throw new ConflictException({
        label: 'Registration In Use',
        detail: `${pluralize('site', siteCount, true)} trade under this registration. Reassign them before removing it.`,
      });
    }

    this.logger.log(`le.taxRegistrations.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.taxRegistrations.delete', { id });
  }
}
