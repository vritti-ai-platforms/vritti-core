import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { RequireApp } from '@vritti/api-sdk/auth';
import { AppTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators';
import { WorkspaceOption, Workspaces } from './graphql/workspace.type';
import { StructureService } from './root/services/structure-api.service';

/**
 * Which scopes an app may act within.
 *
 * Without this an app has to hardcode a site or legal-entity id, because core accepts a
 * scope header but never told the caller what the valid values are. Discovery closes
 * that: list the options, let the app (or its user) pick one, then send it as the
 * matching header.
 *
 * `@OrgId()` reads `sessionInfo.organizationId`, which the app path now fills from the
 * credential — so the organization is never a parameter here and an app cannot ask what
 * another organization contains.
 */
@Resolver()
@RequireApp(AppTypeValues.GRAPHQL)
export class StructureAppResolver {
  private readonly logger = new Logger(StructureAppResolver.name);

  constructor(private readonly structureService: StructureService) {}

  @Query(() => Workspaces, { name: 'workspaces' })
  async workspaces(@OrgId() orgId: string): Promise<Workspaces> {
    this.logger.log('QUERY workspaces');
    const structure = await this.structureService.getStructure(orgId);

    return {
      legalEntities: structure.legalEntities.map(
        (le): WorkspaceOption => ({ kind: 'le', id: le.id, name: le.name, code: le.code, parentId: le.parentId }),
      ),
      siteGroups: structure.siteGroups.map(
        (group): WorkspaceOption => ({
          kind: 'group',
          id: group.id,
          name: group.name,
          code: group.code,
          parentId: group.parentId,
        }),
      ),
      // A site's parent is its legal entity: that is the chain row-level security walks
      // when a site scope is set, so it is the useful parent to show.
      sites: structure.sites.map(
        (site): WorkspaceOption => ({
          kind: 'site',
          id: site.id,
          name: site.name,
          code: site.code,
          parentId: site.legalEntityId,
        }),
      ),
    };
  }
}
