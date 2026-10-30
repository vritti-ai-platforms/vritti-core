import { Module } from '@nestjs/common';
import { CashfreeModule } from '@/gateways/cashfree/cashfree.module';
import { CashfreeHttpService } from '@/gateways/cashfree/services/cashfree-http.service';
import { EasebuzzModule } from '@/gateways/easebuzz/easebuzz.module';
import { EasebuzzHttpService } from '@/gateways/easebuzz/services/easebuzz-http.service';
import { HdfcRazorpayModule } from '@/gateways/hdfc-razorpay/hdfc-razorpay.module';
import { HdfcRazorpayHttpService } from '@/gateways/hdfc-razorpay/services/hdfc-razorpay-http.service';
import { RazorpayModule } from '@/gateways/razorpay/razorpay.module';
import { RazorpayHttpService } from '@/gateways/razorpay/services/razorpay-http.service';
import { CashfreeTransport } from './cashfree/cashfree.transport';
import { EasebuzzTransport } from './easebuzz/easebuzz.transport';
import { GatewayRegistry } from './gateway-registry';
import { HdfcRazorpayTransport } from './hdfc-razorpay/hdfc-razorpay.transport';
import { RazorpayTransport } from './razorpay/razorpay.transport';

// The registry is built from one factory so the transports are plain instances keyed by code. Every
// gateway is its own standalone class over its own client, bank editions included — HDFC's Razorpay is a copy,
// not a subclass, so it can move apart. Adding one means a folder here, a folder under gateways, and a line below.
@Module({
  imports: [RazorpayModule, HdfcRazorpayModule, CashfreeModule, EasebuzzModule],
  providers: [
    {
      provide: GatewayRegistry,
      inject: [RazorpayHttpService, HdfcRazorpayHttpService, CashfreeHttpService, EasebuzzHttpService],
      useFactory: (
        razorpay: RazorpayHttpService,
        hdfcRazorpay: HdfcRazorpayHttpService,
        cashfree: CashfreeHttpService,
        easebuzz: EasebuzzHttpService,
      ) =>
        new GatewayRegistry([
          new RazorpayTransport(razorpay),
          new HdfcRazorpayTransport(hdfcRazorpay),
          new CashfreeTransport(cashfree),
          new EasebuzzTransport(easebuzz),
        ]),
    },
  ],
  exports: [GatewayRegistry],
})
export class GatewaysDomainModule {}
