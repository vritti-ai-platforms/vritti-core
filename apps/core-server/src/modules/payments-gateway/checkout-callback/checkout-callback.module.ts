import { AppDomainModule } from '@domain/app/app.module';
import { Module } from '@nestjs/common';
import { PaymentsGatewayServicesModule } from '../payments-gateway-services.module';
import { CheckoutCallbackController } from './checkout-callback.controller';
import { CheckoutCallbackService } from './services/checkout-callback.service';

// Unprefixed, like PaymentWebhookModule: the gateway's checkout is handed the literal callback path, so this must not
// sit behind a RouterModule prefix
@Module({
  imports: [PaymentsGatewayServicesModule, AppDomainModule],
  controllers: [CheckoutCallbackController],
  providers: [CheckoutCallbackService],
})
export class CheckoutCallbackModule {}
