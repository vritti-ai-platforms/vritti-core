import { Module } from '@nestjs/common';
import { StructureAppResolver } from './structure.app.resolver';
import { StructureServicesModule } from './structure-services.module';

/**
 * The external-app GraphQL surface for organization structure.
 *
 * Sibling of `CommerceAppGatewayModule`. `include` walks imports transitively, so this closure
 * must hold no internal resolver — hence importing `StructureServicesModule` (services only)
 * rather than `StructureApiModule`.
 */
@Module({
  imports: [StructureServicesModule],
  providers: [StructureAppResolver],
})
export class StructureAppApiModule {}
