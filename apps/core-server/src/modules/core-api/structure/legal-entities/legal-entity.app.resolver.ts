import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { AppTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { AppLegalEntity } from './graphql/app-legal-entity.type';
import { LegalEntityAppService } from './services/legal-entity-app.service';

// Where a storefront may sell from, for an app credential.
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
export class LegalEntityAppResolver {
  private readonly logger = new Logger(LegalEntityAppResolver.name);

  constructor(private readonly legalEntityAppService: LegalEntityAppService) {}

  // The legal entities this credential's organization may sell as.
  @Query(() => [AppLegalEntity], { name: 'appLegalEntities' })
  appLegalEntities(@OrgId() orgId: string): Promise<AppLegalEntity[]> {
    this.logger.log('QUERY appLegalEntities');
    return this.legalEntityAppService.listForApp(orgId);
  }
}
