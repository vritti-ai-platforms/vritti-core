import { LocationsDomainModule } from '@domain/locations/locations.module';
import { PosTerminalsDomainModule } from '@domain/pos-terminals/pos-terminals.module';
import { Module } from '@nestjs/common';
import { PosTerminalsController } from './pos-terminals.controller';

@Module({
  imports: [PosTerminalsDomainModule, LocationsDomainModule],
  controllers: [PosTerminalsController],
})
export class PosTerminalsModule {}
