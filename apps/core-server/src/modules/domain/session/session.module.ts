import { Module } from '@nestjs/common';
import { SessionDomainRepository } from './repositories/session.repository';
import { SessionDomainService } from './services/session.service';

@Module({
  providers: [SessionDomainService, SessionDomainRepository],
  exports: [SessionDomainService, SessionDomainRepository],
})
export class SessionDomainModule {}
