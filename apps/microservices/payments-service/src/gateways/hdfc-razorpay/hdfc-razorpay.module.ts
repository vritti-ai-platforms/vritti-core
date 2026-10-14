import { Module } from '@nestjs/common';
import { HdfcRazorpayHttpService } from './services/hdfc-razorpay-http.service';

// A provider client, not a domain: domain modules import it on the same footing as a database driver
@Module({
  providers: [HdfcRazorpayHttpService],
  exports: [HdfcRazorpayHttpService],
})
export class HdfcRazorpayModule {}
