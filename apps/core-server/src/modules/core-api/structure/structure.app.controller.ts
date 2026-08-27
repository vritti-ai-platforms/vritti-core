import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { AppTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators';
import type { WorkspaceOption, Workspaces } from './graphql/workspace.type';
import { StructureService } from './root/services/structure-api.service';

/**
 * The REST counterpart of `structure.app.resolver.ts`, for `HTTP` credentials.
 *
 * Its own `app/` segment because `StructureController` already owns `structure` under
 * this module's prefix. An `HTTP` app needs discovery for the same reason a `GRAPHQL`
 * one does — otherwise the only way to name a scope is to hardcode an id.
 */
@ApiTags('Structure (App)')
@Require(AuthType.App, AppTypeValues.HTTP)
@Controller('app/workspaces')
export class StructureAppController {
  private readonly logger = new Logger(StructureAppController.name);

  constructor(private readonly structureService: StructureService) {}

  @Get()
  async list(@OrgId() orgId: string): Promise<Workspaces> {
    this.logger.log('GET /core-api/app/workspaces');
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
