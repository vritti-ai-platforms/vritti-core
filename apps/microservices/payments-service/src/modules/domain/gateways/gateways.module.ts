import { Module } from '@nestjs/common';
import { HdfcRazorpayModule } from '@/gateways/hdfc-razorpay/hdfc-razorpay.module';
import { HdfcRazorpayHttpService } from '@/gateways/hdfc-razorpay/services/hdfc-razorpay-http.service';
import { RazorpayModule } from '@/gateways/razorpay/razorpay.module';
import { RazorpayHttpService } from '@/gateways/razorpay/services/razorpay-http.service';
import { GatewayRegistry } from './gateway-registry';
import { HdfcRazorpayTransport } from './hdfc-razorpay/hdfc-razorpay.transport';
import { RazorpayTransport } from './razorpay/razorpay.transport';

// The registry is built from one factory so the transports are plain instances keyed by code. Every
// gateway is its own standalone class over its own client, bank editions included — HDFC's Razorpay is a copy,
// not a subclass, so it can move apart. Adding one means a folder here, a folder under gateways, and a line below.
@Module({
  imports: [RazorpayModule, HdfcRazorpayModule],
  providers: [
    {
      provide: GatewayRegistry,
      inject: [RazorpayHttpService, HdfcRazorpayHttpService],
      useFactory: (razorpay: RazorpayHttpService, hdfcRazorpay: HdfcRazorpayHttpService) =>
        new GatewayRegistry([new RazorpayTransport(razorpay), new HdfcRazorpayTransport(hdfcRazorpay)]),
    },
  ],
  exports: [GatewayRegistry],
})
export class GatewaysDomainModule {}
