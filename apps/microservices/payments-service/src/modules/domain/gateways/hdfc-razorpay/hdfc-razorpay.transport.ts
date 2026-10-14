import type { HdfcRazorpayHttpService } from '@/gateways/hdfc-razorpay/services/hdfc-razorpay-http.service';
import { GatewayCodeValues } from '../gateway-transport';
import { RazorpayTransport } from '../razorpay/razorpay.transport';

// HDFC Bank's edition of Razorpay (the SmartHub VAS integration kit). The protocol is Razorpay's, so
// the base transport does the work; this class is the gateway's own identity — its code, its own
// client under gateways/hdfc-razorpay, and the place HDFC-only behaviour lands (VAS
// notes, API version pins) when the bank's integration moves on a different schedule from stock Razorpay.
export class HdfcRazorpayTransport extends RazorpayTransport {
  constructor(http: HdfcRazorpayHttpService) {
    super(http, GatewayCodeValues.HDFC_RAZORPAY);
  }
}
