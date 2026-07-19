import { Module } from '@nestjs/common';
import { MediaDomainRepository } from './repositories/media.repository';
import { MediaDomainService } from './services/media.service';
import { R2StorageProvider } from './storage/r2-storage.provider';
import { StorageFactory } from './storage/storage.factory';

@Module({
  providers: [MediaDomainService, MediaDomainRepository, R2StorageProvider, StorageFactory],
  exports: [MediaDomainService],
})
export class MediaDomainModule {}
