import { SmsProviderTemplatesDomainModule } from '@domain/sms-provider-templates/sms-provider-templates.module';
import { SmsProvidersDomainModule } from '@domain/sms-providers/sms-providers.module';
import { Module } from '@nestjs/common';
import { SmsProvidersService } from './root/services/sms-providers.service';
import { SmsProvidersController } from './root/sms-providers.controller';
import { SmsProvidersInternalController } from './sms-providers-internal.controller';
import { SmsProviderTemplatesService } from './templates/services/sms-provider-templates.service';
import { SmsProviderTemplatesController } from './templates/sms-provider-templates.controller';

@Module({
  imports: [SmsProvidersDomainModule, SmsProviderTemplatesDomainModule],
  controllers: [SmsProvidersController, SmsProvidersInternalController, SmsProviderTemplatesController],
  providers: [SmsProvidersService, SmsProviderTemplatesService],
})
export class OrgSmsProvidersModule {}
