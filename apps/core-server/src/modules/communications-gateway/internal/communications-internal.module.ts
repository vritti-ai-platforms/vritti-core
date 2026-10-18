import { Module } from '@nestjs/common';
import { CommunicationsGatewayServicesModule } from '../communications-gateway-services.module';
import { CommunicationsInternalController } from './communications-internal.controller';

// The signed internal endpoints must resolve at the literal path `/communications/internal/...` because cloud verifies
// the Ed25519 signature over the exact request path.
@Module({
  imports: [CommunicationsGatewayServicesModule],
  controllers: [CommunicationsInternalController],
})
export class CommunicationsInternalModule {}
