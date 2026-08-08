import { forwardRef, Module } from '@nestjs/common';
import { OrganizationDomainModule } from '../organization/organization.module';
import { MediaDomainRepository } from './repositories/media.repository';
import { MediaDomainService } from './services/media.service';
import { MediaGcService } from './services/media-gc.service';
import { OrgStorageResolverService } from './storage/org-storage-resolver.service';

// No process-wide StorageFactory: every client is built from the org's own credentials by OrgStorageResolverService,
// so there is no deployment-level provider to register here.
@Module({
  imports: [forwardRef(() => OrganizationDomainModule)],
  providers: [MediaDomainService, MediaGcService, MediaDomainRepository, OrgStorageResolverService],
  exports: [MediaDomainService, MediaGcService],
})
export class MediaDomainModule {}
