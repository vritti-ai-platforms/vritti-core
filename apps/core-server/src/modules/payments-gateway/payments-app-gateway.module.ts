import { Module } from '@nestjs/common';
import { PaymentIntentsAppResolver } from './intents/payment-intents.app.resolver';
import { PaymentsGatewayServicesModule } from './payments-gateway-services.module';

// The external-app GraphQL surface for payments — resolver-free imports only, so the app schema stays its own
@Module({
  imports: [PaymentsGatewayServicesModule],
  providers: [PaymentIntentsAppResolver],
})
export class PaymentsAppGatewayModule {}
