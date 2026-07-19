import { Module } from '@nestjs/common';
import { PartiesDomainRepository } from './repositories/parties.repository';
import { PartiesDomainService } from './services/parties.service';

@Module({
  providers: [PartiesDomainService, PartiesDomainRepository],
  exports: [PartiesDomainService, PartiesDomainRepository],
})
export class PartiesDomainModule {}
