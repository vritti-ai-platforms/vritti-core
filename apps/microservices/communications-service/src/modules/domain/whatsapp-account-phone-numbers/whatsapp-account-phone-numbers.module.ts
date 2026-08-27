import { MetaGraphModule } from '@domain/meta-graph/meta-graph.module';
import { Module } from '@nestjs/common';
import { WhatsappAccountPhoneNumbersDomainService } from './services/whatsapp-account-phone-numbers.service';

@Module({
  imports: [MetaGraphModule],
  providers: [WhatsappAccountPhoneNumbersDomainService],
  exports: [WhatsappAccountPhoneNumbersDomainService],
})
export class WhatsappAccountPhoneNumbersDomainModule {}
