import { Module } from '@nestjs/common';
import { Msg91HttpService } from './services/msg91-http.service';

/**
 * Infrastructure module, not a domain entity — the MSG91 sibling of `MetaGraphModule`, and imported
 * by domain modules on the same footing (see `WhatsappAccountTemplatesDomainModule`).
 */
@Module({
  providers: [Msg91HttpService],
  exports: [Msg91HttpService],
})
export class Msg91Module {}
