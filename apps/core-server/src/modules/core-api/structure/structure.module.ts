import { Module } from '@nestjs/common';
import { LegalEntityController } from './legal-entities/legal-entity.controller';
import { StructureController } from './root/structure.controller';
import { SiteGroupController } from './site-groups/site-group.controller';
import { SiteController } from './sites/site.controller';
import { StructureAppController } from './structure.app.controller';
import { StructureServicesModule } from './structure-services.module';

// The internal structure surface: controllers only. Services come from StructureServicesModule so
// the external-app surface can reach them without importing this module's resolvers.
@Module({
  imports: [StructureServicesModule],
  controllers: [
    StructureController,
    LegalEntityController,
    SiteController,
    SiteGroupController,
    StructureAppController,
  ],
})
export class StructureApiModule {}
