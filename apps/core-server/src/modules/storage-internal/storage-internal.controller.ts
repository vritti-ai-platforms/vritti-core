import { OrganizationDomainService } from '@domain/organization/services/organization.service';
import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { ApiGetOrgStorage } from './docs/storage-internal.docs';
import { OrgStorageBodyDto } from './dto/request/org-storage-body.dto';
import { OrgStorageResponseDto } from './dto/response/org-storage-response.dto';

// Signed-internal read for cloud-server: it has no core session, so the org subdomain arrives in the trusted
// signed body and the whole controller is CloudSignatureGuard-gated (mirrors GiteaInternalController's reads).
@ApiTags('Storage - Internal')
@Controller('storage/internal')
@Public()
@SkipCsrf()
export class StorageInternalController {
  private readonly logger = new Logger(StorageInternalController.name);

  constructor(private readonly organizationService: OrganizationDomainService) {}

  // Returns the org's full object-storage descriptor; owner comes from the trusted signed body
  @Post('org-storage')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CloudSignatureGuard)
  @ApiGetOrgStorage()
  async getOrgStorage(@Body() body: OrgStorageBodyDto): Promise<OrgStorageResponseDto> {
    this.logger.log(`POST /storage/internal/org-storage (owner=${body.owner})`);
    const storage = await this.organizationService.getStorageBySubdomain(body.owner);
    return OrgStorageResponseDto.from(storage);
  }
}
