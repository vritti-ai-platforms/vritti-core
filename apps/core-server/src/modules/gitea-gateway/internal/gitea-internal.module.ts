import { Module } from '@nestjs/common';
import { GiteaGatewayModule } from '../gitea-gateway.module';
import { GiteaInternalController } from './gitea-internal.controller';

// The signed internal endpoint must resolve at the literal path `/gitea/internal/...` because Cloud verification checks
// the Ed25519 signature over the exact request path.
@Module({
  imports: [GiteaGatewayModule],
  controllers: [GiteaInternalController],
})
export class GiteaInternalModule {}
