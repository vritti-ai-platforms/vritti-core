import { Module } from '@nestjs/common';
import { SessionRepository } from './repositories/session.repository';
import { SessionService } from './services/session.service';

@Module({
  providers: [SessionService, SessionRepository],
  exports: [SessionService, SessionRepository],
})
export class SessionDomainModule {}
