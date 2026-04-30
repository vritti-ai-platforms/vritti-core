import { StorageLocationsDomainModule } from '@domain/storage-locations/storage-locations.module';
import { Module } from '@nestjs/common';
import { PosTerminalsRepository } from './repositories/pos-terminals.repository';
import { PosTerminalsService } from './services/pos-terminals.service';

@Module({
  imports: [StorageLocationsDomainModule],
  providers: [PosTerminalsService, PosTerminalsRepository],
  exports: [PosTerminalsService, PosTerminalsRepository],
})
export class PosTerminalsDomainModule {}
