import { Module } from '@nestjs/common';
import { GiteaGatewayModule } from '../gitea-gateway.module';
import { GiteaInternalController } from './gitea-internal.controller';

// The signed internal endpoint must resolve at the literal path `/gitea/internal/...` because
// CloudSignatureGuard verifies the Ed25519 signature over the exact request path. It therefore lives
// in its own unprefixed module (mirroring CatalogApiModule) rather than in GiteaGatewayModule, which
// is mounted behind the `gitea-api` RouterModule prefix. The minting service stays a provider/export
// of GiteaGatewayModule so it can reuse the private GiteaHttpService.
@Module({
  imports: [GiteaGatewayModule],
  controllers: [GiteaInternalController],
})
export class GiteaInternalModule {}
