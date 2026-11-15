import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type LegalEntityContext, LegalEntityContextCacheService } from './legal-entity-context-cache.service';

@Injectable()
export class LegalEntityContextResolverService {
  constructor(
    private readonly cache: LegalEntityContextCacheService,
    private readonly legalEntityRepository: LegalEntityDomainRepository,
  ) {}

  // Resolves a legal entity's context (its currency) through the cache
  async resolve(legalEntityId: string): Promise<LegalEntityContext> {
    const cached = await this.cache.get(legalEntityId);
    if (cached) return cached;

    const legalEntity = await this.legalEntityRepository.findById(legalEntityId);
    if (!legalEntity) {
      throw new NotFoundException('Legal entity not found.');
    }

    const context: LegalEntityContext = { leCurrencyCode: legalEntity.currencyCode };
    await this.cache.set(legalEntityId, context);
    return context;
  }
}
