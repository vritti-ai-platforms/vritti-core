import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { Module } from '@nestjs/common';
import { StorageInternalController } from './storage-internal.controller';

// The signed internal endpoint must resolve at the literal path `/storage/internal/...` because cloud verification
// verifies the Ed25519 signature over the exact request path.
@Module({
  imports: [OrganizationDomainModule],
  controllers: [StorageInternalController],
})
export class StorageInternalModule {}
