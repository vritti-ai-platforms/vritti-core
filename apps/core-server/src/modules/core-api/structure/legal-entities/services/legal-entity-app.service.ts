import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { AppLegalEntity } from '../graphql/app-legal-entity.type';

@Injectable()
export class LegalEntityAppService {
  private readonly logger = new Logger(LegalEntityAppService.name);

  constructor(private readonly legalEntityRepository: LegalEntityDomainRepository) {}

  // The legal entities an organization may sell as.
  async listForApp(orgId: string): Promise<AppLegalEntity[]> {
    const entities = await this.legalEntityRepository.findActiveByOrg(orgId);

    const offered = entities.map((entity) => ({
      id: entity.id,
      code: entity.code,
      name: entity.name,
      currencyCode: entity.currencyCode,
      country: entity.country,
      sortOrder: entity.sortOrder,
    }));

    this.logger.log(`Legal entities for org ${orgId}: ${offered.length}`);
    return offered;
  }
}
