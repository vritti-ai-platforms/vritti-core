import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { AppLegalEntity } from '../graphql/app-legal-entity.type';

@Injectable()
export class LegalEntityAppService {
  private readonly logger = new Logger(LegalEntityAppService.name);

  constructor(private readonly legalEntityRepository: LegalEntityDomainRepository) {}

  /**
   * The legal entities an organization may sell as.
   *
   * Reads the repository rather than the structure aggregate: that one also pulls site groups and tax
   * registrations, none of which a storefront renders, and each is a query it would pay for on a menu
   * it never shows.
   *
   * Active only, narrowed in SQL: an entity switched off is not somewhere to sell, and one already
   * held in a session stops resolving — which reads as "that closed" rather than as an error.
   */
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
