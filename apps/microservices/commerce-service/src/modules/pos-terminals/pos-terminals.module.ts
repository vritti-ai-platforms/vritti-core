import { PosTerminalsDomainModule } from '@domain/pos-terminals/pos-terminals.module';
import { Module } from '@nestjs/common';
import { PosTerminalsController } from './pos-terminals.controller';

@Module({
  imports: [PosTerminalsDomainModule],
  controllers: [PosTerminalsController],
})
export class PosTerminalsModule {}
