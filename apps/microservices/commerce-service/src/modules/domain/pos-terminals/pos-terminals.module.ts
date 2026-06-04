import { Module } from '@nestjs/common';
import { PosTerminalsRepository } from './repositories/pos-terminals.repository';
import { PosTerminalsService } from './services/pos-terminals.service';

@Module({
  providers: [PosTerminalsService, PosTerminalsRepository],
  exports: [PosTerminalsService, PosTerminalsRepository],
})
export class PosTerminalsDomainModule {}
