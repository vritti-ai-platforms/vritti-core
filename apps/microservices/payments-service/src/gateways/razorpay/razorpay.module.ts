import { Module } from '@nestjs/common';
import { RazorpayHttpService } from './services/razorpay-http.service';

// A provider client, not a domain: domain modules import it on the same footing as a database driver
@Module({
  providers: [RazorpayHttpService],
  exports: [RazorpayHttpService],
})
export class RazorpayModule {}
