import { AppDomainRepository } from '@domain/app/repositories/app.repository';
import { BankAccountDomainRepository } from '@domain/bank-account/repositories/bank-account.repository';
import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import type { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import type { UpdatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-payment-gateway-config.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import type { PaymentGatewayConfigsPageResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-configs-page-response.dto';
import type { PaymentGatewayConfigScope } from '@domain/payment-gateway-config/payment-gateway-config-scope';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PaymentGatewayConfigType, PaymentGatewayConfigTypeValues } from '@/db/schema';
import type { PaymentGatewayOptionDto } from '@/modules/payments-gateway/gateways/dto/response/payment-gateway-option.dto';
import { PaymentGatewaysGatewayService } from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';
import { parseTableQueryParam } from '@/utils/parse-table-query';
import type { GetPaymentGatewayConfigsInternalDto } from '../dto/request/get-payment-gateway-configs-internal.dto';

@Injectable()
export class PaymentGatewayConfigService {
  constructor(
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
    private readonly bankAccountRepository: BankAccountDomainRepository,
    private readonly siteRepository: SiteDomainRepository,
    private readonly appRepository: AppDomainRepository,
    private readonly paymentGatewaysGatewayService: PaymentGatewaysGatewayService,
  ) {}

  // The gateways payments-service can charge through, for the UI to intersect with the catalog
  async listGateways(): Promise<PaymentGatewayOptionDto[]> {
    return this.paymentGatewaysGatewayService.listGateways();
  }

  // Cloud's data table: it holds the view state and sends it serialized, core resolves the page
  async findForTableWithQuery(
    orgId: string,
    query: GetPaymentGatewayConfigsInternalDto,
  ): Promise<PaymentGatewayConfigsPageResponseDto> {
    return this.findForTableWithState(orgId, {
      filters: parseTableQueryParam<TableViewState['filters']>(query.filters, 'filters', []),
      search: parseTableQueryParam<TableViewState['search'] | null>(query.search, 'search', null),
      sort: parseTableQueryParam<TableViewState['sort']>(query.sort, 'sort', []),
      pagination: { limit: query.limit ?? 20, offset: query.offset ?? 0 },
    } as TableViewState);
  }

  // Resolves a page for a caller that owns its own view state
  async findForTableWithState(orgId: string, state: TableViewState): Promise<PaymentGatewayConfigsPageResponseDto> {
    return this.gatewayConfigService.findForTable(orgId, state);
  }

  // Lists the configs of one legal entity
  async listByLegalEntity(orgId: string, legalEntityId: string | undefined): Promise<PaymentGatewayConfigDto[]> {
    return this.gatewayConfigService.listByLegalEntity(orgId, this.requireLegalEntity(legalEntityId));
  }

  // Lists the configs that settle into one bank account
  async listByBankAccount(orgId: string, bankAccountId: string): Promise<PaymentGatewayConfigDto[]> {
    return this.gatewayConfigService.listByBankAccount(orgId, bankAccountId);
  }

  // Creates a config for a named legal entity after checking every referenced entity belongs to it
  async create(orgId: string, dto: CreatePaymentGatewayConfigDto): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    await this.assertReferences(orgId, dto.legalEntityId, dto);
    if (dto.splitEnabled) {
      assertSplitAvailable();
      await this.assertSplitSupported(dto.gatewayCode);
    }
    return this.gatewayConfigService.create(orgId, dto);
  }

  // Returns a single config, provided it sits in the caller's scope
  async findById(orgId: string, id: string, scope: PaymentGatewayConfigScope): Promise<PaymentGatewayConfigDto> {
    return this.gatewayConfigService.findById(orgId, id, scope);
  }

  // Updates a config, re-checking a site or app pin against the effective type and legal entity
  async update(
    orgId: string,
    id: string,
    dto: UpdatePaymentGatewayConfigDto,
    scope: PaymentGatewayConfigScope,
  ): Promise<SuccessResponseDto> {
    const existing = await this.gatewayConfigService.findById(orgId, id, scope);
    if (dto.siteId || dto.appId || dto.type) {
      const type = dto.type ?? existing.type;
      const appId = dto.appId === undefined ? existing.appId : dto.appId;
      if (dto.siteId) await this.assertSiteInLegalEntity(orgId, existing.legalEntityId, dto.siteId);
      if (appId) await this.assertAppScope(orgId, type, appId);
    }

    // Splitting must stay possible whenever it is switched on or the gateway under it changes
    const gatewayCode = dto.gatewayCode ?? existing.gatewayCode;
    const splitEnabled = dto.splitEnabled ?? existing.splitEnabled;
    if (dto.splitEnabled === true) assertSplitAvailable();
    if (splitEnabled && (dto.splitEnabled === true || gatewayCode !== existing.gatewayCode)) {
      await this.assertSplitSupported(gatewayCode);
    }
    return this.gatewayConfigService.update(orgId, id, dto, scope);
  }

  // Deletes a config, provided it sits in the caller's scope
  async delete(orgId: string, id: string, scope: PaymentGatewayConfigScope): Promise<SuccessResponseDto> {
    return this.gatewayConfigService.delete(orgId, id, scope);
  }

  // Has the provider check a config's stored credentials and records the pass, after the same scope check
  async verify(
    orgId: string,
    id: string,
    scope: PaymentGatewayConfigScope,
  ): Promise<PaymentGatewayConfigVerificationResponseDto> {
    await this.gatewayConfigService.findById(orgId, id, scope);
    return this.paymentGatewaysGatewayService.verifyConfig(orgId, id);
  }

  // Checks the bank account, site and app named by a create all belong to the organization and legal entity
  private async assertReferences(
    orgId: string,
    legalEntityId: string,
    dto: Pick<CreatePaymentGatewayConfigDto, 'bankAccountId' | 'siteId' | 'appId' | 'type'>,
  ): Promise<void> {
    await this.assertBankAccountInLegalEntity(orgId, legalEntityId, dto.bankAccountId);
    if (dto.siteId) await this.assertSiteInLegalEntity(orgId, legalEntityId, dto.siteId);
    if (dto.appId) await this.assertAppScope(orgId, dto.type, dto.appId);
  }

  // Rejects a bank account that is missing, in another organization, or held by a different legal entity
  private async assertBankAccountInLegalEntity(
    orgId: string,
    legalEntityId: string,
    bankAccountId: string,
  ): Promise<void> {
    const bankAccount = await this.bankAccountRepository.findById(bankAccountId);
    if (!bankAccount || bankAccount.organizationId !== orgId || bankAccount.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Bank Account',
        detail: 'The bank account does not exist or is not held by this legal entity.',
        errors: [{ field: 'bankAccountId', message: 'Unknown bank account' }],
      });
    }
  }

  // Rejects a site that is missing, in another organization, or operated by a different legal entity
  private async assertSiteInLegalEntity(orgId: string, legalEntityId: string, siteId: string): Promise<void> {
    const site = await this.siteRepository.findById(siteId);
    if (!site || site.organizationId !== orgId || site.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Site',
        detail: 'The site does not exist or is not operated by this legal entity.',
        errors: [{ field: 'siteId', message: 'Unknown site' }],
      });
    }
  }

  // Rejects an app that is missing or in another organization, and an app pin on anything but an APP config
  private async assertAppScope(orgId: string, type: PaymentGatewayConfigType, appId: string): Promise<void> {
    const app = await this.appRepository.findByIdInOrg(appId, orgId);
    if (!app) {
      throw new BadRequestException({
        label: 'Invalid App',
        detail: 'The app does not exist or belongs to a different organization.',
        errors: [{ field: 'appId', message: 'Unknown app' }],
      });
    }
    if (type !== PaymentGatewayConfigTypeValues.APP) {
      throw new BadRequestException({
        label: 'Invalid App Scope',
        detail: `Only an ${PaymentGatewayConfigTypeValues.APP} configuration can be pinned to an app; this one is ${type}.`,
        errors: [{ field: 'appId', message: 'Requires type APP' }],
      });
    }
  }

  // Rejects split payments on a gateway payments-service cannot split through
  private async assertSplitSupported(gatewayCode: string): Promise<void> {
    const gateways = await this.paymentGatewaysGatewayService.listGateways();
    if (!gateways.some((gateway) => gateway.code === gatewayCode && gateway.supportsSplit)) {
      throw new BadRequestException({
        label: 'Split Payments Unsupported',
        detail: `${gatewayCode} cannot split collected payments to linked accounts. Turn split payments off or choose another gateway.`,
        errors: [{ field: 'splitEnabled', message: 'Not supported by gateway' }],
      });
    }
  }

  // The tenant surface reads the entity from the x-le-id header; without one there is nothing to scope to
  private requireLegalEntity(legalEntityId: string | undefined): string {
    if (!legalEntityId) throw new BadRequestException('A legal entity context is required.');
    return legalEntityId;
  }
}

const SPLIT_PAYMENTS_AVAILABLE = false;

// Refuses to switch split payments on until they are wired end to end
function assertSplitAvailable(): void {
  if (SPLIT_PAYMENTS_AVAILABLE) return;
  throw new BadRequestException({
    label: 'Split Payments Not Available',
    detail: 'Split payments are not available yet.',
    errors: [{ field: 'splitEnabled', message: 'Not available yet' }],
  });
}
