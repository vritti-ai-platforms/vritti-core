import { MetaGraphModule } from '@domain/meta-graph/meta-graph.module';
import { Module } from '@nestjs/common';
import { WhatsappEmbeddedSignupDomainService } from './services/whatsapp-embedded-signup.service';

@Module({
  imports: [MetaGraphModule],
  providers: [WhatsappEmbeddedSignupDomainService],
  exports: [WhatsappEmbeddedSignupDomainService],
})
export class WhatsappEmbeddedSignupDomainModule {}
