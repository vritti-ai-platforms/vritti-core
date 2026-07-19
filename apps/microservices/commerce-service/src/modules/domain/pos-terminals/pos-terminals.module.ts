import { Module } from '@nestjs/common';
import { PosTerminalsDomainRepository } from './repositories/pos-terminals.repository';
import { PosTerminalsDomainService } from './services/pos-terminals.service';

@Module({
  providers: [PosTerminalsDomainService, PosTerminalsDomainRepository],
  exports: [PosTerminalsDomainService, PosTerminalsDomainRepository],
})
export class PosTerminalsDomainModule {}
