import { MetaGraphModule } from '@domain/meta-graph/meta-graph.module';
import { Module } from '@nestjs/common';
import { WhatsappAccountTemplatesDomainService } from './services/whatsapp-account-templates.service';

@Module({
  imports: [MetaGraphModule],
  providers: [WhatsappAccountTemplatesDomainService],
  exports: [WhatsappAccountTemplatesDomainService],
})
export class WhatsappAccountTemplatesDomainModule {}
