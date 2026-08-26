import { MetaGraphModule } from '@domain/meta-graph/meta-graph.module';
import { WhatsappAccountsDomainModule } from '@domain/whatsapp-accounts/whatsapp-accounts.module';
import { Module } from '@nestjs/common';
import { WhatsappAccountPhoneNumbersDomainService } from './services/whatsapp-account-phone-numbers.service';

@Module({
  imports: [WhatsappAccountsDomainModule, MetaGraphModule],
  providers: [WhatsappAccountPhoneNumbersDomainService],
  exports: [WhatsappAccountPhoneNumbersDomainService],
})
export class WhatsappAccountPhoneNumbersDomainModule {}
