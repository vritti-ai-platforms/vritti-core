import { LocationsDomainModule } from '@domain/locations/locations.module';
import { PosTerminalsDomainModule } from '@domain/pos-terminals/pos-terminals.module';
import { Module } from '@nestjs/common';
import { PosTerminalsController } from './pos-terminals.controller';
import { PosTerminalsService } from './services/pos-terminals.service';

@Module({
  imports: [PosTerminalsDomainModule, LocationsDomainModule],
  controllers: [PosTerminalsController],
  providers: [PosTerminalsService],
})
export class SitePosTerminalsModule {}
