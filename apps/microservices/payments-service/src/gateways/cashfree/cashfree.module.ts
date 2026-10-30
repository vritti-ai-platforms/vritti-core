import { Module } from '@nestjs/common';
import { CashfreeHttpService } from './services/cashfree-http.service';

// A provider client, not a domain: domain modules import it on the same footing as a database driver
@Module({
  providers: [CashfreeHttpService],
  exports: [CashfreeHttpService],
})
export class CashfreeModule {}
