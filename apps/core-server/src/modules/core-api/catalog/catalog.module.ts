import { CatalogDomainModule } from '@domain/catalog/catalog.module';
import { Module } from '@nestjs/common';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { CatalogController } from './controllers/catalog.controller';

@Module({
  imports: [CatalogDomainModule],
  controllers: [CatalogController],
  providers: [WebhookSecretGuard],
})
export class CatalogApiModule {}
