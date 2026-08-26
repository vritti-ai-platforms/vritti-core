import { MetaGraphModule } from '@domain/meta-graph/meta-graph.module';
import { WhatsappAccountsDomainModule } from '@domain/whatsapp-accounts/whatsapp-accounts.module';
import { Module } from '@nestjs/common';
import { WhatsappAccountTemplatesDomainService } from './services/whatsapp-account-templates.service';

@Module({
  imports: [WhatsappAccountsDomainModule, MetaGraphModule],
  providers: [WhatsappAccountTemplatesDomainService],
  exports: [WhatsappAccountTemplatesDomainService],
})
export class WhatsappAccountTemplatesDomainModule {}
