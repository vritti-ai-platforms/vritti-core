import { Module } from '@nestjs/common';
import { EasebuzzHttpService } from './services/easebuzz-http.service';

// A provider client, not a domain: domain modules import it on the same footing as a database driver
@Module({
  providers: [EasebuzzHttpService],
  exports: [EasebuzzHttpService],
})
export class EasebuzzModule {}
