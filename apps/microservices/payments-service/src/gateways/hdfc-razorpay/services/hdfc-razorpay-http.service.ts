import { Injectable } from '@nestjs/common';
import { RazorpayHttpService } from '../../razorpay/services/razorpay-http.service';

// The HDFC integration kit names no dedicated host — every call in it goes to the stock Razorpay API
// with HDFC-issued keys. Replace this when Razorpay hands the bank its own endpoint; the API version
// (v1 / v2) is appended per call by the base client, so only the host belongs here.
const HDFC_RAZORPAY_API_HOST = 'https://api.razorpay.com';

// HTTP client for HDFC Bank's edition of Razorpay. The wire protocol is Razorpay's, so the base
// client does the work; this class is where the bank's own host, timeouts, headers or error codes
// land when its deployment moves on a different schedule from stock Razorpay.
@Injectable()
export class HdfcRazorpayHttpService extends RazorpayHttpService {
  // Points every call at the bank edition's host
  protected override host(): string {
    return HDFC_RAZORPAY_API_HOST;
  }
}
