import { Controller, Get, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import { OrgIdHeader } from '@/security/decorators';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import { StructureResponseDto } from '../dto/response/structure-response.dto';
import { ApiGetStructure } from './docs/structure.docs';
import { StructureApiService } from './services/structure-api.service';

@ApiTags('Structure')
@Controller('structure/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class StructureController {
  private readonly logger = new Logger(StructureController.name);

  constructor(private readonly structureApiService: StructureApiService) {}

  // Returns the organization's structure aggregate: org, legal entities, tax registrations, site groups, sites
  @Get()
  @ApiGetStructure()
  async getStructure(@OrgIdHeader() orgId: string): Promise<StructureResponseDto> {
    this.logger.log(`GET /structure/internal — org ${orgId}`);
    return this.structureApiService.getStructure(orgId);
  }
}
