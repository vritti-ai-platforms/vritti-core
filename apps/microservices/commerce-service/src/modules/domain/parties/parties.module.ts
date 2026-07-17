import { Module } from '@nestjs/common';
import { PartiesRepository } from './repositories/parties.repository';
import { PartiesService } from './services/parties.service';

@Module({
  providers: [PartiesService, PartiesRepository],
  exports: [PartiesService, PartiesRepository],
})
export class PartiesDomainModule {}
