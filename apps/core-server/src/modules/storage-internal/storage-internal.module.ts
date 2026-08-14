import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { Module } from '@nestjs/common';
import { StorageInternalController } from './storage-internal.controller';

// The signed internal endpoint must resolve at the literal path `/storage/internal/...` because CloudSignatureGuard
// verifies the Ed25519 signature over the exact request path. It therefore lives in its own unprefixed module
// (mirroring GiteaInternalModule / CatalogApiModule) rather than behind a RouterModule prefix. It pulls the org row
// via the exported OrganizationDomainService.
@Module({
  imports: [OrganizationDomainModule],
  controllers: [StorageInternalController],
})
export class StorageInternalModule {}
